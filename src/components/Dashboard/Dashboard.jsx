import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { 
  BookOpen, 
  CheckSquare, 
  Calendar, 
  TrendingUp, 
  Clock,
  Target,
  Award,
  AlertCircle
} from 'lucide-react'
import { format, isToday, addDays } from 'date-fns'

const Dashboard = () => {
  const { user } = useAuth()
  
  // Demo user for when Supabase is not connected
  const demoUser = {
    id: 'demo-user',
    email: 'demo@schedulr.app',
    user_metadata: {
      username: 'Demo User'
    }
  }
  
  const currentUser = user || (!supabase ? demoUser : null)
  const [stats, setStats] = useState({
    totalPlanners: 0,
    todayTasks: 0,
    completedTasks: 0,
    upcomingExams: 0,
    averageGrade: 0,
    studyStreak: 0
  })
  const [recentActivity, setRecentActivity] = useState([])
  const [upcomingDeadlines, setUpcomingDeadlines] = useState([])

  useEffect(() => {
    if (currentUser && supabase) {
      fetchDashboardData()
    } else if (currentUser && !supabase) {
      // Set demo data
      setStats({
        totalPlanners: 2,
        todayTasks: 5,
        completedTasks: 3,
        upcomingExams: 2,
        averageGrade: 85,
        studyStreak: 7
      })
      setRecentActivity([
        { id: 1, title: 'Complete Math Assignment', completed: true, updated_at: new Date().toISOString() },
        { id: 2, title: 'Review Physics Notes', completed: false, updated_at: new Date().toISOString() }
      ])
      setUpcomingDeadlines([
        { id: 1, name: 'Calculus Midterm', date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString() }
      ])
    }
  }, [currentUser])

  const fetchDashboardData = async () => {
    if (!supabase) return
    
    try {
      // Fetch planners count
      const { data: planners } = await supabase
        .from('planners')
        .select('id')
        .eq('user_id', currentUser.id)

      // Fetch today's tasks
      const today = format(new Date(), 'yyyy-MM-dd')
      const { data: todayTasks } = await supabase
        .from('tasks')
        .select('id, completed')
        .eq('user_id', user.id)
        .eq('due_date', today)

      // Fetch upcoming exams
      const nextWeek = format(addDays(new Date(), 7), 'yyyy-MM-dd')
      const { data: exams } = await supabase
        .from('exams')
        .select('id, name, date')
        .eq('user_id', user.id)
        .gte('date', today)
        .lte('date', nextWeek)
        .order('date', { ascending: true })

      // Fetch recent activity
      const { data: recentTasks } = await supabase
        .from('tasks')
        .select('id, title, completed, updated_at')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(5)

      setStats({
        totalPlanners: planners?.length || 0,
        todayTasks: todayTasks?.length || 0,
        completedTasks: todayTasks?.filter(task => task.completed).length || 0,
        upcomingExams: exams?.length || 0,
        averageGrade: 85, // This would be calculated from actual grades
        studyStreak: 7 // This would be calculated from task completion history
      })

      setUpcomingDeadlines(exams || [])
      setRecentActivity(recentTasks || [])
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    }
  }

  const colorStyles = {
    indigo: { bg: 'bg-blue-100', text: 'text-blue-600' },
    green: { bg: 'bg-green-100', text: 'text-green-600' },
    orange: { bg: 'bg-yellow-100', text: 'text-yellow-600' },
    purple: { bg: 'bg-purple-100', text: 'text-purple-600' },
  }

  const StatCard = ({ icon: Icon, title, value, subtitle, color = 'indigo' }) => {
    const styles = colorStyles[color] || colorStyles.indigo

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center">
          <div className={`p-3 rounded-lg ${styles.bg}`}>
            <Icon className={`w-6 h-6 ${styles.text}`} />
          </div>
          <div className="ml-4">
            <h3 className="text-sm font-medium text-gray-500">{title}</h3>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {currentUser?.user_metadata?.username || 'Student'}!
        </h1>
        <p className="text-gray-600 mt-2">
          Here's your study progress overview for {format(new Date(), 'EEEE, MMMM d, yyyy')}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={BookOpen}
          title="Active Planners"
          value={stats.totalPlanners}
          subtitle="Study plans"
          color="indigo"
        />
        <StatCard
          icon={CheckSquare}
          title="Today's Tasks"
          value={`${stats.completedTasks}/${stats.todayTasks}`}
          subtitle="Completed"
          color="green"
        />
        <StatCard
          icon={Calendar}
          title="Upcoming Exams"
          value={stats.upcomingExams}
          subtitle="Next 7 days"
          color="orange"
        />
        <StatCard
          icon={TrendingUp}
          title="Study Streak"
          value={`${stats.studyStreak} days`}
          subtitle="Keep it up!"
          color="purple"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Recent Activity</h2>
            <div className="space-y-4">
              {recentActivity.length > 0 ? (
                recentActivity.map((task) => (
                  <div key={task.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                    <div className={`p-2 rounded-full ${task.completed ? 'bg-green-100' : 'bg-yellow-100'}`}>
                      <CheckSquare className={`w-4 h-4 ${task.completed ? 'text-green-600' : 'text-yellow-600'}`} />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{task.title}</p>
                      <p className="text-sm text-gray-500">
                        {task.completed ? 'Completed' : 'Updated'} • {format(new Date(task.updated_at), 'MMM d, h:mm a')}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No recent activity</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Upcoming Deadlines */}
        <div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Upcoming Deadlines</h2>
            <div className="space-y-4">
              {upcomingDeadlines.length > 0 ? (
                upcomingDeadlines.map((exam) => (
                  <div key={exam.id} className="flex items-center space-x-4 p-4 bg-red-50 rounded-lg border border-red-200">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{exam.name}</p>
                      <p className="text-sm text-red-600">
                        {format(new Date(exam.date), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No upcoming deadlines</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h2>
            <div className="space-y-3">
              <button className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                <span className="font-medium text-gray-900">Create New Planner</span>
              </button>
              <button className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors">
                <CheckSquare className="w-5 h-5 text-green-600" />
                <span className="font-medium text-gray-900">Add Task</span>
              </button>
              <button className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors">
                <Award className="w-5 h-5 text-purple-600" />
                <span className="font-medium text-gray-900">Log Grade</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard