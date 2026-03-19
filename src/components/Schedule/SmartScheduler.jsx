import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { 
  Sparkles, 
  Zap, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  LayoutDashboard,
  Brain
} from 'lucide-react'
import { format, addDays, startOfToday, isAfter, parseISO } from 'date-fns'
import { fetchGemini } from '../../lib/ai-retry'
import { ACTIONS, getXPForAction } from '../../lib/gamification'

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash-lite:generateContent'

const SmartScheduler = () => {
  const { user, addXP } = useAuth()
  const [tasks, setTasks] = useState([])
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [optimizedSchedule, setOptimizedSchedule] = useState(null)
  const [error, setError] = useState(null)
  const [useMock, setUseMock] = useState(false)

  useEffect(() => {
    if (user) fetchTasks()
  }, [user])

  const fetchTasks = async () => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .eq('completed', false)
      .order('due_date', { ascending: true })
    
    if (!error) setTasks(data || [])
  }

  const localOptimize = () => {
    // Fallback rule-based optimization
    const sorted = [...tasks].sort((a, b) => {
      // 1. By Priority
      const pMap = { high: 0, medium: 1, low: 2 }
      if (pMap[a.priority] !== pMap[b.priority]) return pMap[a.priority] - pMap[b.priority]
      // 2. By Due Date
      return new Date(a.due_date) - new Date(b.due_date)
    })

    const slots = [
      { time: '09:00 AM', label: 'Morning Deep Work' },
      { time: '11:30 AM', label: 'Mid-Day Focus' },
      { time: '02:00 PM', label: 'Afternoon Session' },
      { time: '04:30 PM', label: 'Evening Review' },
      { time: '07:00 PM', label: 'Night Owl Grind' }
    ]

    return sorted.slice(0, 5).map((t, i) => ({
      ...t,
      suggested_time: slots[i % slots.length].time,
      slot_label: slots[i % slots.length].label,
      reason: t.priority === 'high' ? 'High priority deadline approaching.' : 'Strategic gap for steady progress.'
    }))
  }

  const handleOptimize = async () => {
    if (tasks.length === 0) return
    setIsOptimizing(true)
    setError(null)
    setOptimizedSchedule(null)

    if (useMock || !GEMINI_API_KEY) {
      setTimeout(() => {
        setOptimizedSchedule(localOptimize())
        setIsOptimizing(false)
        if (!GEMINI_API_KEY) setError('Using standard optimizer (API key missing)')
      }, 1500)
      return
    }

    const taskContext = tasks.map(t => `- ${t.title} (Priority: ${t.priority}, Due: ${t.due_date})`).join('\n')
    const prompt = `You are an AI Smart Scheduler. I have these tasks:
${taskContext}

Please optimize my schedule for today. Suggest a specific 2-hour time slot for the top 5 most important tasks. Return a JSON array only. Each object must have:
- title: string (exact task title)
- suggested_time: string (e.g., "10:00 AM")
- slot_label: string (e.g., "Deep Work", "Quick Wins")
- reason: string (1 sentence why this time)

Keep the output valid JSON.`

    try {
      const data = await fetchGemini(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      })

      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
      const jsonMatch = rawText.match(/\[.*\]/s)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        setOptimizedSchedule(parsed)
      } else {
        throw new Error('Could not parse AI response')
      }
    } catch (err) {
      console.error('AI error:', err)
      setError('Rate limit exceeded or API error. Falling back to Standard Optimizer.')
      setOptimizedSchedule(localOptimize())
    } finally {
      setIsOptimizing(false)
    }
  }

  const applyOptimization = async () => {
    // In a real app, we'd update due_times in the DB
    // For now, we'll award XP and show a success message
    await addXP(getXPForAction(ACTIONS.AI_OPTIMIZATION))
    alert('Schedule optimized and XP awarded! +50 XP')
    setOptimizedSchedule(null)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 flex items-center tracking-tight">
            AI Optimizer <Sparkles className="w-6 h-6 ml-2 text-[#D4A373]" />
          </h1>
          <p className="text-[10px] text-[#98B4A6] font-black uppercase tracking-widest mt-1">AI-powered time-blocking for peak performance</p>
        </div>
        <div className="flex items-center space-x-3 bg-[#F2F8F5] px-5 py-2.5 rounded-[1.5rem] border border-[#98B4A6]/20">
          <Zap className="w-4 h-4 text-[#98B4A6]" />
          <span className="text-[9px] font-black text-[#98B4A6] uppercase tracking-widest">+50 XP Daily Reward</span>
        </div>
      </div>

      {!optimizedSchedule ? (
        <div className="bg-white rounded-[3rem] border-4 border-[#F3EFE9] p-12 md:p-16 text-center overflow-hidden relative shadow-sm">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#98B4A6] via-[#A7C7E7] to-[#E8B4B8]" />
          <div className="max-w-md mx-auto space-y-8">
            <div className="w-28 h-28 bg-[#F2F8F5] rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 ring-8 ring-[#F2F8F5]/50 border-2 border-[#98B4A6]/10">
              <Brain className="w-14 h-14 text-[#98B4A6] animate-pulse" />
            </div>
            <h2 className="text-2xl font-black text-gray-800 tracking-tight">Need a plan for today?</h2>
            <p className="text-gray-500 font-medium leading-relaxed">Our AI will analyze your pending tasks ({tasks.length}) and suggest the most effective study blocks based on priority and deadlines.</p>
            
            <div className="pt-6 flex flex-col space-y-4">
              <button 
                onClick={handleOptimize}
                disabled={isOptimizing || tasks.length === 0}
                className="w-full bg-[#98B4A6] text-white py-5 rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] shadow-lg shadow-[#98B4A6]/20 hover:bg-[#6B8E7E] transition-all flex items-center justify-center space-x-4 disabled:opacity-50"
              >
                {isOptimizing ? (
                  <RefreshCw className="w-6 h-6 animate-spin" />
                ) : (
                  <Zap className="w-6 h-6 fill-current" />
                )}
                <span>{isOptimizing ? 'Analyzing...' : 'Optimize My Schedule'}</span>
              </button>
              
              <p className="text-[10px] text-[#98B4A6] font-black uppercase tracking-widest opacity-60">
                {tasks.length} tasks ready for optimization
              </p>
            </div>
          </div>

          <div className="mt-16 pt-12 border-t-2 border-[#FCFAF7] grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center group">
              <div className="w-12 h-12 bg-[#F2F8F5] text-[#98B4A6] rounded-[1rem] flex items-center justify-center mx-auto mb-4 border border-[#98B4A6]/10 group-hover:scale-110 transition-transform">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <p className="font-black text-xs text-gray-800 uppercase tracking-widest">Priority First</p>
              <p className="text-[9px] text-gray-400 mt-2 font-bold uppercase tracking-wider">Hardest tasks early</p>
            </div>
            <div className="text-center group">
              <div className="w-12 h-12 bg-[#F0F7FF] text-[#A7C7E7] rounded-[1rem] flex items-center justify-center mx-auto mb-4 border border-[#A7C7E7]/10 group-hover:scale-110 transition-transform">
                <Clock className="w-6 h-6" />
              </div>
              <p className="font-black text-xs text-gray-800 uppercase tracking-widest">Burnout Shield</p>
              <p className="text-[9px] text-gray-400 mt-2 font-bold uppercase tracking-wider">Optimal rest gaps</p>
            </div>
            <div className="text-center group">
              <div className="w-12 h-12 bg-[#FDF2F2] text-[#E8B4B8] rounded-[1rem] flex items-center justify-center mx-auto mb-4 border border-[#E8B4B8]/10 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <p className="font-black text-xs text-gray-800 uppercase tracking-widest">Deadlines Met</p>
              <p className="text-[9px] text-gray-400 mt-2 font-bold uppercase tracking-wider">No missed work</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-8 animate-scale-in">
          <div className="bg-[#F2F8F5] border-2 border-[#98B4A6]/10 rounded-[2rem] p-6 flex items-center justify-between shadow-sm">
            <div className="flex items-center space-x-4 text-[#98B4A6]">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-[#98B4A6]/20">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <span className="font-black text-[10px] uppercase tracking-widest">Optimization Complete! We found your perfect flow.</span>
            </div>
            <button onClick={() => setOptimizedSchedule(null)} className="text-[10px] font-black text-[#98B4A6] uppercase tracking-widest hover:underline px-4">Discard</button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              {optimizedSchedule.map((item, i) => (
                <div key={i} className="bg-white rounded-[2.5rem] border-2 border-[#F3EFE9] p-7 flex items-center space-x-8 hover:shadow-xl transition-all border-l-[12px] border-l-[#98B4A6] group">
                  <div className="text-center min-w-[80px]">
                    <p className="text-xs font-black text-gray-800 tabular-nums">{item.suggested_time}</p>
                    <div className="w-1 h-6 bg-[#FCFAF7] mx-auto my-2 rounded-full" />
                    <p className="text-[9px] font-black text-[#98B4A6] uppercase tracking-widest">{item.slot_label}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-black text-gray-800 text-base leading-tight truncate">{item.title}</h3>
                    <p className="text-xs text-gray-500 mt-2 font-medium leading-relaxed">{item.reason}</p>
                  </div>
                  <div className="w-12 h-12 flex items-center justify-center bg-[#FCFAF7] rounded-2xl border border-[#F3EFE9] group-hover:scale-110 transition-transform">
                    <ArrowRight className="text-[#98B4A6] w-5 h-5" />
                  </div>
                </div>
              ))}
            </div>

            <div className="lg:col-span-1 space-y-8">
               <div className="bg-[#98B4A6] rounded-[3rem] p-10 text-white shadow-xl relative overflow-hidden group">
                <Zap className="absolute bottom-[-20px] left-[-20px] w-40 h-40 opacity-10 group-hover:scale-110 transition-transform duration-700" />
                <h3 className="text-2xl font-black mb-6 tracking-tight leading-tight">Adopt & Master</h3>
                <p className="text-[#F2F8F5] text-sm mb-10 leading-relaxed font-medium">
                  Ready to lock this in? Applying the AI schedule will organize your day for maximum output and reward you with XP.
                </p>
                <button 
                  onClick={applyOptimization}
                  className="w-full bg-white text-[#98B4A6] py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-lg hover:bg-[#F2F8F5] transition-all transform hover:-translate-y-1"
                >
                  Adopt Plan
                </button>
              </div>

              <div className="bg-[#FFF9F2] rounded-[2.5rem] p-8 border-2 border-[#D4A373]/10 shadow-sm">
                <div className="flex items-center space-x-3 text-[#D4A373] mb-4">
                  <AlertCircle className="w-5 h-5" />
                  <span className="text-[10px] font-black uppercase tracking-widest">AI Insight</span>
                </div>
                <p className="text-[#D4A373] text-xs leading-relaxed italic font-bold">
                  "By front-loading your high-priority tasks in the morning, you capitalize on your brain's peak cognitive resources."
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {error && !optimizedSchedule && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-center space-x-3 text-red-600 animate-fade-in cursor-pointer" onClick={() => setUseMock(true)}>
          <AlertCircle className="w-5 h-5" />
          <span className="text-sm font-medium">{error} <span className="underline ml-1">Try Standard Optimizer instead?</span></span>
        </div>
      )}
    </div>
  )
}

export default SmartScheduler
