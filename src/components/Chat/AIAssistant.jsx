import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { Send, Bot, User, Lightbulb, BookOpen, Target, Clock, Trash2, X, AlertCircle, Sparkles } from 'lucide-react'
import { format } from 'date-fns'
import Notification from '../UI/Notification'
import ConfirmModal from '../UI/ConfirmModal'
import { fetchGemini } from '../../lib/ai-retry'

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash-lite:generateContent'

// Simple markdown renderer
const renderMarkdown = (text) => {
  if (!text) return ''
  const lines = text.split('\n')
  let html = ''
  let inList = false

  for (let line of lines) {
    // Headers
    if (line.startsWith('### ')) { html += `<h3>${line.slice(4)}</h3>`; continue }
    if (line.startsWith('## ')) { html += `<h2>${line.slice(3)}</h2>`; continue }
    if (line.startsWith('# ')) { html += `<h1>${line.slice(2)}</h1>`; continue }
    
    // Bold and italic
    line = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    line = line.replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Inline code
    line = line.replace(/`(.+?)`/g, '<code>$1</code>')
    
    // List items
    if (line.match(/^[\-\*]\s/)) {
      if (!inList) { html += '<ul>'; inList = true }
      html += `<li>${line.slice(2)}</li>`
      continue
    } else if (line.match(/^\d+\.\s/)) {
      if (!inList) { html += '<ol>'; inList = true }
      html += `<li>${line.replace(/^\d+\.\s/, '')}</li>`
      continue
    } else if (inList) {
      html += inList ? '</ul>' : '</ol>'
      inList = false
    }

    if (line.trim() === '') { html += '<br/>'; continue }
    html += `<p>${line}</p>`
  }
  if (inList) html += '</ul>'
  return html
}

