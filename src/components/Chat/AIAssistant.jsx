import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { Send, Bot, User, Lightbulb, BookOpen, Target, Clock } from 'lucide-react'
import { format } from 'date-fns'

const AIAssistant = () => {
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    if (user) {
      fetchChatHistory()
      // Add welcome message
      setMessages([{
        id: 'welcome',
        type: 'ai',
        content: `Hello ${user?.user_metadata?.username || 'there'}! I'm your AI study assistant. I can help you with study tips, time management, goal setting, and academic planning. What would you like to know?`,
        timestamp: new Date().toISOString()
      }])
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
      }
    } catch (error) {
      console.error('Error fetching chat history:', error)
    }
  }

  const generateAIResponse = async (userMessage) => {
    // This is a mock AI response generator
    // In a real implementation, you would call an AI service like OpenAI
    
    const responses = {
      study: [
        "Here are some effective study techniques:\n\n1. **Pomodoro Technique**: Study for 25 minutes, then take a 5-minute break\n2. **Active Recall**: Test yourself instead of just re-reading\n3. **Spaced Repetition**: Review material at increasing intervals\n4. **Feynman Technique**: Explain concepts in simple terms\n\nWhich technique would you like to know more about?",
        "For better study sessions, try these tips:\n\n• Find a quiet, dedicated study space\n• Remove distractions (phone, social media)\n• Use the 2-minute rule: if it takes less than 2 minutes, do it now\n• Break large tasks into smaller, manageable chunks\n• Reward yourself after completing study goals"
      ],
      time: [
        "Time management is crucial for academic success! Here are my recommendations:\n\n1. **Time Blocking**: Assign specific time slots for different subjects\n2. **Priority Matrix**: Focus on urgent AND important tasks first\n3. **Buffer Time**: Add 25% extra time to your estimates\n4. **Weekly Reviews**: Assess what worked and what didn't\n\nWhat specific time management challenge are you facing?",
        "Here's a simple time management framework:\n\n**Morning**: Plan your day and tackle hardest tasks\n**Afternoon**: Collaborative work and meetings\n**Evening**: Review, light reading, and preparation for tomorrow\n\nRemember: It's not about being busy, it's about being productive!"
      ],
      goal: [
        "Setting SMART goals is key to academic success:\n\n**S**pecific: Clear and well-defined\n**M**easurable: Track your progress\n**A**chievable: Realistic given your resources\n**R**elevant: Aligned with your objectives\n**T**ime-bound: Has a deadline\n\nExample: 'I will improve my Math grade from B to A by studying 1 hour daily for the next 6 weeks.'\n\nWhat goal would you like to work on?",
        "Goal achievement strategies:\n\n1. **Write it down**: Goals are 42% more likely to be achieved when written\n2. **Break it down**: Divide big goals into smaller milestones\n3. **Track progress**: Regular check-ins keep you motivated\n4. **Celebrate wins**: Acknowledge progress, no matter how small\n5. **Adjust as needed**: Be flexible and adapt your approach"
      ],
      motivation: [
        "Staying motivated can be challenging! Here are some strategies:\n\n🎯 **Connect to your 'why'**: Remember your long-term goals\n🏆 **Celebrate small wins**: Acknowledge daily progress\n👥 **Study with others**: Accountability partners help\n📈 **Track progress**: Visual progress is motivating\n🎁 **Reward yourself**: Set up a reward system\n\nWhat's your biggest motivation challenge right now?",
        "When motivation is low, try these quick fixes:\n\n• Start with just 5 minutes (often you'll continue)\n• Change your environment\n• Listen to motivational music or podcasts\n• Review your past successes\n• Remember that discipline beats motivation\n\nMotivation gets you started, but habits keep you going!"
      ],
      exam: [
        "Exam preparation strategy:\n\n**4 weeks before**: Create study schedule, gather materials\n**3 weeks before**: Active learning, practice problems\n**2 weeks before**: Review, identify weak areas\n**1 week before**: Final review, practice tests\n**Day before**: Light review, rest well\n**Exam day**: Arrive early, stay calm, read instructions carefully\n\nWhat subject are you preparing for?",
        "Exam anxiety management:\n\n🧘 **Before the exam**: Deep breathing, positive visualization\n📝 **During the exam**: Read all questions first, start with easy ones\n⏰ **Time management**: Allocate time per question, leave time for review\n🎯 **Stay focused**: If you blank out, move to another question\n✅ **Review**: Check your answers if time permits\n\nRemember: You've prepared for this!"
      ]
    }

    const message = userMessage.toLowerCase()
    let response = "I'm here to help with your studies! You can ask me about:\n\n📚 Study techniques and methods\n⏰ Time management strategies\n🎯 Goal setting and achievement\n💪 Motivation and productivity\n📝 Exam preparation tips\n\nWhat would you like to know more about?"

    if (message.includes('study') || message.includes('learn')) {
      response = responses.study[Math.floor(Math.random() * responses.study.length)]
    } else if (message.includes('time') || message.includes('schedule') || message.includes('manage')) {
      response = responses.time[Math.floor(Math.random() * responses.time.length)]
    } else if (message.includes('goal') || message.includes('target') || message.includes('achieve')) {
      response = responses.goal[Math.floor(Math.random() * responses.goal.length)]
    } else if (message.includes('motivat') || message.includes('inspire') || message.includes('encourage')) {
      response = responses.motivation[Math.floor(Math.random() * responses.motivation.length)]
    } else if (message.includes('exam') || message.includes('test') || message.includes('quiz')) {
      response = responses.exam[Math.floor(Math.random() * responses.exam.length)]
    }

    return response
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
    setInputMessage('')
    setIsLoading(true)

    try {
      // Save user message to database
      await supabase
        .from('chat_messages')
        .insert([{
          user_id: user.id,
          type: 'user',
          content: inputMessage
        }])

      // Generate AI response
      const aiResponse = await generateAIResponse(inputMessage)
      
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
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <Bot className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">AI Study Assistant</h1>
            <p className="text-gray-600">Get personalized study tips and academic guidance</p>
          </div>
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
                className="flex items-center space-x-2 bg-white px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-sm"
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
              <div className={`rounded-lg p-4 ${
                message.type === 'user'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white border border-gray-200'
              }`}>
                <div className="whitespace-pre-wrap">{message.content}</div>
                <div className={`text-xs mt-2 ${
                  message.type === 'user' ? 'text-indigo-200' : 'text-gray-500'
                }`}>
                  {format(new Date(message.timestamp), 'h:mm a')}
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
      </div>
    </div>
  )
}

export default AIAssistant