import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { Send, Bot, User, Lightbulb, BookOpen, Target, Clock, Trash2, X, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import Notification from '../UI/Notification'
import ConfirmModal from '../UI/ConfirmModal'

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY
const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent'

const AIAssistant = () => {
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [notification, setNotification] = useState(null)
  const [confirmModal, setConfirmModal] = useState(null)
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

  const showNotification = (type, message) => {
    setNotification({ type, message })
  }

  const fetchChatHistory = async () => {
    try {
      if (!supabase) {
        const welcomeMsg = {
          id: 'welcome',
          type: 'ai',
          content: `Hello! I'm your AI study assistant powered by Gemini. I can help you with study tips, time management, goal setting, and academic planning. What would you like to know?`,
          timestamp: new Date().toISOString()
        }
        setMessages([welcomeMsg])
        return
      }

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
      showNotification('error', 'Failed to load chat history')
    }
  }

  const callGeminiAPI = async (userMessage) => {
    if (!GEMINI_API_KEY) {
      showNotification('error', 'Gemini API key not configured. Please add VITE_GEMINI_API_KEY to your .env file')
      throw new Error('API key not configured')
    }

    try {
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
        const errorData = await response.json().catch(() => ({}))
        console.error('Gemini API Error:', errorData)

        if (response.status === 400) {
          throw new Error('Invalid API request. Please check your API key.')
        } else if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please wait a moment and try again.')
        } else if (response.status === 403) {
          throw new Error('API key invalid or access denied.')
        } else {
          throw new Error(`API error: ${response.status}`)
        }
      }

      const data = await response.json()

      if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
        return data.candidates[0].content.parts[0].text
      } else {
        throw new Error('Unexpected response format from Gemini API')
      }
    } catch (error) {
      console.error('Gemini API Error:', error)
      showNotification('error', error.message || 'Failed to get AI response')
      throw error
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
      if (supabase) {
        await supabase
          .from('chat_messages')
          .insert([{
            user_id: user.id,
            type: 'user',
            content: messageToSend
          }])
      }

      const aiResponse = await callGeminiAPI(messageToSend)

      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: aiResponse,
        timestamp: new Date().toISOString()
      }

      setMessages(prev => [...prev, aiMessage])

      if (supabase) {
        await supabase
          .from('chat_messages')
          .insert([{
            user_id: user.id,
            type: 'ai',
            content: aiResponse
          }])
      }

    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage = {
        id: Date.now() + 1,
        type: 'error',
        content: error.message || "I'm having trouble responding. Please check your API configuration and try again.",
        timestamp: new Date().toISOString()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const deleteMessage = async (messageId) => {
    if (messageId === 'welcome') {
      setMessages(prev => prev.filter(msg => msg.id !== messageId))
      return
    }

    setConfirmModal({
      title: 'Delete Message',
      message: 'Are you sure you want to delete this message?',
      onConfirm: async () => {
        try {
          if (supabase) {
            const { error } = await supabase
              .from('chat_messages')
              .delete()
              .eq('id', messageId)

            if (error) throw error
          }

          setMessages(prev => prev.filter(msg => msg.id !== messageId))
          showNotification('success', 'Message deleted')
        } catch (error) {
          console.error('Error deleting message:', error)
          showNotification('error', 'Failed to delete message')
        } finally {
          setConfirmModal(null)
        }
      },
      onCancel: () => setConfirmModal(null)
    })
  }

  const clearAllChat = async () => {
    setConfirmModal({
      title: 'Clear All Chat History',
      message: 'Are you sure you want to delete all chat history? This action cannot be undone.',
      onConfirm: async () => {
        try {
          if (supabase) {
            const { error } = await supabase
              .from('chat_messages')
              .delete()
              .eq('user_id', user.id)

            if (error) throw error
          }

          const welcomeMsg = {
            id: 'welcome',
            type: 'ai',
            content: `Hello ${user?.user_metadata?.username || 'there'}! I'm your AI study assistant powered by Gemini. I can help you with study tips, time management, goal setting, and academic planning. What would you like to know?`,
            timestamp: new Date().toISOString()
          }
          setMessages([welcomeMsg])
          showNotification('success', 'Chat history cleared')
        } catch (error) {
          console.error('Error clearing chat:', error)
          showNotification('error', 'Failed to clear chat history')
        } finally {
          setConfirmModal(null)
        }
      },
      onCancel: () => setConfirmModal(null)
    })
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
      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

      {confirmModal && (
        <ConfirmModal
          isOpen={true}
          title={confirmModal.title}
          message={confirmModal.message}
          onConfirm={confirmModal.onConfirm}
          onCancel={confirmModal.onCancel}
          variant="danger"
        />
      )}

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
        {!GEMINI_API_KEY && (
          <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium">API Key Not Configured</p>
              <p className="mt-1">Add VITE_GEMINI_API_KEY to your .env file to enable AI features.</p>
            </div>
          </div>
        )}
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
                    : message.type === 'error'
                    ? 'bg-red-50 border border-red-200 text-red-800'
                    : 'bg-white border border-gray-200'
                }`}>
                  {message.type === 'error' && (
                    <div className="flex items-center space-x-2 mb-2">
                      <AlertCircle className="w-4 h-4 text-red-500" />
                      <span className="font-medium text-sm">Error</span>
                    </div>
                  )}
                  <div className="whitespace-pre-wrap">{message.content}</div>
                  <div className={`text-xs mt-2 flex items-center justify-between ${
                    message.type === 'user' ? 'text-indigo-200' : message.type === 'error' ? 'text-red-600' : 'text-gray-500'
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
            disabled={!inputMessage.trim() || isLoading || !GEMINI_API_KEY}
            className="bg-indigo-600 text-white p-3 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title={!GEMINI_API_KEY ? 'Configure API key to send messages' : 'Send message'}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-gray-500">
            Tip: Press Enter to send, Shift+Enter for new line
          </p>
          {!GEMINI_API_KEY && (
            <p className="text-xs text-red-600">
              API key required
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default AIAssistant