const AIAssistant = () => {
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [notification, setNotification] = useState(null)
  const [confirmModal, setConfirmModal] = useState(null)
  const [userContext, setUserContext] = useState('')
  const messagesEndRef = useRef(null)

  useEffect(() => {
    if (user) {
      fetchChatHistory()
      fetchUserContext()
    }
  }, [user])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const showNotification = (type, message) => {
    setNotification({ type, message })
  }

  const fetchUserContext = async () => {
    if (!supabase) return
    try {
      const { data: courses } = await supabase.from('courses').select('name, code, target_grade').eq('user_id', user.id)
      const { data: tasks } = await supabase.from('tasks').select('title, due_date, completed, priority').eq('user_id', user.id).eq('completed', false).order('due_date', { ascending: true }).limit(10)
      const { data: upcomingExams } = await supabase.from('exams').select('name, date').eq('user_id', user.id).gte('date', format(new Date(), 'yyyy-MM-dd')).order('date', { ascending: true }).limit(5)

      let ctx = ''
      if (courses?.length) ctx += `Courses: ${courses.map(c => `${c.name} (${c.code || 'no code'}, target: ${c.target_grade || 'not set'})`).join('; ')}. `
      if (tasks?.length) ctx += `Pending tasks: ${tasks.map(t => `"${t.title}" (${t.priority}, due: ${t.due_date || 'no date'})`).join('; ')}. `
      if (upcomingExams?.length) ctx += `Upcoming exams: ${upcomingExams.map(e => `${e.name} on ${format(new Date(e.date), 'MMM d')}`).join('; ')}. `
      setUserContext(ctx)
    } catch (error) {
      console.error('Error fetching context:', error)
    }
  }

  const fetchChatHistory = async () => {
    try {
      if (!supabase) {
        setMessages([{ id: 'welcome', type: 'ai', content: `Hello! I'm your AI study assistant powered by Gemini. I can help you with study tips, time management, goal setting, and academic planning. What would you like to know?`, timestamp: new Date().toISOString() }])
        return
      }

      const { data, error } = await supabase.from('chat_messages').select('*').eq('user_id', user.id).order('created_at', { ascending: true }).limit(50)
      if (error) throw error

      if (data?.length > 0) {
        setMessages(data.map(msg => ({ id: msg.id, type: msg.type, content: msg.content, timestamp: msg.created_at })))
      } else {
        setMessages([{ id: 'welcome', type: 'ai', content: `Hello ${user?.user_metadata?.username || 'there'}! 👋 I'm your AI study assistant powered by Gemini. I can help with study tips, time management, goal setting, and academic planning. What would you like to know?`, timestamp: new Date().toISOString() }])
      }
    } catch (error) {
      console.error('Error:', error)
      showNotification('error', 'Failed to load chat history')
    }
  }

  const callGeminiAPI = async (userMessage) => {
    if (!GEMINI_API_KEY) {
      showNotification('error', 'Gemini API key not configured')
      throw new Error('API key not configured')
    }

    try {
      const contextInfo = userContext ? `\n\nHere is the student's current data for personalized advice:\n${userContext}` : ''

      const enhancedPrompt = `You are an AI study assistant helping students with their academic goals.${contextInfo}

A student is asking: "${userMessage}"

Please provide helpful, encouraging, and practical advice. Keep responses concise but informative. Use markdown formatting (bold, lists, headers) to structure your response clearly. If the question relates to their specific courses or tasks, reference those directly.`

      const data = await fetchGemini(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: enhancedPrompt }] }] })
      })

      return data.candidates?.[0]?.content?.parts?.[0]?.text || 'Unexpected response format.'
    } catch (error) {
      let friendlyMsg = error.message;
      if (error.message.includes('429') || error.message.includes('rate limit')) {
        friendlyMsg = 'Rate limit exceeded. Please wait a moment.';
      }
      showNotification('error', friendlyMsg || 'Failed to get AI response')
      throw error
    }
  }

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    const userMessage = { id: Date.now(), type: 'user', content: inputMessage, timestamp: new Date().toISOString() }
    setMessages(prev => [...prev, userMessage])
    const messageToSend = inputMessage
    setInputMessage('')
    setIsLoading(true)

    try {
      if (supabase) await supabase.from('chat_messages').insert([{ user_id: user.id, type: 'user', content: messageToSend }])
      const aiResponse = await callGeminiAPI(messageToSend)
      const aiMessage = { id: Date.now() + 1, type: 'ai', content: aiResponse, timestamp: new Date().toISOString() }
      setMessages(prev => [...prev, aiMessage])
      if (supabase) await supabase.from('chat_messages').insert([{ user_id: user.id, type: 'ai', content: aiResponse }])
    } catch (error) {
      setMessages(prev => [...prev, { id: Date.now() + 1, type: 'error', content: error.message || "Something went wrong. Check your API configuration.", timestamp: new Date().toISOString() }])
    } finally {
      setIsLoading(false)
    }
  }

  const deleteMessage = async (messageId) => {
    if (messageId === 'welcome') { setMessages(prev => prev.filter(msg => msg.id !== messageId)); return }
    setConfirmModal({
      title: 'Delete Message', message: 'Delete this message?',
      onConfirm: async () => {
        try {
          if (supabase) await supabase.from('chat_messages').delete().eq('id', messageId)
          setMessages(prev => prev.filter(msg => msg.id !== messageId))
          showNotification('success', 'Message deleted')
        } catch (error) { showNotification('error', 'Failed to delete') }
        finally { setConfirmModal(null) }
      },
      onCancel: () => setConfirmModal(null)
    })
  }

  const clearAllChat = async () => {
    setConfirmModal({
      title: 'Clear All Chat', message: 'Delete all chat history? This cannot be undone.',
      onConfirm: async () => {
        try {
          if (supabase) await supabase.from('chat_messages').delete().eq('user_id', user.id)
          setMessages([{ id: 'welcome', type: 'ai', content: `Hello ${user?.user_metadata?.username || 'there'}! 👋 Chat cleared. How can I help you?`, timestamp: new Date().toISOString() }])
          showNotification('success', 'Chat history cleared')
        } catch (error) { showNotification('error', 'Failed to clear') }
        finally { setConfirmModal(null) }
      },
      onCancel: () => setConfirmModal(null)
    })
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  const quickActions = [
    { icon: Lightbulb, text: "Study tips", message: "Give me effective study tips for retaining information", color: "from-amber-400 to-orange-500" },
    { icon: Clock, text: "Time management", message: "How can I manage my study time better?", color: "from-blue-400 to-indigo-500" },
    { icon: Target, text: "Set goals", message: "Help me set SMART academic goals for this semester", color: "from-emerald-400 to-green-500" },
    { icon: BookOpen, text: "Exam prep", message: "What's the best way to prepare for exams?", color: "from-purple-400 to-pink-500" }
  ]

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col animate-fade-in">
      {notification && <Notification type={notification.type} message={notification.message} onClose={() => setNotification(null)} />}
      {confirmModal && <ConfirmModal isOpen={true} title={confirmModal.title} message={confirmModal.message} onConfirm={confirmModal.onConfirm} onCancel={confirmModal.onCancel} variant="danger" />}

      {/* Header */}
      <div className="bg-white rounded-t-[3rem] border-x-2 border-t-2 border-[#F3EFE9] p-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 bg-[#F2F8F5] flex items-center justify-center rounded-2xl border-2 border-[#98B4A6]/20 shadow-sm shadow-[#98B4A6]/10">
              <Bot className="w-7 h-7 text-[#98B4A6]" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-800 tracking-tight">AI Assistant</h1>
              <p className="text-[10px] text-[#98B4A6] font-black uppercase tracking-widest flex items-center space-x-1.5 mt-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Powered by Google Gemini • Personalized to your profile</span>
              </p>
            </div>
          </div>
          <button onClick={clearAllChat} className="flex items-center space-x-2 px-6 py-3 bg-[#FDF2F2] text-[#E8B4B8] rounded-[1.5rem] hover:bg-[#FBE8E8] transition-all text-[10px] font-black uppercase tracking-widest border border-[#E8B4B8]/20">
            <Trash2 className="w-4 h-4" /><span>Clear Chat</span>
          </button>
        </div>
        {!GEMINI_API_KEY && (
          <div className="mt-6 bg-[#FFF9F2] border-2 border-[#D4A373]/20 rounded-2xl p-4 flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-[#D4A373] flex-shrink-0 mt-0.5" />
            <div className="text-[10px] text-[#D4A373] font-black uppercase tracking-widest">
              <p>API Key Not Configured</p>
              <p className="opacity-70 mt-1">Add VITE_GEMINI_API_KEY to your environment</p>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-[#FCFAF7] px-8 py-4 border-x-2 border-[#F3EFE9]">
        <div className="flex flex-wrap gap-3">
          {quickActions.map((action, index) => {
            const Icon = action.icon
            return (
              <button key={index} onClick={() => { setInputMessage(action.message); setTimeout(() => sendMessage(), 100) }} disabled={isLoading}
                className="flex items-center space-x-3 bg-white px-5 py-2.5 rounded-[1.5rem] border-2 border-[#F3EFE9] hover:border-[#98B4A6] hover:shadow-lg transition-all text-[10px] font-black uppercase tracking-widest disabled:opacity-50 group shadow-sm"
              >
                <div className={`p-1.5 rounded-lg bg-[#F2F8F5] border border-[#98B4A6]/10`}>
                  <Icon className="w-4 h-4 text-[#98B4A6]" />
                </div>
                <span className="text-gray-500 group-hover:text-[#98B4A6] transition-colors">{action.text}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-[#FCFAF7]/30 border-x-2 border-[#F3EFE9]">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex space-x-4 max-w-[85%] ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
              <div className={`w-10 h-10 flex items-center justify-center rounded-2xl flex-shrink-0 shadow-sm border-2 ${message.type === 'user' ? 'bg-[#FCFAF7] border-[#F3EFE9]' : 'bg-[#F2F8F5] border-[#98B4A6]/20'}`}>
                {message.type === 'user' ? <User className="w-5 h-5 text-gray-400" /> : <Bot className="w-5 h-5 text-[#98B4A6]" />}
              </div>
              <div className="flex-1">
                <div className={`rounded-[2rem] px-6 py-4 shadow-sm ${
                  message.type === 'user' ? 'bg-white border-2 border-[#F3EFE9] text-gray-700 rounded-tr-md' :
                  message.type === 'error' ? 'bg-[#FDF2F2] border-2 border-[#E8B4B8]/30 text-[#E8B4B8] rounded-tl-md' :
                  'bg-white border-2 border-[#98B4A6]/10 text-gray-800 rounded-tl-md'
                }`}>
                  {message.type === 'error' && (
                    <div className="flex items-center space-x-1.5 mb-2">
                      <AlertCircle className="w-4 h-4 text-[#E8B4B8]" />
                      <span className="font-black text-[10px] uppercase tracking-widest">System Alert</span>
                    </div>
                  )}
                  {message.type === 'ai' ? (
                    <div className="chat-markdown text-sm leading-relaxed font-medium" dangerouslySetInnerHTML={{ __html: renderMarkdown(message.content) }} />
                  ) : (
                    <div className="text-sm font-medium leading-relaxed whitespace-pre-wrap">{message.content}</div>
                  )}
                  <div className={`text-[9px] font-black uppercase tracking-widest mt-4 flex items-center justify-between ${message.type === 'user' ? 'text-gray-300' : 'text-[#98B4A6]/40'}`}>
                    <span>{format(new Date(message.timestamp), 'h:mm a')}</span>
                    <button onClick={() => deleteMessage(message.id)} className={`ml-4 p-1.5 rounded-xl transition-all hover:bg-gray-50`} title="Delete">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex space-x-4">
              <div className="w-10 h-10 flex items-center justify-center bg-[#F2F8F5] rounded-2xl border-2 border-[#98B4A6]/20 shadow-sm"><Bot className="w-5 h-5 text-[#98B4A6]" /></div>
              <div className="bg-white border-2 border-[#98B4A6]/10 rounded-[2rem] rounded-tl-md px-6 py-4 shadow-sm">
                <div className="flex space-x-2">
                  <div className="w-2.5 h-2.5 bg-[#98B4A6]/40 rounded-full animate-bounce" />
                  <div className="w-2.5 h-2.5 bg-[#98B4A6]/40 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                  <div className="w-2.5 h-2.5 bg-[#98B4A6]/40 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white rounded-b-[3rem] border-x-2 border-b-2 border-[#F3EFE9] p-6 shadow-card relative">
        <div className="flex space-x-4">
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask anything about your studies..."
            className="flex-1 resize-none border-2 border-[#F3EFE9] rounded-[1.5rem] px-6 py-4 focus:ring-0 focus:border-[#98B4A6] text-sm bg-[#FCFAF7] font-medium placeholder:text-gray-300 transition-all min-h-[56px]"
            rows="1"
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={!inputMessage.trim() || isLoading || !GEMINI_API_KEY}
            className="bg-[#98B4A6] text-white w-14 h-14 flex items-center justify-center rounded-[1.5rem] hover:bg-[#6B8E7E] transition-all disabled:opacity-30 shadow-lg shadow-[#98B4A6]/20 group"
          >
            <Send className="w-5 h-5 group-hover:scale-110 transition-transform" />
          </button>
        </div>
        <div className="flex items-center justify-between mt-3 px-2">
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Enter to send • Shift+Enter for new line</p>
          {!GEMINI_API_KEY && <p className="text-[9px] font-black text-[#E8B4B8] uppercase tracking-widest">API key required</p>}
        </div>
      </div>
    </div>
  )
}

export default AIAssistant
