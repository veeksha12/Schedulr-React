import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Coffee, 
  Brain, 
  Battery, 
  Zap, 
  Trophy,
  Volume2,
  VolumeX,
  Settings,
  ArrowRight
} from 'lucide-react'
import { ACTIONS, getXPForAction } from '../../lib/gamification'

const SESSIONS = {
  FOCUS: { id: 'focus', label: 'Focus Session', duration: 25 * 60, color: 'from-[#F2F8F5] to-[#98B4A6]', icon: Brain, accent: '#98B4A6' },
  SHORT: { id: 'short', label: 'Short Break', duration: 5 * 60, color: 'from-[#FDF2F2] to-[#E8B4B8]', icon: Coffee, accent: '#E8B4B8' },
  LONG: { id: 'long', label: 'Long Break', duration: 15 * 60, color: 'from-[#FFF9F2] to-[#D4A373]', icon: Battery, accent: '#D4A373' }
}

const QUOTES = [
  "Don't stop when you're tired. Stop when you're done.",
  "Focus on being productive instead of busy.",
  "Your future self will thank you for this focus session.",
  "Great things never come from comfort zones.",
  "Believe you can and you're halfway there.",
  "It always seems impossible until it's done."
]

const FocusTimer = () => {
  const { addXP } = useAuth()
  const [activeSession, setActiveSession] = useState(SESSIONS.FOCUS)
  const [timeLeft, setTimeLeft] = useState(SESSIONS.FOCUS.duration)
  const [isActive, setIsActive] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [quoteIndex, setQuoteIndex] = useState(0)

  // Circular progress math
  const radius = 100 // Further reduced for guaranteed fit
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (timeLeft / activeSession.duration) * circumference

  useEffect(() => {
    let interval = null
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1)
      }, 1000)
    } else if (timeLeft === 0) {
      handleSessionComplete()
      clearInterval(interval)
    }
    return () => clearInterval(interval)
  }, [isActive, timeLeft])

  const handleSessionComplete = async () => {
    setIsActive(false)
    if (soundEnabled) {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3')
      audio.play().catch(e => console.log('Audio error:', e))
    }
    
    if (activeSession.id === 'focus') {
      await addXP(getXPForAction(ACTIONS.FOCUS_SESSION_COMPLETED))
    }
    
    // Rotate quote
    setQuoteIndex((prev) => (prev + 1) % QUOTES.length)
    
    // Auto-switch sessions or just reset
    alert(`${activeSession.label} finished! Great job.`)
    resetTimer()
  }

  const toggleTimer = () => setIsActive(!isActive)
  
  const resetTimer = () => {
    setIsActive(false)
    setTimeLeft(activeSession.duration)
  }

  const changeSession = (session) => {
    setActiveSession(session)
    setTimeLeft(session.duration)
    setIsActive(false)
  }

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s < 10 ? '0' : ''}${s}`
  }

  const nextQuote = () => setQuoteIndex((prev) => (prev + 1) % QUOTES.length)
  const prevQuote = () => setQuoteIndex((prev) => (prev - 1 + QUOTES.length) % QUOTES.length)

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in pb-12">
      <div className="text-center">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Focus Timer</h1>
        <p className="text-[10px] text-[#98B4A6] font-black uppercase tracking-widest mt-1">Master your time and maximize deep work</p>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-card border border-gray-100 p-8 md:p-12 text-center overflow-hidden relative">
        {/* Background Gradients */}
        <div className={`absolute top-0 left-0 w-full h-2 bg-gradient-to-r ${activeSession.color}`} />
        <div className={`absolute -top-24 -right-24 w-64 h-64 bg-gradient-to-br ${activeSession.color} opacity-5 blur-3xl`} />
        <div className={`absolute -bottom-24 -left-24 w-64 h-64 bg-gradient-to-tr ${activeSession.color} opacity-5 blur-3xl`} />

        {/* Session Toggles */}
        <div className="flex justify-center p-1.5 bg-[#FCFAF7] rounded-[2rem] mb-12 inline-flex border-2 border-[#F3EFE9]">
          {Object.values(SESSIONS).map((s) => (
            <button
              key={s.id}
              onClick={() => changeSession(s)}
              className={`flex items-center space-x-2 px-6 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${
                activeSession.id === s.id 
                  ? `bg-white text-gray-800 shadow-lg shadow-black/5 border border-[#F3EFE9]` 
                  : 'text-gray-400 hover:text-[#98B4A6]'
              }`}
            >
              <s.icon className={`w-4 h-4 ${activeSession.id === s.id ? 'text-[#98B4A6]' : ''}`} />
              <span>{s.label}</span>
            </button>
          ))}
        </div>

        {/* Timer UI */}
        <div className="relative flex items-center justify-center mb-12">
          {/* Circular Progress Ring */}
          <svg className="w-64 h-64 md:w-80 md:h-80 transform -rotate-90 block">
            <circle
              className="text-[#FCFAF7]"
              strokeWidth="6"
              stroke="currentColor"
              fill="transparent"
              r={radius}
              cx="50%"
              cy="50%"
            />
            <circle
              className={`transition-all duration-300 ease-out`}
              strokeWidth="10"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              stroke={activeSession.accent}
              fill="transparent"
              r={radius}
              cx="50%"
              cy="50%"
            />
          </svg>

          {/* Time Display */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-5xl md:text-7xl font-black text-gray-800 tracking-tighter tabular-nums leading-none">
              {formatTime(timeLeft)}
            </span>
            <span className="text-[9px] font-black uppercase tracking-[0.3em] mt-3 text-[#98B4A6]">
              {isActive ? 'Focusing...' : 'Paused'}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center space-x-8">
          <button 
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="w-14 h-14 flex items-center justify-center text-gray-400 hover:text-[#98B4A6] hover:bg-[#F2F8F5] rounded-2xl transition-all border-2 border-[#F3EFE9]"
          >
            {soundEnabled ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
          </button>

          <button 
            onClick={toggleTimer}
            className={`w-20 h-20 flex items-center justify-center rounded-[2rem] text-white shadow-xl transform transition-all active:scale-95 hover:scale-105 ${
              isActive 
                ? 'bg-[#D4A373] shadow-[#D4A373]/30' 
                : 'bg-[#98B4A6] shadow-[#98B4A6]/30'
            }`}
          >
            {isActive ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current ml-1" />}
          </button>

          <button 
            onClick={resetTimer}
            className="w-14 h-14 flex items-center justify-center text-gray-400 hover:text-[#E8B4B8] hover:bg-[#FDF2F2] rounded-2xl transition-all border-2 border-[#F3EFE9]"
          >
            <RotateCcw className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Rewards & Motivation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white rounded-[2.5rem] border-2 border-[#F3EFE9] p-8 shadow-sm relative overflow-hidden group">
          <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${activeSession.color} opacity-10 blur-2xl group-hover:opacity-20 transition-opacity`} />
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-12 h-12 flex items-center justify-center bg-[#F2F8F5] rounded-2xl border border-[#98B4A6]/20">
              <Trophy className="w-6 h-6 text-[#98B4A6]" />
            </div>
            <div>
              <h3 className="font-black text-gray-800 tracking-tight">Focus Rewards</h3>
              <p className="text-[10px] text-[#6B8E7E] font-black uppercase tracking-widest">Earn XP for consistency</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-[#FCFAF7] rounded-2xl border border-[#F3EFE9]">
              <span className="text-[10px] font-black text-[#6B8E7E] uppercase tracking-widest">Focus Session</span>
              <span className="text-sm font-black text-gray-800">+20 XP</span>
            </div>
            <p className="text-[10px] text-[#6B8E7E] leading-relaxed italic font-bold">
              "Deep work sessions train your mind for excellence. Consistent focus is the foundation of mastery."
            </p>
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] border-2 border-[#F3EFE9] p-8 shadow-sm flex flex-col justify-center text-center relative overflow-hidden group">
          <div className="text-gray-200 mb-6 flex justify-center group-hover:scale-110 transition-transform duration-500">
            <Zap className="w-12 h-12" />
          </div>
          
          <div className="relative min-h-[5rem] flex items-center justify-center px-10">
            <button onClick={prevQuote} className="absolute left-0 p-2 text-gray-300 hover:text-[#98B4A6] transition-colors">
              <ArrowRight className="w-5 h-5 rotate-180" />
            </button>
            <p className="text-gray-500 italic text-sm leading-relaxed font-medium">
              "{QUOTES[quoteIndex]}"
            </p>
            <button onClick={nextQuote} className="absolute right-0 p-2 text-gray-300 hover:text-[#98B4A6] transition-colors">
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-8 flex items-center justify-center space-x-2">
            {QUOTES.map((_, i) => (
              <div 
                key={i} 
                className={`h-1.5 transition-all rounded-full ${i === quoteIndex ? 'w-8 bg-[#98B4A6]' : 'w-1.5 bg-gray-100'}`} 
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default FocusTimer
