import React, { useState } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import LoginForm from './components/Auth/LoginForm'
import RegisterForm from './components/Auth/RegisterForm'
import Layout from './components/Layout'
import Dashboard from './components/Dashboard/Dashboard'
import PlannersManager from './components/Planners/PlannersManager'
import EnhancedTodoList from './components/TodoList/EnhancedTodoList'
import StudySchedule from './components/Schedule/StudySchedule'
import GradeTracker from './components/Grades/GradeTracker'
import AIAssistant from './components/Chat/AIAssistant'

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (!user) {
    return <AuthWrapper />
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />
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
      default:
        return <Dashboard />
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