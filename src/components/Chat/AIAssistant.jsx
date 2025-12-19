import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { Send, Bot, User, Lightbulb, BookOpen, Target, Clock, Trash2, X } from 'lucide-react'
import { format } from 'date-fns'

// Gemini API Configuration - Use environment variable for better security
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY
if (!GEMINI_API_KEY) {
  console.warn("Gemini API key not configured");
}
const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent'

const AIAssistant = () => {
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    if (user) {
      fetchChatHistory()
    }
  }, [user])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchChatHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(50)

      if (error) throw error
      
      if (data && data.length > 0) {
        setMessages(data.map(msg => ({
          id: msg.id,
          type: msg.type,
          content: msg.content,
          timestamp: msg.created_at
        })))
      } else {
        // Add welcome message if no history
        const welcomeMsg = {
          id: 'welcome',
          type: 'ai',
          content: `Hello ${user?.user_metadata?.username || 'there'}! I'm your AI study assistant powered by Gemini. I can help you with study tips, time management, goal setting, and academic planning. What would you like to know?`,
          timestamp: new Date().toISOString()
        }
        setMessages([welcomeMsg])
      }
    } catch (error) {
      console.error('Error fetching chat history:', error)
    }
  }

  const callGeminiAPI = async (userMessage) => {
    try {
      // Enhance the prompt with context about being a study assistant
      const enhancedPrompt = `You are an AI study assistant helping students with their academic goals. 
A student is asking: "${userMessage}"

Please provide helpful, encouraging, and practical advice. Keep responses concise but informative. 
If the question is about study techniques, time management, motivation, exam preparation, or academic planning, provide specific actionable tips.
If the question is unrelated to studying, gently redirect them to academic topics while still being helpful.`

      const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: enhancedPrompt
            }]
          }]
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Gemini API Error:', errorData)
        throw new Error('Failed to get response from Gemini API')
      }

      const data = await response.json()
      
      // Extract the text from Gemini's response
      if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
        return data.candidates[0].content.parts[0].text
      } else {
        throw new Error('Unexpected response format from Gemini API')
      }
    } catch (error) {
      console.error('Gemini API Error:', error)
      return "I'm sorry, I'm having trouble connecting to my knowledge base right now. Please try again in a moment. In the meantime, remember: consistent study habits and breaking tasks into smaller chunks are key to academic success!"
    }
  }

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString()
    }

    setMessages(prev => [...prev, userMessage])
    const messageToSend = inputMessage
    setInputMessage('')
    setIsLoading(true)

    try {
      // Save user message to database
      await supabase
        .from('chat_messages')
        .insert([{
          user_id: user.id,
          type: 'user',
          content: messageToSend
        }])

      // Get AI response from Gemini
      const aiResponse = await callGeminiAPI(messageToSend)
      
      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: aiResponse,
        timestamp: new Date().toISOString()
      }

      setMessages(prev => [...prev, aiMessage])

      // Save AI response to database
      await supabase
        .from('chat_messages')
        .insert([{
          user_id: user.id,
          type: 'ai',
          content: aiResponse
        }])

    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: "I'm sorry, I'm having trouble responding right now. Please try again later.",
        timestamp: new Date().toISOString()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const deleteMessage = async (messageId) => {
    if (messageId === 'welcome') {
      // Remove welcome message from state only
      setMessages(prev => prev.filter(msg => msg.id !== messageId))
      return
    }

    if (!confirm('Delete this message?')) return

    try {
      const { error } = await supabase
        .from('chat_messages')
        .delete()
        .eq('id', messageId)

      if (error) throw error

      setMessages(prev => prev.filter(msg => msg.id !== messageId))
    } catch (error) {
      console.error('Error deleting message:', error)
      alert('Failed to delete message')
    }
  }

  const clearAllChat = async () => {
    if (!confirm('Are you sure you want to delete all chat history? This cannot be undone.')) return

    try {
      const { error } = await supabase
        .from('chat_messages')
        .delete()
        .eq('user_id', user.id)

      if (error) throw error

      // Reset to welcome message
      const welcomeMsg = {
        id: 'welcome',
        type: 'ai',
        content: `Hello ${user?.user_metadata?.username || 'there'}! I'm your AI study assistant powered by Gemini. I can help you with study tips, time management, goal setting, and academic planning. What would you like to know?`,
        timestamp: new Date().toISOString()
      }
      setMessages([welcomeMsg])
    } catch (error) {
      console.error('Error clearing chat:', error)
      alert('Failed to clear chat history')
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const quickActions = [
    { icon: Lightbulb, text: "Study tips", message: "Give me some effective study tips" },
    { icon: Clock, text: "Time management", message: "How can I manage my time better?" },
    { icon: Target, text: "Set goals", message: "Help me set academic goals" },
    { icon: BookOpen, text: "Exam prep", message: "How should I prepare for exams?" }
  ]

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Bot className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">AI Study Assistant</h1>
              <p className="text-gray-600">Powered by Google Gemini</p>
            </div>
          </div>
          <button
            onClick={clearAllChat}
            className="flex items-center space-x-2 px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear All</span>
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gray-50 p-4 border-b border-gray-200">
        <div className="flex flex-wrap gap-2">
          {quickActions.map((action, index) => {
            const Icon = action.icon
            return (
              <button
                key={index}
                onClick={() => {
                  setInputMessage(action.message)
                  setTimeout(() => sendMessage(), 100)
                }}
                disabled={isLoading}
                className="flex items-center space-x-2 bg-white px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Icon className="w-4 h-4 text-indigo-600" />
                <span>{action.text}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex space-x-3 max-w-3xl ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
              <div className={`p-2 rounded-lg ${
                message.type === 'user' 
                  ? 'bg-indigo-100' 
                  : 'bg-gray-100'
              }`}>
                {message.type === 'user' ? (
                  <User className="w-5 h-5 text-indigo-600" />
                ) : (
                  <Bot className="w-5 h-5 text-gray-600" />
                )}
              </div>
              <div className="flex-1">
                <div className={`rounded-lg p-4 ${
                  message.type === 'user'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white border border-gray-200'
                }`}>
                  <div className="whitespace-pre-wrap">{message.content}</div>
                  <div className={`text-xs mt-2 flex items-center justify-between ${
                    message.type === 'user' ? 'text-indigo-200' : 'text-gray-500'
                  }`}>
                    <span>{format(new Date(message.timestamp), 'h:mm a')}</span>
                    <button
                      onClick={() => deleteMessage(message.id)}
                      className={`ml-3 p-1 rounded hover:bg-opacity-20 transition-colors ${
                        message.type === 'user' ? 'hover:bg-white' : 'hover:bg-gray-200'
                      }`}
                      title="Delete message"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex space-x-3 max-w-3xl">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Bot className="w-5 h-5 text-gray-600" />
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="flex space-x-3">
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything about studying, time management, or academic goals..."
            className="flex-1 resize-none border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            rows="1"
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="bg-indigo-600 text-white p-3 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          💡 Tip: Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  )
}

export default AIAssistant
