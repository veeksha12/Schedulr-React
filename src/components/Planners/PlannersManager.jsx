import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { Plus, BookOpen, Calendar, Target, Edit, Trash2, Clock, GraduationCap, X, ArrowLeft, CheckCircle2, Circle } from 'lucide-react'
import { format, differenceInDays } from 'date-fns'
import { ACTIONS, getXPForAction } from '../../lib/gamification'

const PlannersManager = () => {
  const { user, addXP } = useAuth()
  const [planners, setPlanners] = useState([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingPlanner, setEditingPlanner] = useState(null)
  const [loading, setLoading] = useState(true)
  const [plannerTasks, setPlannerTasks] = useState({})
  const [selectedPlanner, setSelectedPlanner] = useState(null)
  const [selectedPlannerTasks, setSelectedPlannerTasks] = useState([])
  const [fetchingTasks, setFetchingTasks] = useState(false)

  useEffect(() => {
    if (user) {
      fetchPlanners()
    }
  }, [user])

  const fetchPlanners = async () => {
    try {
      const { data, error } = await supabase
        .from('planners')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setPlanners(data || [])

      // Fetch task counts per planner for progress
      if (data && data.length > 0) {
        const { data: tasks } = await supabase
          .from('tasks')
          .select('planner_id, completed')
          .eq('user_id', user.id)
          .not('planner_id', 'is', null)

        if (tasks) {
          const map = {}
          tasks.forEach(t => {
            if (!map[t.planner_id]) map[t.planner_id] = { total: 0, completed: 0 }
            map[t.planner_id].total++
            if (t.completed) map[t.planner_id].completed++
          })
          setPlannerTasks(map)
        }
      }
    } catch (error) {
      console.error('Error fetching planners:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSelectedPlannerTasks = async (plannerId) => {
    setFetchingTasks(true)
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('planner_id', plannerId)
        .order('due_date', { ascending: true })

      if (error) throw error
      setSelectedPlannerTasks(data || [])
    } catch (error) {
      console.error('Error fetching planner tasks:', error)
    } finally {
      setFetchingTasks(false)
    }
  }

  const handleSelectPlanner = (planner) => {
    setSelectedPlanner(planner)
    fetchSelectedPlannerTasks(planner.id)
  }

  const toggleTask = async (task) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ completed: !task.completed })
        .eq('id', task.id)

      if (error) throw error

      // Log activity
      await supabase.from('task_history').insert([{
        user_id: user.id,
        task_id: task.id,
        action: task.completed ? 'uncompleted' : 'completed'
      }])

      if (!task.completed) {
        await addXP(getXPForAction(ACTIONS.TASK_COMPLETED))
      }

      // Refresh both the detailed task list and the main planner counts
      await fetchSelectedPlannerTasks(task.planner_id)
      await fetchPlanners()
    } catch (error) {
      console.error('Error toggling task:', error)
    }
  }

  const typeColors = {
    semester: { bg: 'bg-[#F2F8F5]', text: 'text-[#98B4A6]', border: 'border-[#98B4A6]/20', badge: 'bg-white' },
    course: { bg: 'bg-[#F0F7FF]', text: 'text-[#A7C7E7]', border: 'border-[#A7C7E7]/20', badge: 'bg-white' },
    degree: { bg: 'bg-[#F8F7FF]', text: 'text-[#E8B4B8]', border: 'border-[#E8B4B8]/20', badge: 'bg-white' },
    certification: { bg: 'bg-[#FFF9F2]', text: 'text-[#D4A373]', border: 'border-[#D4A373]/20', badge: 'bg-white' },
  }

  const getProgress = (plannerId) => {
    const data = plannerTasks[plannerId]
    if (!data || data.total === 0) return null
    return Math.round((data.completed / data.total) * 100)
  }

  const getDaysLeft = (endDate) => {
    if (!endDate) return null
    const days = differenceInDays(new Date(endDate), new Date())
    return days >= 0 ? days : null
  }

  const CreatePlannerForm = ({ planner, onClose, onSave }) => {
    const [formData, setFormData] = useState({
      name: planner?.name || '',
      description: planner?.description || '',
      type: planner?.type || 'semester',
      target_grade: planner?.target_grade || '',
      start_date: planner?.start_date || format(new Date(), 'yyyy-MM-dd'),
      end_date: planner?.end_date || '',
      study_hours_per_day: planner?.study_hours_per_day || 2
    })

    const handleSubmit = async (e) => {
      e.preventDefault()
      
      try {
        if (planner) {
          const { error } = await supabase
            .from('planners')
            .update(formData)
            .eq('id', planner.id)
          
          if (error) throw error
        } else {
          const { error } = await supabase
            .from('planners')
            .insert([{ ...formData, user_id: user.id }])
          
          if (error) throw error
          await addXP(getXPForAction(ACTIONS.PLANNER_CREATED))
        }
        
        onSave()
        onClose()
        fetchPlanners()
      } catch (error) {
        console.error('Error saving planner:', error)
      }
    }

    return (
      <div className="fixed inset-0 bg-white/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4">
        <div className="bg-white rounded-[3rem] p-8 w-full max-w-md shadow-2xl border-4 border-[#F3EFE9] animate-scale-in">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-black text-gray-800 tracking-tight">
              {planner ? 'Edit Planner' : 'New Planner'}
            </h2>
            <button onClick={onClose} className="w-10 h-10 flex items-center justify-center bg-[#FCFAF7] hover:bg-gray-100 rounded-2xl transition-colors">
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[10px] font-black text-[#98B4A6] uppercase tracking-widest mb-2 px-1">Planner Name</label>
              <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-5 py-3.5 border-2 border-[#F3EFE9] rounded-2xl focus:ring-0 focus:border-[#98B4A6] text-sm bg-[#FCFAF7] font-bold placeholder:text-gray-300 transition-all" placeholder="e.g., Spring 2025" required />
            </div>

            <div>
              <label className="block text-[10px] font-black text-[#98B4A6] uppercase tracking-widest mb-2 px-1">Description</label>
              <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-5 py-3.5 border-2 border-[#F3EFE9] rounded-2xl focus:ring-0 focus:border-[#98B4A6] text-sm bg-[#FCFAF7] font-bold placeholder:text-gray-300 transition-all" rows="2" placeholder="What are your goals?" />
            </div>

            <div>
              <label className="block text-[10px] font-black text-[#98B4A6] uppercase tracking-widest mb-2 px-1">Type</label>
              <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="w-full px-5 py-3.5 border-2 border-[#F3EFE9] rounded-2xl focus:ring-0 focus:border-[#98B4A6] text-sm bg-[#FCFAF7] font-bold text-gray-600 transition-all">
                <option value="semester">Semester</option>
                <option value="course">Course</option>
                <option value="degree">Degree</option>
                <option value="certification">Certification</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-[#98B4A6] uppercase tracking-widest mb-2 px-1">Start Date</label>
                <input type="date" value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} className="w-full px-4 py-3 border-2 border-[#F3EFE9] rounded-2xl focus:ring-0 focus:border-[#98B4A6] text-sm bg-[#FCFAF7] font-bold text-gray-600" required />
              </div>
              <div>
                <label className="block text-[10px] font-black text-[#98B4A6] uppercase tracking-widest mb-2 px-1">End Date</label>
                <input type="date" value={formData.end_date} onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} className="w-full px-4 py-3 border-2 border-[#F3EFE9] rounded-2xl focus:ring-0 focus:border-[#98B4A6] text-sm bg-[#FCFAF7] font-bold text-gray-600" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-[#98B4A6] uppercase tracking-widest mb-2 px-1">Target Grade</label>
                <input type="text" value={formData.target_grade} onChange={(e) => setFormData({ ...formData, target_grade: e.target.value })} className="w-full px-4 py-3 border-2 border-[#F3EFE9] rounded-2xl focus:ring-0 focus:border-[#98B4A6] text-sm bg-[#FCFAF7] font-bold text-gray-600" placeholder="e.g., A" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-[#98B4A6] uppercase tracking-widest mb-2 px-1">Study Hours/Day</label>
                <input type="number" value={formData.study_hours_per_day} onChange={(e) => setFormData({ ...formData, study_hours_per_day: parseInt(e.target.value) })} className="w-full px-4 py-3 border-2 border-[#F3EFE9] rounded-2xl focus:ring-0 focus:border-[#98B4A6] text-sm bg-[#FCFAF7] font-bold text-gray-600" min="1" max="12" />
              </div>
            </div>

            <div className="flex space-x-4 pt-4">
              <button type="submit" className="flex-1 bg-[#98B4A6] text-white py-4 px-6 rounded-[2rem] hover:bg-[#6B8E7E] transition-all font-black text-sm shadow-lg shadow-[#98B4A6]/20">
                {planner ? 'Save' : 'Add'} Planner
              </button>
              <button type="button" onClick={onClose} className="flex-1 bg-[#FCFAF7] text-gray-500 py-4 px-6 rounded-[2rem] hover:bg-gray-100 transition-all font-bold text-sm border-2 border-[#F3EFE9]">
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  const PlannerDetail = ({ planner, tasks, onBack, onToggleTask }) => {
    const colors = typeColors[planner.type] || typeColors.semester
    const progress = getProgress(planner.id)
    const daysLeft = getDaysLeft(planner.end_date)

    const completedTasks = tasks.filter(t => t.completed)
    const pendingTasks = tasks.filter(t => !t.completed)

    return (
      <div className="space-y-6 animate-fade-in">
        <button 
          onClick={onBack}
          className="flex items-center space-x-2 text-[#98B4A6] hover:text-[#6B8E7E] font-black text-sm uppercase tracking-widest transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Planners</span>
        </button>

        <div className="bg-white rounded-[3rem] shadow-sm border-2 border-[#F3EFE9] overflow-hidden">
          <div className={`h-4 bg-gradient-to-r ${planner.type === 'semester' ? 'from-[#98B4A6] to-[#B8CDC1]' : 'from-[#E8B4B8] to-[#F3D1D4]'}`} />
          <div className="p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
              <div className="flex items-center space-x-4">
                <div className={`p-4 rounded-2xl ${colors.badge}`}>
                  <BookOpen className={`w-8 h-8 ${colors.text}`} />
                </div>
                <div>
                  <div className="flex items-center space-x-3 mb-1">
                    <h2 className="text-3xl font-bold text-gray-900">{planner.name}</h2>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${colors.badge} ${colors.text}`}>
                      {planner.type}
                    </span>
                  </div>
                  <p className="text-gray-500">{planner.description || 'No description provided'}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <button onClick={(e) => { e.stopPropagation(); setEditingPlanner(planner); }} className="p-2.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all border border-gray-100">
                  <Edit className="w-5 h-5" />
                </button>
                <button onClick={(e) => { e.stopPropagation(); deletePlanner(planner.id); onBack(); }} className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all border border-gray-100">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-[#FCFAF7] rounded-[2rem] p-6 border border-[#F3EFE9]">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center border border-[#F3EFE9]">
                    <Target className="w-4 h-4 text-[#98B4A6]" />
                  </div>
                  <span className="text-[10px] font-black text-[#98B4A6] uppercase tracking-widest">Target Grade</span>
                </div>
                <p className="text-2xl font-black text-gray-800 tracking-tight">{planner.target_grade || '—'}</p>
              </div>
              <div className="bg-[#FCFAF7] rounded-[2rem] p-6 border border-[#F3EFE9]">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center border border-[#F3EFE9]">
                    <Calendar className="w-4 h-4 text-[#A7C7E7]" />
                  </div>
                  <span className="text-[10px] font-black text-[#98B4A6] uppercase tracking-widest">Timeframe</span>
                </div>
                <div className="text-xs font-bold text-gray-600 leading-relaxed uppercase tracking-tight">
                  {format(new Date(planner.start_date), 'MMM d, yyyy')}
                  <span className="mx-2 text-gray-300">→</span>
                  {planner.end_date ? format(new Date(planner.end_date), 'MMM d, yyyy') : 'Ongoing'}
                </div>
              </div>
              <div className="bg-[#FCFAF7] rounded-[2rem] p-6 border border-[#F3EFE9]">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center border border-[#F3EFE9]">
                    <Clock className="w-4 h-4 text-[#E8B4B8]" />
                  </div>
                  <span className="text-[10px] font-black text-[#98B4A6] uppercase tracking-widest">Study Load</span>
                </div>
                <p className="text-2xl font-black text-gray-800 tracking-tight">{planner.study_hours_per_day}h/day</p>
              </div>
              <div className="bg-[#FCFAF7] rounded-[2rem] p-6 border border-[#F3EFE9]">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center border border-[#F3EFE9]">
                    <GraduationCap className="w-4 h-4 text-[#D4A373]" />
                  </div>
                  <span className="text-[10px] font-black text-[#98B4A6] uppercase tracking-widest">Remaining</span>
                </div>
                <p className="text-2xl font-black text-gray-800 tracking-tight">{daysLeft !== null ? `${daysLeft} days` : '—'}</p>
              </div>
            </div>

            <div className="bg-[#F2F8F5] rounded-[2rem] p-8 border border-[#98B4A6]/20 mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-black text-[#98B4A6] uppercase tracking-widest text-sm">Overall Progress</h3>
                <span className="text-3xl font-black text-[#98B4A6]">{progress || 0}%</span>
              </div>
              <div className="h-4 bg-white rounded-full overflow-hidden border border-[#98B4A6]/10 p-0.5">
                <div className="h-full bg-gradient-to-r from-[#98B4A6] to-[#B8CDC1] rounded-full transition-all duration-1000" style={{ width: `${progress || 0}%` }} />
              </div>
              <p className="text-[10px] text-[#98B4A6] mt-4 font-black uppercase tracking-widest">
                {completedTasks.length} of {tasks.length} tasks completed
              </p>
            </div>

            <div className="space-y-6">
              <h3 className="text-xl font-bold text-gray-900">Linked Tasks</h3>
              
              {fetchingTasks ? (
                <div className="flex justify-center py-12">
                  <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                </div>
              ) : tasks.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pendingTasks.map(task => (
                    <div key={task.id} className="flex items-center space-x-4 p-5 bg-white rounded-[2rem] border-2 border-[#F3EFE9] shadow-sm hover:border-[#98B4A6]/30 transition-all group">
                      <button 
                        onClick={() => onToggleTask(task)}
                        className="w-10 h-10 flex items-center justify-center bg-[#FCFAF7] rounded-xl group-hover:bg-[#F2F8F5] transition-colors"
                      >
                        <Circle className="w-5 h-5 text-gray-200 group-hover:text-[#98B4A6]" />
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-800 truncate">{task.title}</p>
                        <p className="text-[10px] text-[#98B4A6] font-black uppercase tracking-widest mt-0.5">
                          Due {task.due_date ? format(new Date(task.due_date), 'MMM d') : 'Pending'}
                        </p>
                      </div>
                      <div className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                        task.priority === 'high' ? 'bg-[#FDF2F2] text-[#E8B4B8] border border-[#E8B4B8]/20' : 
                        task.priority === 'medium' ? 'bg-[#FFF9F2] text-[#D4A373] border border-[#D4A373]/20' : 
                        'bg-[#F2F8F5] text-[#98B4A6] border border-[#98B4A6]/20'
                      }`}>
                        {task.priority}
                      </div>
                    </div>
                  ))}
                  
                  {completedTasks.map(task => (
                    <div key={task.id} className="flex items-center space-x-4 p-5 bg-[#F2F8F5]/30 rounded-[2rem] border-2 border-[#F3EFE9]/50 shadow-sm transition-all group">
                      <button 
                        onClick={() => onToggleTask(task)}
                        className="w-10 h-10 flex items-center justify-center bg-[#F2F8F5] rounded-xl group-hover:bg-[#E8F3ED] transition-colors"
                      >
                        <CheckCircle2 className="w-5 h-5 text-[#98B4A6]" />
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-400 truncate line-through">{task.title}</p>
                        <p className="text-[10px] text-[#98B4A6] font-black uppercase tracking-widest mt-0.5">Completed</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                  <Plus className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500 font-medium">No tasks linked to this planner</p>
                  <p className="text-xs text-gray-400 mt-1">Add tasks from the Todo List and link them here</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const deletePlanner = async (plannerId) => {
    if (confirm('Are you sure you want to delete this planner? This action cannot be undone.')) {
      try {
        const { error } = await supabase
          .from('planners')
          .delete()
          .eq('id', plannerId)
        
        if (error) throw error
        fetchPlanners()
      } catch (error) {
        console.error('Error deleting planner:', error)
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-[#F3EFE9] border-t-[#98B4A6] rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header (Only show in Grid Mode) */}
      {!selectedPlanner && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Study Planners</h1>
            <p className="text-[10px] text-[#98B4A6] font-bold uppercase tracking-widest mt-1">Manage your academic planning and goals</p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center space-x-2 bg-[#98B4A6] text-white px-7 py-3 rounded-[1.5rem] hover:bg-[#6B8E7E] transition-all shadow-lg shadow-[#98B4A6]/20 font-black text-sm"
          >
            <Plus className="w-5 h-5" />
            <span>New Planner</span>
          </button>
        </div>
      )}

      {/* Main Content Area */}
      {selectedPlanner ? (
        <PlannerDetail 
          planner={selectedPlanner} 
          tasks={selectedPlannerTasks} 
          onBack={() => { setSelectedPlanner(null); fetchPlanners(); }} 
          onToggleTask={toggleTask}
        />
      ) : planners.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {planners.map((planner) => {
            const colors = typeColors[planner.type] || typeColors.semester
            const progress = getProgress(planner.id)
            const daysLeft = getDaysLeft(planner.end_date)

            return (
              <div 
                key={planner.id} 
                onClick={() => handleSelectPlanner(planner)}
                className="bg-white rounded-[2.5rem] border-2 border-[#F3EFE9] p-7 card-hover cursor-pointer group shadow-sm hover:shadow-xl transition-all duration-500"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-2xl ${colors.bg} flex items-center justify-center group-hover:scale-110 transition-transform duration-500`}>
                      <BookOpen className={`w-6 h-6 ${colors.text}`} />
                    </div>
                    <div>
                      <h3 className="font-black text-gray-800 group-hover:text-[#98B4A6] transition-colors leading-tight">{planner.name}</h3>
                      <span className={`inline-block text-[9px] font-black px-2 py-0.5 rounded-lg mt-1.5 uppercase tracking-widest ${colors.bg} ${colors.text} border border-current opacity-70`}>
                        {planner.type}
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => setEditingPlanner(planner)} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-[#98B4A6] hover:bg-[#F2F8F5] rounded-xl transition-all">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => deletePlanner(planner.id)} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-[#E8B4B8] hover:bg-[#FDF2F2] rounded-xl transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {planner.description && (
                  <p className="text-gray-500 text-sm mb-6 line-clamp-2 font-medium leading-relaxed">{planner.description}</p>
                )}

                {/* Progress bar */}
                {progress !== null && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between text-[10px] mb-2 px-1">
                      <span className="text-[#98B4A6] font-black uppercase tracking-widest">Progress</span>
                      <span className="text-[#98B4A6] font-black">{progress}%</span>
                    </div>
                    <div className="h-3 bg-[#FCFAF7] rounded-full overflow-hidden border border-[#F3EFE9] p-0.5">
                      <div className="h-full bg-gradient-to-r from-[#98B4A6] to-[#B8CDC1] rounded-full progress-bar-fill" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                )}

                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between text-[10px] font-black text-[#98B4A6] uppercase tracking-widest px-1">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-[#98B4A6] opacity-40" />
                      <span>{format(new Date(planner.start_date), 'MMM d')}</span>
                    </div>
                    {daysLeft !== null && (
                      <span className="text-[#E8B4B8]">{daysLeft} days left</span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-[3rem] border-2 border-[#F3EFE9] border-dashed">
          <div className="w-24 h-24 rounded-[2rem] bg-[#FCFAF7] flex items-center justify-center mx-auto mb-6 border-2 border-[#F3EFE9]">
            <BookOpen className="w-10 h-10 text-[#98B4A6]/40" />
          </div>
          <h3 className="text-xl font-black text-gray-800 mb-2 tracking-tight">No planners yet</h3>
          <p className="text-[10px] text-[#98B4A6] font-black uppercase tracking-widest mb-8 max-w-xs mx-auto opacity-70">Add your first planner to begin organizing your academic path</p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center space-x-3 bg-white text-[#98B4A6] border-2 border-[#98B4A6]/20 px-8 py-4 rounded-[2rem] hover:bg-[#F2F8F5] transition-all font-black text-sm mx-auto shadow-sm"
          >
            <Plus className="w-5 h-5" />
            <span>Add Your First Planner</span>
          </button>
        </div>
      )}

      {(showCreateForm || editingPlanner) && (
        <CreatePlannerForm
          planner={editingPlanner}
          onClose={() => { setShowCreateForm(false); setEditingPlanner(null) }}
          onSave={() => { setShowCreateForm(false); setEditingPlanner(null) }}
        />
      )}
    </div>
  )
}

export default PlannersManager