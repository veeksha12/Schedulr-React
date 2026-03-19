import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { 
  Calendar, 
  CheckSquare, 
  BarChart3, 
  MessageCircle, 
  LogOut,
  BookOpen,
  User,
  Menu,
  X,
  LayoutDashboard,
  GraduationCap,
  Timer,
  Sparkles,
  Info,
  Users
} from 'lucide-react'
import { calculateLevel, getLevelProgress } from '../lib/gamification'

const Layout = ({ children, activeTab, setActiveTab }) => {
  const { user, signOut } = useAuth()
  const [showXPTooltip, setShowXPTooltip] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  
  const demoUser = {
    id: 'demo-user',
    email: 'demo@schedulr.app',
    user_metadata: {
      username: 'Demo User'
    }
  }
  
  const currentUser = user || (!supabase ? demoUser : null)

  const handleSignOut = async () => {
    if (!supabase) {
      window.location.reload()
      return
    }
    await signOut()
  }

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'planners', label: 'Planners', icon: BookOpen },
    { id: 'todo', label: 'To-Do List', icon: CheckSquare },
    { id: 'schedule', label: 'Schedule', icon: Calendar },
    { id: 'grades', label: 'Grades', icon: GraduationCap },
    { id: 'focus', label: 'Focus', icon: Timer },
    { id: 'smart-scheduler', label: 'AI Optimizer', icon: Sparkles },
    { id: 'chat', label: 'AI Assistant', icon: MessageCircle },
    { id: 'profile', label: 'Profile', icon: User },
  ]

  const handleNavClick = (id) => {
    setActiveTab(id)
    setSidebarOpen(false)
  }

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="p-6 border-b border-indigo-500/10">
        {!supabase && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-3 py-2 rounded-lg mb-4">
            <p className="text-xs font-medium">Demo Mode</p>
          </div>
        )}
        <div className="flex items-center space-x-3 group">
          <div className="w-11 h-11 rounded-[1.25rem] bg-[#98B4A6] flex items-center justify-center shadow-lg shadow-[#98B4A6]/20 transition-transform group-hover:scale-110 duration-500">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-800 tracking-tight">Schedulr<span className="text-[#98B4A6]">.</span></h1>
            <p className="text-[10px] text-[#98B4A6] font-bold uppercase tracking-widest">Study Planner</p>
          </div>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="mt-4 px-3 flex-1">
        <div className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center px-4 py-3.5 rounded-[2rem] text-left transition-all duration-500 group ${
                  isActive 
                    ? 'bg-[#98B4A6]/10 text-[#6B8E7E] shadow-sm' 
                    : 'text-gray-400 hover:bg-[#FCFAF7] hover:text-[#98B4A6]'
                }`}
              >
                <Icon className={`w-5 h-5 mr-3 transition-transform duration-200 ${isActive ? '' : 'group-hover:scale-110'}`} />
                <span className="font-medium text-sm">{item.label}</span>
              </button>
            )
          })}
        </div>
      </nav>

      {/* User Section */}
      <div className="p-4 border-t-2 border-[#F3EFE9] mt-auto">
        <div className="p-4 rounded-[2.5rem] bg-[#FCFAF7] border-2 border-[#F3EFE9] mb-3 relative group shadow-sm">
          <div className="absolute top-0 right-0 w-20 h-20 bg-[#98B4A6]/5 rounded-full -mr-10 -mt-10 overflow-hidden" />
          <div className="flex items-center mb-4 relative z-10">
            <div className="w-11 h-11 rounded-2xl bg-[#E8B4B8]/20 border-2 border-[#E8B4B8]/30 overflow-hidden flex items-center justify-center p-0.5">
              {currentUser?.user_metadata?.avatar_url ? (
                <img src={currentUser.user_metadata.avatar_url} alt="Profile" className="w-full h-full rounded-xl object-cover" />
              ) : (
                <User className="w-full h-full text-[#E8B4B8]" />
              )}
            </div>
            <div className="ml-3 overflow-hidden">
              <p className="text-sm font-black text-gray-800 truncate leading-none">
                {currentUser?.user_metadata?.username || currentUser?.email?.split('@')[0]}
              </p>
              <div className="flex items-center mt-1.5">
                <span className="text-[9px] font-black text-[#E8B4B8] uppercase tracking-widest bg-[#F3D1D4]/30 px-2 py-0.5 rounded-lg">Level {calculateLevel(currentUser?.user_metadata?.xp || 0)}</span>
              </div>
            </div>
          </div>
          
          {/* XP Bar - Wholesome Edition */}
          <div className="mt-2 pt-3 border-t border-[#F3EFE9] relative z-10">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Progress</span>
                <button 
                  onMouseEnter={() => setShowXPTooltip(true)}
                  onMouseLeave={() => setShowXPTooltip(false)}
                  onClick={() => setShowXPTooltip(!showXPTooltip)}
                  className="text-[#98B4A6] hover:scale-110 transition-transform"
                >
                  <Info className="w-3.5 h-3.5" />
                </button>
              </div>
              <span className="text-[10px] text-[#98B4A6] font-black tracking-widest">{currentUser?.user_metadata?.xp || 0} XP</span>
            </div>

            {/* XP Tooltip - Cozy Popup */}
            {showXPTooltip && (
              <div className="absolute bottom-full left-0 right-0 mb-4 bg-white border-2 border-[#F3EFE9] p-4 rounded-[2rem] shadow-2xl z-50 text-[10px] leading-relaxed animate-scale-in">
                <p className="font-black border-b border-gray-50 pb-2 mb-2 uppercase tracking-widest text-[#98B4A6]">XP System</p>
                <div className="space-y-1.5">
                  <div className="flex justify-between font-bold"><span>Task Finished</span> <span className="text-[#98B4A6]">+15 XP</span></div>
                  <div className="flex justify-between font-bold"><span>Focus Time</span> <span className="text-[#98B4A6]">+20 XP</span></div>
                  <div className="flex justify-between font-bold"><span>AI Optimizer</span> <span className="text-[#98B4A6]">+50 XP</span></div>
                </div>
                <div className="mt-2 pt-2 border-t border-gray-50 italic text-gray-400 font-medium">
                  Next level in <span className="text-[#E8B4B8] font-black">{Math.max(0, Math.pow(calculateLevel(currentUser?.user_metadata?.xp || 0), 2) * 20 - (currentUser?.user_metadata?.xp || 0))} XP</span>
                </div>
              </div>
            )}
            <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden p-0.5 border border-gray-50">
              <div 
                className="h-full bg-[#98B4A6] rounded-full transition-all duration-1000"
                style={{ width: `${getLevelProgress(currentUser?.user_metadata?.xp || 0)}%` }}
              />
            </div>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center w-full px-4 py-2.5 text-sm font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200"
        >
          <LogOut className="w-4 h-4 mr-2" />
          {supabase ? 'Sign Out' : 'Restart Demo'}
        </button>
      </div>
    </>
  )

  return (
    <div className="min-h-screen bg-[#FCFAF7] flex">
      {/* Mobile hamburger */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-xl shadow-lg border border-gray-200"
      >
        <Menu className="w-5 h-5 text-gray-700" />
      </button>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="sidebar-overlay md:hidden" onClick={() => setSidebarOpen(false)}>
          <div 
            className="w-72 h-full bg-white shadow-2xl flex flex-col animate-slide-in"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-gray-100"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-72 bg-white shadow-sm border-r-2 border-[#F3EFE9] flex-col fixed h-full z-30 transition-all duration-500">
        <SidebarContent />
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto md:ml-72">
        <div className="p-4 md:p-8 pt-16 md:pt-8">
          <div className="page-enter">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Layout