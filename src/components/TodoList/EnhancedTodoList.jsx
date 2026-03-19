import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { 
  Plus, 
  Calendar, 
  CheckSquare, 
  Clock, 
  Search,
  Edit,
  Trash2,
  History,
  X,
  Undo2,
  BarChart3,
  BookOpen
} from 'lucide-react'
import { format, isToday, isTomorrow, isThisWeek } from 'date-fns'
import { ACTIONS, getXPForAction } from '../../lib/gamification'

const EnhancedTodoList = () => {
  const { user, addXP } = useAuth()
  const [tasks, setTasks] = useState([])
  const [filteredTasks, setFilteredTasks] = useState([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterBy, setFilterBy] = useState('all')
  const [selectedDate, setSelectedDate] = useState('')
  const [showHistory, setShowHistory] = useState(false)
  const [taskHistory, setTaskHistory] = useState([])
  const [undoAction, setUndoAction] = useState(null)
  const [planners, setPlanners] = useState([])

  useEffect(() => {
    if (user) {
      fetchTasks()
      fetchTaskHistory()
      fetchPlanners()
    }
  }, [user])

  useEffect(() => {
    filterTasks()
  }, [tasks, searchTerm, filterBy, selectedDate])

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select(`*, subtasks (*)`)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setTasks(data || [])
    } catch (error) {
      console.error('Error fetching tasks:', error)
    }
  }

  const fetchPlanners = async () => {
    try {
      const { data, error } = await supabase
        .from('planners')
        .select('id, name')
        .eq('user_id', user.id)

      if (error) throw error
      setPlanners(data || [])
    } catch (error) {
      console.error('Error fetching planners:', error)
    }
  }

  const fetchTaskHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('task_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      setTaskHistory(data || [])
    } catch (error) {
      console.error('Error fetching task history:', error)
    }
  }

  const filterTasks = () => {
    let filtered = tasks

    if (searchTerm) {
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    switch (filterBy) {
      case 'completed':
        filtered = filtered.filter(task => task.completed)
        break
      case 'pending':
        filtered = filtered.filter(task => !task.completed)
        break
      case 'overdue':
        filtered = filtered.filter(task => 
          !task.completed && task.due_date && new Date(task.due_date) < new Date()
        )
        break
      case 'today':
        filtered = filtered.filter(task => 
          task.due_date && isToday(new Date(task.due_date))
        )
        break
      case 'tomorrow':
        filtered = filtered.filter(task => 
          task.due_date && isTomorrow(new Date(task.due_date))
        )
        break
      case 'thisweek':
        filtered = filtered.filter(task => 
          task.due_date && isThisWeek(new Date(task.due_date))
        )
        break
    }

    if (selectedDate) {
      filtered = filtered.filter(task => task.due_date === selectedDate)
    }

    setFilteredTasks(filtered)
  }

  const TaskForm = ({ task, onClose, onSave }) => {
    const [formData, setFormData] = useState({
      title: task?.title || '',
      description: task?.description || '',
      due_date: task?.due_date || null,
      priority: task?.priority || 'medium',
      category: task?.category || 'study',
      completed: task?.completed || false,
      planner_id: task?.planner_id || null
    })

    const handleSubmit = async (e) => {
      e.preventDefault()
      
      try {
        const submitData = { ...formData, due_date: formData.due_date || null }

        if (task) {
          const { error } = await supabase.from('tasks').update(submitData).eq('id', task.id)
          if (error) throw error
        } else {
          const { error } = await supabase.from('tasks').insert([{ ...submitData, user_id: user.id, completed: false }])
          if (error) throw error
        }
        
        onSave()
        onClose()
        await fetchTasks()
      } catch (error) {
        console.error('Error saving task:', error)
        alert('Error saving task: ' + error.message)
      }
    }

    return (
      <div className="fixed inset-0 bg-white/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4">
        <div className="bg-white rounded-[3rem] p-8 w-full max-w-md shadow-2xl border-4 border-[#F3EFE9] animate-scale-in">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-black text-gray-800 tracking-tight">{task ? 'Edit Task' : 'New Task'}</h2>
            <button onClick={onClose} className="w-10 h-10 flex items-center justify-center bg-[#FCFAF7] hover:bg-gray-100 rounded-2xl transition-colors">
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[10px] font-black text-[#98B4A6] uppercase tracking-widest mb-2 px-1">Task Name</label>
              <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full px-5 py-3.5 border-2 border-[#F3EFE9] rounded-2xl focus:ring-0 focus:border-[#98B4A6] text-sm bg-[#FCFAF7] font-bold placeholder:text-gray-300 transition-all" placeholder="Enter task name..." required />
            </div>

            <div>
              <label className="block text-[10px] font-black text-[#98B4A6] uppercase tracking-widest mb-2 px-1">Description</label>
              <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-5 py-3.5 border-2 border-[#F3EFE9] rounded-2xl focus:ring-0 focus:border-[#98B4A6] text-sm bg-[#FCFAF7] font-bold placeholder:text-gray-300 transition-all" rows="2" placeholder="Add notes..." />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-[#98B4A6] uppercase tracking-widest mb-2 px-1">Due Date</label>
                <input type="date" value={formData.due_date || ''} onChange={(e) => setFormData({ ...formData, due_date: e.target.value || null })} className="w-full px-4 py-3 border-2 border-[#F3EFE9] rounded-2xl focus:ring-0 focus:border-[#98B4A6] text-sm bg-[#FCFAF7] font-bold text-gray-600" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-[#98B4A6] uppercase tracking-widest mb-2 px-1">Priority</label>
                <select value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value })} className="w-full px-4 py-3 border-2 border-[#F3EFE9] rounded-2xl focus:ring-0 focus:border-[#98B4A6] text-sm bg-[#FCFAF7] font-bold text-gray-600">
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-[#98B4A6] uppercase tracking-widest mb-2 px-1">Category</label>
              <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full px-5 py-3.5 border-2 border-[#F3EFE9] rounded-2xl focus:ring-0 focus:border-[#98B4A6] text-sm bg-[#FCFAF7] font-bold text-gray-600">
                <option value="study">Study</option>
                <option value="assignment">Assignment</option>
                <option value="exam">Exam</option>
                <option value="project">Project</option>
                <option value="reading">Reading</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-black text-[#98B4A6] uppercase tracking-widest mb-2 px-1">Link to Planner</label>
              <select 
                value={formData.planner_id || ''} 
                onChange={(e) => setFormData({ ...formData, planner_id: e.target.value || null })} 
                className="w-full px-5 py-3.5 border-2 border-[#F3EFE9] rounded-2xl focus:ring-0 focus:border-[#98B4A6] text-sm bg-[#FCFAF7] font-bold text-gray-600"
              >
                <option value="">No Planner</option>
                {planners.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div className="flex space-x-4 pt-4">
              <button type="submit" className="flex-1 bg-[#98B4A6] text-white py-4 px-6 rounded-[2rem] hover:bg-[#6B8E7E] transition-all font-black text-sm shadow-lg shadow-[#98B4A6]/20">{task ? 'Save' : 'Add'} Task</button>
              <button type="button" onClick={onClose} className="flex-1 bg-[#FCFAF7] text-gray-500 py-4 px-6 rounded-[2rem] hover:bg-gray-100 transition-all font-bold text-sm border-2 border-[#F3EFE9]">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  const toggleTask = async (taskId, completed) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ completed: !completed })
        .eq('id', taskId)

      if (error) throw error

      await supabase.from('task_history').insert([{
        user_id: user.id,
        task_id: taskId,
        action: completed ? 'uncompleted' : 'completed'
      }])

      if (!completed) {
        await addXP(getXPForAction(ACTIONS.TASK_COMPLETED))
      }

      // Set undo action
      setUndoAction({ taskId, wasCompleted: completed })
      setTimeout(() => setUndoAction(prev => prev?.taskId === taskId ? null : prev), 5000)

      await fetchTasks()
      await fetchTaskHistory()
    } catch (error) {
      console.error('Error toggling task:', error)
    }
  }

  const handleUndo = async () => {
    if (!undoAction) return
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ completed: undoAction.wasCompleted })
        .eq('id', undoAction.taskId)

      if (error) throw error
      setUndoAction(null)
      await fetchTasks()
    } catch (error) {
      console.error('Error undoing:', error)
    }
  }

  const deleteTask = async (taskId) => {
    if (confirm('Are you sure you want to delete this task?')) {
      try {
        const { error } = await supabase.from('tasks').delete().eq('id', taskId)
        if (error) throw error
        await fetchTasks()
      } catch (error) {
        console.error('Error deleting task:', error)
      }
    }
  }

  const getPriorityStyle = (priority) => {
    switch (priority) {
      case 'high': return { text: 'text-[#E8B4B8]', bg: 'bg-[#F3D1D4]/30', border: 'border-l-[#E8B4B8]' }
      case 'medium': return { text: 'text-[#D4A373]', bg: 'bg-[#FFF9F2]', border: 'border-l-[#D4A373]' }
      case 'low': return { text: 'text-[#98B4A6]', bg: 'bg-[#F2F8F5]', border: 'border-l-[#98B4A6]' }
      default: return { text: 'text-gray-400', bg: 'bg-gray-50', border: 'border-l-gray-300' }
    }
  }

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'study': return '📚'
      case 'assignment': return '📝'
      case 'exam': return '📋'
      case 'project': return '🚀'
      case 'reading': return '📖'
      default: return '📌'
    }
  }

  // Stats
  const totalTasks = tasks.length
  const completedCount = tasks.filter(t => t.completed).length
  const completionPct = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header - Wholesome Style */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">To-Do List</h1>
          <p className="text-[10px] text-[#98B4A6] font-bold uppercase tracking-widest mt-1">Stay organized and track your daily productivity</p>
        </div>
        <div className="flex space-x-3">
          <button onClick={() => setShowHistory(!showHistory)} className="flex items-center space-x-2 bg-white text-gray-600 border-2 border-[#F3EFE9] px-4 py-2.5 rounded-[1.5rem] hover:bg-[#FCFAF7] transition-all font-bold text-sm">
            <History className="w-4 h-4 text-[#98B4A6]" />
            <span>Task History</span>
          </button>
          <button onClick={() => setShowAddForm(true)} className="flex items-center space-x-2 bg-[#98B4A6] text-white px-6 py-2.5 rounded-[1.5rem] hover:bg-[#6B8E7E] transition-all shadow-lg shadow-[#98B4A6]/20 font-black text-sm">
            <Plus className="w-4 h-4" />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {/* Blooming Progress Banner */}
      {totalTasks > 0 && (
        <div className="bg-white rounded-[2.5rem] border-2 border-[#F3EFE9] p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-[#F2F8F5] flex items-center justify-center border border-[#98B4A6]/20">
                <BarChart3 className="w-6 h-6 text-[#98B4A6]" />
              </div>
              <div>
                <p className="text-sm font-black text-gray-800">
                  {completedCount} of {totalTasks} Tasks
                </p>
                <p className="text-[10px] text-[#98B4A6] font-bold uppercase tracking-widest">{completionPct}% Completed</p>
              </div>
            </div>
            <span className="text-2xl font-black text-[#98B4A6]">{completionPct}%</span>
          </div>
          <div className="h-3 bg-gray-50 rounded-full overflow-hidden p-0.5 border border-[#F3EFE9]">
            <div className="h-full bg-gradient-to-r from-[#98B4A6] to-[#B8CDC1] rounded-full progress-bar-fill shadow-sm" style={{ width: `${completionPct}%` }} />
          </div>
        </div>
      )}

      {/* Undo Toast */}
      {undoAction && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center space-x-4 undo-toast">
          <span className="text-sm">Task {undoAction.wasCompleted ? 'marked incomplete' : 'completed'}</span>
          <button onClick={handleUndo} className="flex items-center space-x-1.5 bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition-colors text-sm font-medium">
            <Undo2 className="w-3.5 h-3.5" />
            <span>Undo</span>
          </button>
        </div>
      )}

      {/* Filters and Search - Softened */}
      <div className="bg-white rounded-[2rem] border-2 border-[#F3EFE9] p-5 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#98B4A6] w-4 h-4" />
            <input type="text" placeholder="Search tasks..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-11 pr-4 py-3 border-2 border-[#F3EFE9] rounded-2xl focus:ring-0 focus:border-[#98B4A6] text-sm bg-[#FCFAF7] transition-all font-medium placeholder:text-gray-300" />
          </div>

          <select value={filterBy} onChange={(e) => setFilterBy(e.target.value)} className="px-4 py-3 border-2 border-[#F3EFE9] rounded-2xl focus:ring-0 focus:border-[#98B4A6] text-sm bg-[#FCFAF7] transition-all font-bold text-gray-600">
            <option value="all">All Tasks</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="overdue">Overdue</option>
            <option value="today">Due Today</option>
            <option value="tomorrow">Due Tomorrow</option>
            <option value="thisweek">Due This Week</option>
          </select>

          <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="px-4 py-3 border-2 border-[#F3EFE9] rounded-2xl focus:ring-0 focus:border-[#98B4A6] text-sm bg-[#FCFAF7] transition-all font-bold text-gray-600" />

          <button onClick={() => { setSearchTerm(''); setFilterBy('all'); setSelectedDate('') }} className="px-4 py-3 bg-[#F3D1D4]/20 text-[#E8B4B8] rounded-2xl hover:bg-[#F3D1D4]/40 transition-all text-sm font-black uppercase tracking-widest">
            Reset Filters
          </button>
        </div>
      </div>

      {/* Task History Modal */}
      {showHistory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[70vh] overflow-y-auto shadow-2xl animate-scale-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Task History</h2>
              <button onClick={() => setShowHistory(false)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            
            <div className="space-y-2">
              {taskHistory.length > 0 ? taskHistory.map((entry) => (
                <div key={entry.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
                  <div className={`p-2 rounded-lg ${entry.action === 'completed' ? 'bg-emerald-100' : 'bg-amber-100'}`}>
                    <CheckSquare className={`w-4 h-4 ${entry.action === 'completed' ? 'text-emerald-600' : 'text-amber-600'}`} />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-sm">Task {entry.action}</p>
                    <p className="text-xs text-gray-500">
                      {format(new Date(entry.timestamp || entry.created_at), 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                </div>
              )) : (
                <p className="text-center text-gray-400 py-8 text-sm">No history yet</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tasks List */}
      <div className="space-y-3">
        {filteredTasks.length > 0 ? (
          filteredTasks.map((task) => {
            const priorityStyle = getPriorityStyle(task.priority)
            return (
              <div
                key={task.id}
                className={`bg-white rounded-[2rem] border-2 border-[#F3EFE9] p-6 card-hover border-l-8 ${priorityStyle.border} ${task.completed ? 'opacity-60 bg-[#FCFAF7]' : ''} transition-all duration-500`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-5 flex-1 min-w-0">
                    <button
                      onClick={() => toggleTask(task.id, task.completed)}
                      className={`flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${
                        task.completed 
                          ? 'bg-[#98B4A6] border-[#98B4A6] text-white shadow-lg shadow-[#98B4A6]/30' 
                          : 'bg-white border-[#F3EFE9] text-transparent hover:border-[#98B4A6] hover:bg-[#F2F8F5]'
                      }`}
                      title={task.completed ? "Mark as growing" : "Mark as bloomed"}
                    >
                      <CheckSquare className={`w-4 h-4 transition-opacity duration-500 ${task.completed ? 'opacity-100' : 'opacity-0'}`} />
                    </button>
 
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-1.5 flex-wrap gap-y-2">
                        <span className="text-xl leading-none bg-[#FCFAF7] p-2 rounded-xl border border-[#F3EFE9]">{getCategoryIcon(task.category)}</span>
                        <h3 className={`font-black text-gray-800 tracking-tight text-base ${task.completed ? 'line-through text-gray-400' : ''}`}>
                          {task.title}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${priorityStyle.bg} ${priorityStyle.text}`}>
                          {task.priority}
                        </span>
                      </div>
 
                      {task.description && (
                        <p className="text-gray-400 text-sm font-medium mb-3 pl-14">{task.description}</p>
                      )}
 
                      <div className="flex items-center space-x-6 text-[10px] font-bold uppercase tracking-widest pl-14">
                        {task.due_date && (
                          <div className={`flex items-center space-x-2 ${isToday(new Date(task.due_date)) ? 'text-[#E8B4B8]' : 'text-gray-400'}`}>
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{isToday(new Date(task.due_date)) ? 'Due Today' : format(new Date(task.due_date), 'MMM d, yyyy')}</span>
                          </div>
                        )}
                        {task.planner_id && (
                          <div className="flex items-center space-x-2 text-[#98B4A6]">
                            <BookOpen className="w-3.5 h-3.5" />
                            <span className="truncate max-w-[150px]">
                              {planners.find(p => p.id === task.planner_id)?.name || 'Nurture Sanctuary'}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center space-x-2 text-gray-300">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Created {format(new Date(task.created_at), 'MMM d')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
 
                  <div className="flex items-center space-x-2 ml-4">
                    <button onClick={() => setEditingTask(task)} className="w-10 h-10 flex items-center justify-center text-gray-300 hover:text-[#98B4A6] hover:bg-[#F2F8F5] rounded-2xl transition-all duration-300">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => deleteTask(task.id)} className="w-10 h-10 flex items-center justify-center text-gray-300 hover:text-[#E8B4B8] hover:bg-[#F3D1D4]/20 rounded-2xl transition-all duration-300">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })
        ) : (
          <div className="text-center py-20 bg-white rounded-[4rem] border-2 border-[#F3EFE9] border-dashed">
            <div className="w-24 h-24 rounded-[2rem] bg-[#F2F8F5] flex items-center justify-center mx-auto mb-6 shadow-lg shadow-[#98B4A6]/10">
              <CheckSquare className="w-10 h-10 text-[#98B4A6]" />
            </div>
            <h3 className="text-2xl font-black text-gray-800 tracking-tight mb-2">No Tasks Found</h3>
            <p className="text-[#98B4A6] font-bold uppercase tracking-widest text-[10px] mb-8">
              {searchTerm || filterBy !== 'all' || selectedDate 
                ? 'Try searching elsewhere' 
                : 'Add your first task to get started!'
              }
            </p>
            {!searchTerm && filterBy === 'all' && !selectedDate && (
              <button onClick={() => setShowAddForm(true)} className="bg-[#98B4A6] text-white px-8 py-4 rounded-[2rem] hover:bg-[#6B8E7E] transition-all font-black text-sm shadow-xl shadow-[#98B4A6]/20">
                Add Task
              </button>
            )}
          </div>
        )}
      </div>

      {(showAddForm || editingTask) && (
        <TaskForm
          task={editingTask}
          onClose={() => { setShowAddForm(false); setEditingTask(null) }}
          onSave={() => { setShowAddForm(false); setEditingTask(null) }}
        />
      )}
    </div>
  )
}

export default EnhancedTodoList
