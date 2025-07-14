import React from 'react'
import { useAuth } from '../contexts/AuthContext'
import { 
  Calendar, 
  CheckSquare, 
  BarChart3, 
  MessageCircle, 
  Settings, 
  LogOut,
  BookOpen,
  User
} from 'lucide-react'

const Layout = ({ children, activeTab, setActiveTab }) => {
  const { user, signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
  }

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'planners', label: 'Planners', icon: BookOpen },
    { id: 'todo', label: 'To-Do List', icon: CheckSquare },
    { id: 'schedule', label: 'Schedule', icon: Calendar },
    { id: 'grades', label: 'Grades', icon: BarChart3 },
    { id: 'chat', label: 'AI Assistant', icon: MessageCircle },
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg">
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold text-indigo-600">Schedulr</h1>
          <p className="text-sm text-gray-600 mt-1">Study Planner</p>
        </div>
        
        <nav className="mt-6">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center px-6 py-3 text-left hover:bg-indigo-50 transition-colors ${
                  activeTab === item.id 
                    ? 'bg-indigo-50 text-indigo-600 border-r-2 border-indigo-600' 
                    : 'text-gray-700'
                }`}
              >
                <Icon className="w-5 h-5 mr-3" />
                {item.label}
              </button>
            )
          })}
        </nav>

        <div className="absolute bottom-0 w-64 p-6 border-t">
          <div className="flex items-center mb-4">
            <User className="w-8 h-8 text-gray-400" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-700">
                {user?.user_metadata?.username || user?.email}
              </p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center text-gray-600 hover:text-red-600 transition-colors"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {children}
        </div>
      </div>
    </div>
  )
}

export default Layout