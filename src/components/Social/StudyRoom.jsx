import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { 
  Send, 
  Users, 
  ArrowLeft, 
  Clock, 
  MoreVertical, 
  Smile, 
  Paperclip,
  Zap,
  Info
} from 'lucide-react'
import { format } from 'date-fns'

const StudyRoom = ({ group, onBack }) => {
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [presence, setPresence] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    if (!group || !user) return

    fetchMessages()
    
    // Subscribe to new messages
    const messageChannel = supabase
      .channel(`room-${group.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'group_messages', filter: `group_id=eq.${group.id}` },
        (payload) => {
           fetchMessages() // Refresh to get user metadata if possible, or just append
        }
      )
      .subscribe()

    // Presence Tracking
    const presenceChannel = supabase.channel(`presence-${group.id}`)
    
    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState()
        const users = Object.values(state).flat()
        setPresence(users)
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', newPresences)
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', leftPresences)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({
            user_id: user.id,
            username: user.user_metadata?.username || user.email,
            avatar_url: user.user_metadata?.avatar_url,
            online_at: new Date().toISOString()
          })
        }
      })

    return () => {
      supabase.removeChannel(messageChannel)
      supabase.removeChannel(presenceChannel)
    }
  }, [group, user])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from('group_messages')
      .select('*, profiles:user_id(username, avatar_url)') // Assuming profiles table exists or metadata
      .eq('group_id', group.id)
      .order('created_at', { ascending: true })
      .limit(50)
    
    if (!error) {
      setMessages(data || [])
      setIsLoading(false)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    const tempMsg = newMessage
    setNewMessage('')

    const { error } = await supabase
      .from('group_messages')
      .insert([{
        group_id: group.id,
        user_id: user.id,
        content: tempMsg
      }])

    if (error) {
      console.error('Error sending message:', error)
      setNewMessage(tempMsg)
    }
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col md:flex-row bg-white rounded-[2.5rem] border border-gray-100 shadow-card overflow-hidden animate-fade-in text-gray-800">
      {/* Sidebar - Presence */}
      <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-gray-100 flex flex-col bg-gray-50/50">
        <div className="p-6 border-b border-gray-100 bg-white">
          <button onClick={onBack} className="flex items-center text-sm font-bold text-gray-400 hover:text-indigo-600 transition-colors mb-4 group">
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-all" />
            <span>Leave Room</span>
          </button>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <Users className="w-5 h-5" />
            </div>
            <div className="overflow-hidden">
              <h2 className="font-bold text-gray-900 truncate">{group.name}</h2>
              <p className="text-[10px] text-emerald-500 font-black uppercase tracking-widest flex items-center">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-2 animate-pulse" />
                {presence.length} Studying Now
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-4 px-2">Collaborators</p>
          <div className="space-y-2">
            {presence.length > 0 ? presence.map((p, i) => (
              <div key={i} className="flex items-center space-x-3 p-2 rounded-xl hover:bg-white transition-all cursor-default group">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 overflow-hidden border-2 border-white ring-1 ring-black/5 flex-shrink-0">
                  {p.avatar_url ? <img src={p.avatar_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-indigo-600">{p.username?.[0] || '?'}</div>}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-gray-800 truncate">{p.username}</p>
                  <p className="text-[9px] text-emerald-500 font-bold">Focusing</p>
                </div>
              </div>
            )) : (
              <p className="text-xs text-gray-400 text-center py-4 italic">No one else here yet...</p>
            )}
          </div>
        </div>

        <div className="p-4 bg-white border-t border-gray-100">
           <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-4 text-white shadow-lg relative overflow-hidden">
              <Zap className="absolute top-[-10px] right-[-10px] w-12 h-12 opacity-10" />
              <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">Group Goal</p>
              <p className="text-xs font-bold leading-relaxed italic line-clamp-2">"Push each other to stay consistent today."</p>
           </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Chat Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Info className="w-4 h-4 text-gray-400" />
            <span className="text-xs font-medium text-gray-500 truncate">{group.description || 'Welcome to the study room!'}</span>
          </div>
          <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50"><MoreVertical className="w-4 h-4" /></button>
        </div>

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth bg-gray-50/20">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <RefreshCw className="w-6 h-6 animate-spin text-indigo-300" />
            </div>
          ) : messages.length > 0 ? (
            messages.map((msg, i) => {
              const isOwn = msg.user_id === user.id
              return (
                <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                  <div className={`flex flex-col max-w-[75%] ${isOwn ? 'items-end' : 'items-start'}`}>
                    <div className="flex items-center space-x-2 mb-1 px-1">
                      {!isOwn && <span className="text-[10px] font-black text-gray-900 uppercase tracking-wider">{msg.profiles?.username || 'Student'}</span>}
                      <span className="text-[9px] text-gray-400 uppercase tracking-tighter">{format(new Date(msg.created_at), 'h:mm a')}</span>
                    </div>
                    <div className={`px-4 py-2.5 rounded-2xl text-sm shadow-sm ${
                      isOwn 
                        ? 'bg-indigo-600 text-white rounded-tr-sm' 
                        : 'bg-white border border-gray-100 text-gray-800 rounded-tl-sm'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                </div>
              )
            })
          ) : (
             <div className="h-full flex flex-col items-center justify-center text-center p-12">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                  <MessageSquare className="w-8 h-8 text-gray-200" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Start the conversation</h3>
                <p className="text-sm text-gray-400 mt-1">Found a hard question? Need motivation? Chat with fellow students here.</p>
             </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input */}
        <div className="p-6 bg-white border-t border-gray-100">
          <form onSubmit={handleSendMessage} className="relative flex items-center">
            <input 
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Message your study group..."
              className="w-full bg-gray-50 border border-transparent rounded-[1.25rem] py-4 pl-12 pr-12 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-sm"
            />
            <Smile className="absolute left-4 w-5 h-5 text-gray-300 hover:text-indigo-500 cursor-pointer transition-colors" />
            <div className="absolute right-3 flex items-center space-x-2">
              <button type="submit" className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-500/20 hover:scale-105 active:scale-95 transition-all">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
          <div className="flex items-center justify-between mt-3 px-1">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Shift + Enter for new line</p>
            <div className="flex items-center space-x-2">
              <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
              <span className="text-[10px] text-indigo-500 font-black uppercase tracking-widest">Real-time Connected</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StudyRoom
