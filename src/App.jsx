import React, { useState } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { supabase } from './lib/supabase'
import LoginForm from './components/Auth/LoginForm'
import RegisterForm from './components/Auth/RegisterForm'
import Layout from './components/Layout'
import Dashboard from './components/Dashboard/Dashboard'
import PlannersManager from './components/Planners/PlannersManager'
import EnhancedTodoList from './components/TodoList/EnhancedTodoList'
import StudySchedule from './components/Schedule/StudySchedule'
import GradeTracker from './components/Grades/GradeTracker'
import AIAssistant from './components/Chat/AIAssistant'
import ResetPasswordForm from './components/Auth/ResetPasswordForm'
import Profile from './components/Auth/Profile'
import FocusTimer from './components/Schedule/FocusTimer'
import SmartScheduler from './components/Schedule/SmartScheduler'

// Demo user for when Supabase is not connected
const demoUser = {
  id: 'demo-user',
  email: 'demo@schedulr.app',
  user_metadata: {
    username: 'Demo User'
  }
}

const AuthWrapper = () => {
  const [isLogin, setIsLogin] = useState(true)
  
  return isLogin ? (
    <LoginForm onToggleMode={() => setIsLogin(false)} />
  ) : (
    <RegisterForm onToggleMode={() => setIsLogin(true)} />
  )
}

const MainApp = () => {
  const { user, loading } = useAuth()
  const [activeTab, setActiveTab] = useState('dashboard')
  const isResetPath = window.location.pathname === '/reset-password'
  
  // Use demo user if Supabase is not connected
  const currentUser = user || (!supabase ? demoUser : null)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  // Handle password reset route independently of auth state
  if (isResetPath) {
    return <ResetPasswordForm onBack={() => { window.location.href = '/' }} />
  }

  if (!currentUser) {
    return <AuthWrapper />
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard setActiveTab={setActiveTab} />
      case 'planners':
        return <PlannersManager />
      case 'todo':
        return <EnhancedTodoList />
      case 'schedule':
        return <StudySchedule />
      case 'grades':
        return <GradeTracker />
      case 'chat':
        return <AIAssistant />
      case 'profile':
        return <Profile />
      case 'focus':
        return <FocusTimer />
      case 'smart-scheduler':
        return <SmartScheduler />
      default:
        return <Dashboard setActiveTab={setActiveTab} />
    }
  }

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {renderContent()}
    </Layout>
  )
}

function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  )
}

export default App
