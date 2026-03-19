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
  AlertCircle,
  Flame,
  ArrowRight,
  Zap,
  GraduationCap
} from 'lucide-react'
import { format, isToday, addDays, differenceInDays } from 'date-fns'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { calculateLevel, getLevelProgress } from '../../lib/gamification'
import ActivityHeatmap from './ActivityHeatmap'

const Dashboard = ({ setActiveTab }) => {
  const { user } = useAuth()

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
    todayCompletedTasks: 0,
    allCompletedTasks: 0,
    totalTasks: 0,
    upcomingExams: 0,
    averageGrade: 0,
    studyStreak: 0
  })
  const [recentActivity, setRecentActivity] = useState([])
  const [upcomingDeadlines, setUpcomingDeadlines] = useState([])
  const [gradeChartData, setGradeChartData] = useState([])
  const [heatmapData, setHeatmapData] = useState({})

  useEffect(() => {
    if (currentUser && supabase) {
      fetchDashboardData()
    } else if (currentUser && !supabase) {
      setStats({
        totalPlanners: 2,
        todayTasks: 5,
        todayCompletedTasks: 3,
        allCompletedTasks: 7,
        totalTasks: 12,
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
      setGradeChartData([
        { name: 'Math', current: 88, target: 90 },
        { name: 'Physics', current: 76, target: 85 }
      ])
    }
  }, [currentUser])

  const fetchDashboardData = async () => {
    if (!supabase) return

    try {
      const { data: planners } = await supabase
        .from('planners')
        .select('id')
        .eq('user_id', currentUser.id)

      const today = format(new Date(), 'yyyy-MM-dd')
      const { data: todayTasks } = await supabase
        .from('tasks')
        .select('id, completed')
        .eq('user_id', currentUser.id)
        .eq('due_date', today)

      const { data: allTasks } = await supabase
        .from('tasks')
        .select('id, completed')
        .eq('user_id', currentUser.id)

      const nextWeek = format(addDays(new Date(), 7), 'yyyy-MM-dd')
      const { data: exams } = await supabase
        .from('exams')
        .select('id, name, date')
        .eq('user_id', currentUser.id)
        .gte('date', today)
        .lte('date', nextWeek)
        .order('date', { ascending: true })

      const { data: recentTasks } = await supabase
        .from('tasks')
        .select('id, title, completed, updated_at')
        .eq('user_id', currentUser.id)
        .order('updated_at', { ascending: false })
        .limit(5)

      // Compute real average grade from courses and exams
      const { data: courses } = await supabase
        .from('courses')
        .select('id, name, target_grade')
        .eq('user_id', currentUser.id)

      const { data: allExams } = await supabase
        .from('exams')
        .select('course_id, grade, max_grade, weight')
        .eq('user_id', currentUser.id)

      let avgGrade = 0
      const chartData = []
      if (courses && courses.length > 0 && allExams) {
        let totalGrade = 0
        let gradedCourses = 0
        courses.forEach(course => {
          const courseExams = allExams.filter(e => e.course_id === course.id && e.grade !== null)
          if (courseExams.length > 0) {
            let wGrade = 0, wTotal = 0
            courseExams.forEach(e => {
              wGrade += (e.grade / e.max_grade) * e.weight
              wTotal += e.weight
            })
            const pct = wTotal > 0 ? Math.round((wGrade / wTotal) * 100) : 0
            totalGrade += pct
            gradedCourses++
            const targetNum = parseInt(course.target_grade) || 0
            chartData.push({ name: course.name.length > 10 ? course.name.substring(0, 10) + '…' : course.name, current: pct, target: targetNum })
          }
        })
        avgGrade = gradedCourses > 0 ? Math.round(totalGrade / gradedCourses) : 0
      }
      setGradeChartData(chartData)

      // Compute study streak from task_history
      let streak = 0
      const { data: history } = await supabase
        .from('task_history')
        .select('created_at')
        .eq('user_id', currentUser.id)
        .eq('action', 'completed')
        .order('created_at', { ascending: false })

      if (history && history.length > 0) {
        const uniqueDays = [...new Set(history.map(h => format(new Date(h.created_at), 'yyyy-MM-dd')))]
        uniqueDays.sort((a, b) => b.localeCompare(a))
        let checkDate = new Date()
        // Allow today or yesterday as start
        if (uniqueDays[0] !== format(checkDate, 'yyyy-MM-dd')) {
          checkDate = addDays(checkDate, -1)
        }
        for (const day of uniqueDays) {
          if (day === format(checkDate, 'yyyy-MM-dd')) {
            streak++
            checkDate = addDays(checkDate, -1)
          } else {
            break
          }
        }
      }

      setStats({
        totalPlanners: planners?.length || 0,
        todayTasks: todayTasks?.length || 0,
        todayCompletedTasks: todayTasks?.filter(task => task.completed).length || 0,
        allCompletedTasks: allTasks?.filter(task => task.completed).length || 0,
        totalTasks: allTasks?.length || 0,
        upcomingExams: exams?.length || 0,
        averageGrade: avgGrade,
        studyStreak: streak
      })

      setUpcomingDeadlines(exams || [])
      setRecentActivity(recentTasks || [])

      // Process heatmap data
      if (history) {
        const heatmap = {}
        history.forEach(h => {
          const date = format(new Date(h.created_at), 'yyyy-MM-dd')
          heatmap[date] = (heatmap[date] || 0) + 1
        })
        setHeatmapData(heatmap)
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    }
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  const todayTaskPct = stats.todayTasks > 0
    ? Math.round((stats.todayCompletedTasks / stats.todayTasks) * 100)
    : 0

  const overallTaskPct = stats.totalTasks > 0
    ? Math.round((stats.allCompletedTasks / stats.totalTasks) * 100)
    : 0

  const StatCard = ({ icon: Icon, title, value, subtitle, gradient, iconBg }) => (
    <div className={`rounded-[3rem] p-8 card-hover shadow-sm border-2 border-[#F3EFE9] bg-white transition-all duration-500 overflow-hidden relative group`}>
      <div className={`absolute top-0 right-0 w-24 h-24 ${iconBg} opacity-5 group-hover:opacity-10 rounded-full -mr-8 -mt-8 transition-opacity`} />
      <div className="flex items-center justify-between relative z-10">
        <div className="space-y-1">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{title}</p>
          <p className="text-3xl font-black text-gray-800 tracking-tight">{value}</p>
          {subtitle && <p className="text-[10px] text-[#98B4A6] font-bold mt-1">{subtitle}</p>}
        </div>
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-white shadow-sm border border-[#F3EFE9] group-hover:bg-[#98B4A6] transition-colors duration-500`}>
          <Icon className="w-6 h-6 text-[#98B4A6] group-hover:text-white transition-colors" />
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      {/* Header - Wholesome Greeting */}
      <div>
        <h1 className="text-3xl font-black text-gray-900 flex items-center">
          Welcome back, <span className="text-[#98B4A6] ml-2">{currentUser?.user_metadata?.username || 'Student'}</span>!
        </h1>
        <p className="text-[#98B4A6] font-bold uppercase tracking-widest text-[10px] mt-2 bg-[#F2F8F5] inline-block px-3 py-1 rounded-lg border border-[#E6F2EC]">
          {format(new Date(), 'EEEE, MMMM d')} • Have a productive study day
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          icon={BookOpen}
          title="Active Planners"
          value={stats.totalPlanners}
          subtitle="Study plans"
          gradient="stat-gradient-blue"
          iconBg="bg-gradient-to-br from-blue-500 to-indigo-600"
        />
        <StatCard
          icon={CheckSquare}
          title="Today's Tasks"
          value={`${stats.todayCompletedTasks}/${stats.todayTasks}`}
          subtitle="Completed"
          gradient="stat-gradient-green"
          iconBg="bg-gradient-to-br from-emerald-500 to-green-600"
        />
        <StatCard
          icon={Calendar}
          title="Upcoming Exams"
          value={stats.upcomingExams}
          subtitle="Next 7 days"
          gradient="stat-gradient-orange"
          iconBg="bg-gradient-to-br from-amber-500 to-orange-600"
        />
        <StatCard
          icon={Flame}
          title="Study Streak"
          value={`${stats.studyStreak}`}
          subtitle={stats.studyStreak > 0 ? `${stats.studyStreak} day${stats.studyStreak > 1 ? 's' : ''} — Keep it up! 🔥` : 'Complete a task to start'}
          gradient="stat-gradient-purple"
          iconBg="bg-gradient-to-br from-purple-500 to-pink-600"
        />
        <div className="rounded-[3rem] p-8 bg-white border-2 border-[#F3EFE9] shadow-sm relative group overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#E8B4B8]/5 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-110 duration-700" />
          <div className="flex items-center justify-between mb-6 relative z-10">
            <div>
              <p className="text-[10px] font-black text-[#E8B4B8] uppercase tracking-widest mb-1 px-2 py-0.5 bg-[#F3D1D4]/30 rounded-lg inline-block">Active Level {calculateLevel(currentUser?.user_metadata?.xp || 0)}</p>
              <p className="text-3xl font-black text-gray-800 tracking-tight">{currentUser?.user_metadata?.xp || 0} XP</p>
            </div>
            <div className="w-16 h-16 bg-[#F3D1D4] rounded-2xl flex items-center justify-center shadow-lg shadow-[#E8B4B8]/20 animate-float">
              <Zap className="w-7 h-7 text-white" />
            </div>
          </div>
          <div className="space-y-3 relative z-10">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex justify-between">
              <span>Experience Progress</span>
              <span className="text-[#E8B4B8]">{Math.floor(getLevelProgress(currentUser?.user_metadata?.xp || 0))}%</span>
            </p>
            <div className="h-3.5 w-full bg-gray-50 rounded-full overflow-hidden p-0.5 border border-[#F3EFE9]">
              <div
                className="h-full bg-gradient-to-r from-[#E8B4B8] to-[#F3D1D4] rounded-full transition-all duration-1000"
                style={{ width: `${getLevelProgress(currentUser?.user_metadata?.xp || 0)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Activity Heatmap */}
      <div className="bg-white rounded-[3rem] border-2 border-[#F3EFE9] p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div>
            <h2 className="text-xl font-black text-gray-800 tracking-tight">Activity Overview</h2>
            <p className="text-[10px] text-[#98B4A6] font-bold uppercase tracking-widest mt-1">Your productivity over the last 20 weeks</p>
          </div>
          <div className="flex items-center space-x-2 text-[10px] font-black text-[#98B4A6] bg-[#F2F8F5] px-4 py-2 rounded-xl border border-[#E6F2EC] uppercase tracking-widest">
            <Flame className="w-4 h-4 text-[#98B4A6]" />
            <span>Habit Streak: {stats.studyStreak} Days</span>
          </div>
        </div>
        <ActivityHeatmap data={heatmapData} />
      </div>

      {(gradeChartData.length > 0 || stats.totalTasks > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Grades Snapshot */}
          {gradeChartData.length > 0 && (
            <div className="bg-white rounded-[3rem] border-2 border-[#F3EFE9] p-8 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-lg font-black text-gray-800 tracking-tight">Grade Overview</h2>
                <span className="text-[10px] font-black text-[#98B4A6] bg-[#F2F8F5] px-3 py-1.5 rounded-lg border border-[#E6F2EC] uppercase tracking-widest">
                  Avg {stats.averageGrade}%
                </span>
              </div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={gradeChartData} barGap={6}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3EFE9" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 700, fill: '#98B4A6' }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10, fontWeight: 700, fill: '#98B4A6' }} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{ fill: '#FCFAF7' }} contentStyle={{ borderRadius: '1.5rem', border: '2px solid #F3EFE9', boxShadow: 'none' }} />
                    <Bar dataKey="current" fill="#98B4A6" radius={[8, 8, 8, 8]} name="Current" barSize={20} />
                    <Bar dataKey="target" fill="#E8B4B8" radius={[8, 8, 8, 8]} name="Target" barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Growth Progress */}
          {stats.totalTasks > 0 && (
            <div className="bg-white rounded-[3rem] border-2 border-[#F3EFE9] p-8 shadow-sm">
              <h2 className="text-lg font-black text-gray-800 tracking-tight mb-8">Task Progress</h2>
              <div className="flex items-center justify-center h-48">
                <div className="text-center relative">
                  <div className="relative w-40 h-40 mx-auto">
                    <svg className="w-40 h-40 transform -rotate-90 overflow-visible" viewBox="0 0 40 40">
                      <circle cx="20" cy="20" r="16" fill="none" stroke="#F3EFE9" strokeWidth="2.5" />
                      <circle cx="20" cy="20" r="16" fill="none" stroke="#98B4A6" strokeWidth="2.5" strokeDasharray={`${(overallTaskPct / 100) * (2 * Math.PI * 16)}, 200`} strokeLinecap="round" className="transition-all duration-1000 ease-out" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <p className="text-3xl font-black text-gray-800 leading-none">{overallTaskPct}%</p>
                        <p className="text-[10px] text-[#98B4A6] uppercase tracking-widest font-black mt-2">Overall</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-center text-[11px] text-gray-400 font-bold mt-4">
                You've completed <span className="text-[#98B4A6]">{stats.allCompletedTasks}</span> tasks out of {stats.totalTasks}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity - Cozy Log */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-[3rem] border-2 border-[#F3EFE9] p-8 shadow-sm h-full">
            <h2 className="text-lg font-black text-gray-800 tracking-tight mb-8 flex items-center">
              Recent Activity <span className="ml-2 w-2 h-2 rounded-full bg-[#98B4A6]" />
            </h2>
            <div className="space-y-4">
              {recentActivity.length > 0 ? (
                recentActivity.map((task) => (
                  <div key={task.id} className="flex items-center space-x-5 p-5 bg-[#FCFAF7] rounded-[2rem] border border-[#F3EFE9] group hover:bg-white transition-all duration-500">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors duration-500 ${task.completed ? 'bg-[#F2F8F5] text-[#98B4A6]' : 'bg-[#FFF9F2] text-[#D4A373]'}`}>
                      <CheckSquare className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-800 truncate">{task.title}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                        {task.completed ? 'Completed' : 'In Progress'} • {format(new Date(task.updated_at), 'MMM d, h:mm a')}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-16 bg-[#FCFAF7] rounded-[3rem] border-2 border-dashed border-[#F3EFE9]">
                  <Clock className="w-12 h-12 text-[#98B4A6]/30 mx-auto mb-4" />
                  <p className="text-gray-400 text-sm font-bold">No recent activity</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Upcoming Deadlines - Gentle Warning */}
          <div className="bg-white rounded-[3rem] border-2 border-[#F3EFE9] p-8 shadow-sm">
            <h2 className="text-lg font-black text-gray-800 tracking-tight mb-8">Upcoming Deadlines</h2>
            <div className="space-y-4">
              {upcomingDeadlines.length > 0 ? (
                upcomingDeadlines.map((exam) => {
                  const daysLeft = differenceInDays(new Date(exam.date), new Date())
                  return (
                    <div key={exam.id} className="flex items-center space-x-4 p-4 bg-[#FFF9F2] rounded-[2rem] border border-[#F3EFE9]">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                        <AlertCircle className="w-5 h-5 text-[#D4A373]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-800 text-sm truncate">{exam.name}</p>
                        <p className="text-[10px] text-[#D4A373] font-black uppercase tracking-widest mt-1">
                          {format(new Date(exam.date), 'MMM d')} • {daysLeft} day{daysLeft !== 1 ? 's' : ''} to prepare
                        </p>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="text-center py-10 bg-[#FCFAF7] rounded-[2rem]">
                  <Calendar className="w-10 h-10 text-[#98B4A6]/30 mx-auto mb-3" />
                  <p className="text-gray-400 text-xs font-bold">All clear for now</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions - Homely Buttons */}
          <div className="bg-white rounded-[3rem] border-2 border-[#F3EFE9] p-8 shadow-sm">
            <h2 className="text-lg font-black text-gray-800 tracking-tight mb-8">Quick Actions</h2>
            <div className="space-y-3">
              {[
                { tab: 'planners', icon: BookOpen, label: 'Manage Planners', color: 'bg-[#F0F7FF]', text: 'text-[#A7C7E7]' },
                { tab: 'todo', icon: CheckSquare, label: 'Add New Task', color: 'bg-[#F2F8F5]', text: 'text-[#98B4A6]' },
                { tab: 'grades', icon: GraduationCap, label: 'Track Grades', color: 'bg-[#F8F7FF]', text: 'text-[#E8B4B8]' },
                { tab: 'chat', icon: Zap, label: 'AI Space', color: 'bg-[#FFF9F2]', text: 'text-[#D4A373]' },
              ].map(({ tab, icon: Icon, label, color, text }) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-[#FCFAF7] rounded-[2rem] transition-all duration-300 group border border-transparent hover:border-[#F3EFE9]"
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center shadow-sm`}>
                      <Icon className={`w-5 h-5 ${text}`} />
                    </div>
                    <span className="font-bold text-sm text-gray-700">{label}</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-[#98B4A6] group-hover:translate-x-1 transition-all" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
