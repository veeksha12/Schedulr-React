import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { Calendar, Clock, BookOpen, Plus, Edit, Trash2, X, ChevronLeft, ChevronRight, Timer } from 'lucide-react'
import { format, startOfWeek, addDays, isSameDay, parseISO } from 'date-fns'

const StudySchedule = () => {
  const { user } = useAuth()
  const [scheduleItems, setScheduleItems] = useState([])
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [selectedDate, setSelectedDate] = useState(null)

  useEffect(() => {
    if (user) fetchScheduleItems()
  }, [user, currentWeek])

  const fetchScheduleItems = async () => {
    try {
      const weekStart = startOfWeek(currentWeek, { weekStartsOn: 0 })
      const weekEnd = addDays(weekStart, 6)
      const { data, error } = await supabase.from('schedule_items').select('*')
        .eq('user_id', user.id)
        .gte('date', format(weekStart, 'yyyy-MM-dd'))
        .lte('date', format(weekEnd, 'yyyy-MM-dd'))
        .order('start_time', { ascending: true })
      if (error) throw error
      setScheduleItems(data || [])
    } catch (error) { console.error('Error fetching schedule items:', error) }
  }

  // Calculate weekly stats
  const getWeeklyStudyHours = () => {
    let totalMinutes = 0
    scheduleItems.forEach(item => {
      if (item.type === 'study' || item.type === 'class') {
        const [sh, sm] = item.start_time.split(':').map(Number)
        const [eh, em] = item.end_time.split(':').map(Number)
        totalMinutes += (eh * 60 + em) - (sh * 60 + sm)
      }
    })
    return { hours: Math.floor(totalMinutes / 60), minutes: totalMinutes % 60 }
  }

  const ScheduleForm = ({ item, onClose, onSave }) => {
    const [formData, setFormData] = useState({
      title: item?.title || '', description: item?.description || '',
      date: item?.date || (selectedDate ? format(selectedDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')),
      start_time: item?.start_time || '09:00', end_time: item?.end_time || '10:00',
      type: item?.type || 'study', subject: item?.subject || '', priority: item?.priority || 'medium'
    })

    const handleSubmit = async (e) => {
      e.preventDefault()
      try {
        if (item) { await supabase.from('schedule_items').update(formData).eq('id', item.id) }
        else { await supabase.from('schedule_items').insert([{ ...formData, user_id: user.id }]) }
        onSave(); onClose(); fetchScheduleItems()
      } catch (error) { console.error('Error:', error) }
    }

    return (
      <div className="fixed inset-0 bg-white/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4">
        <div className="bg-white rounded-[3rem] p-8 w-full max-w-md shadow-2xl border-4 border-[#F3EFE9] animate-scale-in">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-black text-gray-800 tracking-tight">{item ? 'Edit Event' : 'Add Event'}</h2>
            <button onClick={onClose} className="w-10 h-10 flex items-center justify-center bg-[#FCFAF7] hover:bg-gray-100 rounded-2xl transition-colors">
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[10px] font-black text-[#98B4A6] uppercase tracking-widest mb-2 px-1">Title</label>
              <input type="text" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="w-full px-5 py-3.5 border-2 border-[#F3EFE9] rounded-2xl focus:ring-0 focus:border-[#98B4A6] text-sm bg-[#FCFAF7] font-bold placeholder:text-gray-300 transition-all" placeholder="e.g., Math Study" required />
            </div>
            <div>
              <label className="block text-[10px] font-black text-[#98B4A6] uppercase tracking-widest mb-2 px-1">Description</label>
              <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full px-5 py-3.5 border-2 border-[#F3EFE9] rounded-2xl focus:ring-0 focus:border-[#98B4A6] text-sm bg-[#FCFAF7] font-bold placeholder:text-gray-300 transition-all" rows="2" placeholder="Details" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-[#98B4A6] uppercase tracking-widest mb-2 px-1">Date</label>
              <input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className="w-full px-4 py-3 border-2 border-[#F3EFE9] rounded-2xl focus:ring-0 focus:border-[#98B4A6] text-sm bg-[#FCFAF7] font-bold text-gray-600" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-[#98B4A6] uppercase tracking-widest mb-2 px-1">Start</label>
                <input type="time" value={formData.start_time} onChange={(e) => setFormData({...formData, start_time: e.target.value})} className="w-full px-4 py-3 border-2 border-[#F3EFE9] rounded-2xl focus:ring-0 focus:border-[#98B4A6] text-sm bg-[#FCFAF7] font-bold text-gray-600" required />
              </div>
              <div>
                <label className="block text-[10px] font-black text-[#98B4A6] uppercase tracking-widest mb-2 px-1">End</label>
                <input type="time" value={formData.end_time} onChange={(e) => setFormData({...formData, end_time: e.target.value})} className="w-full px-4 py-3 border-2 border-[#F3EFE9] rounded-2xl focus:ring-0 focus:border-[#98B4A6] text-sm bg-[#FCFAF7] font-bold text-gray-600" required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-[#98B4A6] uppercase tracking-widest mb-2 px-1">Type</label>
                <select value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})} className="w-full px-5 py-3.5 border-2 border-[#F3EFE9] rounded-2xl focus:ring-0 focus:border-[#98B4A6] text-sm bg-[#FCFAF7] font-bold text-gray-600 transition-all">
                  <option value="study">Study</option><option value="exam">Exam</option><option value="assignment">Assignment</option>
                  <option value="class">Class</option><option value="break">Break</option><option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-[#98B4A6] uppercase tracking-widest mb-2 px-1">Priority</label>
                <select value={formData.priority} onChange={(e) => setFormData({...formData, priority: e.target.value})} className="w-full px-5 py-3.5 border-2 border-[#F3EFE9] rounded-2xl focus:ring-0 focus:border-[#98B4A6] text-sm bg-[#FCFAF7] font-bold text-gray-600 transition-all">
                  <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black text-[#98B4A6] uppercase tracking-widest mb-2 px-1">Subject</label>
              <input type="text" value={formData.subject} onChange={(e) => setFormData({...formData, subject: e.target.value})} className="w-full px-5 py-3.5 border-2 border-[#F3EFE9] rounded-2xl focus:ring-0 focus:border-[#98B4A6] text-sm bg-[#FCFAF7] font-bold placeholder:text-gray-300 transition-all" placeholder="e.g., Mathematics" />
            </div>
            <div className="flex space-x-4 pt-4">
              <button type="submit" className="flex-1 bg-[#98B4A6] text-white py-4 px-6 rounded-[2rem] hover:bg-[#6B8E7E] transition-all font-black text-sm shadow-lg shadow-[#98B4A6]/20">{item ? 'Update' : 'Add'} Event</button>
              <button type="button" onClick={onClose} className="flex-1 bg-[#FCFAF7] text-gray-500 py-4 px-6 rounded-[2rem] hover:bg-gray-100 transition-all font-bold text-sm border-2 border-[#F3EFE9]">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  const deleteScheduleItem = async (itemId) => {
    if (confirm('Delete this schedule item?')) {
      try { await supabase.from('schedule_items').delete().eq('id', itemId); fetchScheduleItems() }
      catch (error) { console.error('Error:', error) }
    }
  }

  const getTypeColor = (type) => {
    switch (type) {
      case 'study': return 'bg-[#F2F8F5] text-[#98B4A6] border-[#98B4A6]/20'
      case 'exam': return 'bg-[#FDF2F2] text-[#E8B4B8] border-[#E8B4B8]/20'
      case 'assignment': return 'bg-[#FFF9F2] text-[#D4A373] border-[#D4A373]/20'
      case 'class': return 'bg-[#F0F7FF] text-[#A7C7E7] border-[#A7C7E7]/20'
      case 'break': return 'bg-[#F8F7FF] text-[#C4A1FF] border-[#C4A1FF]/20'
      default: return 'bg-[#FCFAF7] text-gray-400 border-[#F3EFE9]'
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'border-l-[#E8B4B8]'
      case 'medium': return 'border-l-[#D4A373]'
      case 'low': return 'border-l-[#98B4A6]'
      default: return 'border-l-gray-300'
    }
  }

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 0 })
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const getItemsForDay = (date) => {
    return scheduleItems.filter(item => isSameDay(parseISO(item.date), date))
      .sort((a, b) => a.start_time.localeCompare(b.start_time))
  }

  const weeklyStats = getWeeklyStudyHours()

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Study Schedule</h1>
          <p className="text-[10px] text-[#98B4A6] font-bold uppercase tracking-widest mt-1">Plan and organize your study sessions</p>
        </div>
        <button onClick={() => setShowAddForm(true)} className="flex items-center space-x-2 bg-[#98B4A6] text-white px-7 py-3 rounded-[1.5rem] hover:bg-[#6B8E7E] transition-all shadow-lg shadow-[#98B4A6]/20 font-black text-sm">
          <Plus className="w-5 h-5" /><span>Add Event</span>
        </button>
      </div>

      {/* Weekly Stats */}
      <div className="bg-white rounded-[2.5rem] border-2 border-[#F3EFE9] p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center space-x-4">
            <button onClick={() => setCurrentWeek(addDays(currentWeek, -7))} className="w-10 h-10 flex items-center justify-center bg-[#FCFAF7] rounded-xl hover:bg-gray-100 transition-colors border border-[#F3EFE9]">
              <ChevronLeft className="w-5 h-5 text-gray-500" />
            </button>
            <h2 className="text-sm font-black text-gray-800 uppercase tracking-widest leading-none pt-1">
              {format(weekStart, 'MMM d')} <span className="mx-2 text-gray-300">—</span> {format(addDays(weekStart, 6), 'MMM d, yyyy')}
            </h2>
            <button onClick={() => setCurrentWeek(addDays(currentWeek, 7))} className="w-10 h-10 flex items-center justify-center bg-[#FCFAF7] rounded-xl hover:bg-gray-100 transition-colors border border-[#F3EFE9]">
              <ChevronRight className="w-5 h-5 text-gray-500" />
            </button>
            <button onClick={() => setCurrentWeek(new Date())} className="px-5 py-2.5 bg-[#F2F8F5] text-[#98B4A6] rounded-xl hover:bg-[#E8F3ED] transition-all text-[10px] font-black uppercase tracking-widest border border-[#98B4A6]/20">
              Today
            </button>
          </div>
          <div className="flex items-center space-x-3 bg-[#F2F8F5] px-6 py-3 rounded-[1.5rem] border border-[#98B4A6]/20">
            <Timer className="w-4 h-4 text-[#98B4A6]" />
            <span className="text-[10px] font-black text-[#98B4A6] uppercase tracking-widest">
              {weeklyStats.hours}h {weeklyStats.minutes}m this week
            </span>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-[3rem] border-2 border-[#F3EFE9] p-8 shadow-sm overflow-x-auto">
        <div className="grid grid-cols-7 gap-4 min-w-[800px]">
          {weekDays.map((day, index) => {
            const dayItems = getItemsForDay(day)
            const isToday = isSameDay(day, new Date())
            const isSelected = isSameDay(day, selectedDate || (new Date()))
            
            return (
              <div key={index} className="min-h-[22rem]">
                <div className={`p-4 rounded-[1.5rem] border-2 h-full transition-all ${isToday ? 'border-[#98B4A6]/30 bg-[#F2F8F5]/30' : isSelected ? 'border-[#98B4A6] bg-white' : 'border-[#F3EFE9] bg-[#FCFAF7]/30'} ${isSelected ? 'shadow-lg shadow-[#98B4A6]/10' : ''}`}>
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h3 className={`text-[10px] font-black uppercase tracking-widest ${isSelected ? 'text-[#98B4A6]' : 'text-gray-400'}`}>{format(day, 'EEE')}</h3>
                      <p className={`text-xl font-black tracking-tight ${isSelected ? 'text-gray-800' : isToday ? 'text-[#98B4A6]' : 'text-gray-300'}`}>{format(day, 'd')}</p>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); setSelectedDate(day); setShowAddForm(true) }} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-[#98B4A6] hover:bg-white rounded-xl transition-all border border-transparent hover:border-[#F3EFE9]">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-2 cursor-pointer" onClick={() => setSelectedDate(day)}>
                    {dayItems.map((item) => (
                      <div key={item.id} className={`p-2.5 rounded-xl border-l-[4px] ${getPriorityColor(item.priority)} ${getTypeColor(item.type)} hover:shadow-md transition-all`}>
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="font-bold text-[10px] leading-tight truncate flex-1 pr-1">{item.title}</h4>
                          <div className="flex space-x-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={(e) => { e.stopPropagation(); setEditingItem(item) }} className="text-gray-400 hover:text-[#98B4A6]"><Edit className="w-2.5 h-2.5" /></button>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1 text-[8px] font-black uppercase tracking-wider opacity-60">
                          <Clock className="w-2.5 h-2.5" />
                          <span>{item.start_time}</span>
                        </div>
                      </div>
                    ))}
                    {dayItems.length === 0 && (
                      <div className="text-center py-10 opacity-20">
                        <div className="w-1 h-1 rounded-full bg-gray-400 mx-auto" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Daily Schedule */}
      <div className="bg-white rounded-[3rem] border-2 border-[#F3EFE9] p-8 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl font-black text-gray-800 tracking-tight">Schedule for {format(selectedDate || new Date(), 'MMMM d, yyyy')}</h2>
            <p className="text-[10px] text-[#98B4A6] font-bold uppercase tracking-widest mt-1">Detailed daily view</p>
          </div>
          {isSameDay(selectedDate || new Date(), new Date()) && (
            <span className="px-4 py-1.5 bg-[#F2F8F5] text-[#98B4A6] text-[10px] font-black rounded-[0.5rem] uppercase border border-[#98B4A6]/20">Today</span>
          )}
        </div>
        <div className="space-y-4">
          {getItemsForDay(selectedDate || new Date()).length > 0 ? (
            getItemsForDay(selectedDate || new Date()).map((item) => (
              <div key={item.id} className={`p-6 rounded-[2rem] border-l-[6px] ${getPriorityColor(item.priority)} ${getTypeColor(item.type)} transition-all hover:scale-[1.01]`}>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-black text-gray-800 text-base">{item.title}</h3>
                    {item.description && <p className="text-gray-600 text-sm mt-2 font-medium leading-relaxed">{item.description}</p>}
                    <div className="flex flex-wrap items-center gap-4 mt-4 text-[10px] font-black text-[#98B4A6] uppercase tracking-widest">
                      <span className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-lg border border-[#F3EFE9]">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{item.start_time} – {item.end_time}</span>
                      </span>
                      {item.subject && (
                        <span className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-lg border border-[#F3EFE9]">
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>{item.subject}</span>
                        </span>
                      )}
                      <span className="px-3 py-1.5 bg-white rounded-lg border border-[#F3EFE9]">{item.type}</span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button onClick={() => setEditingItem(item)} className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-[#98B4A6] hover:bg-white rounded-xl transition-all"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => deleteScheduleItem(item.id)} className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-[#E8B4B8] hover:bg-white rounded-xl transition-all"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-16 bg-[#FCFAF7] rounded-[2rem] border-2 border-[#F3EFE9] border-dashed">
              <Calendar className="w-12 h-12 text-[#98B4A6]/20 mx-auto mb-4" />
              <p className="text-[10px] text-[#98B4A6] font-black uppercase tracking-widest opacity-60">No schedule items for this day</p>
            </div>
          )}
        </div>
      </div>

      {(showAddForm || editingItem) && (
        <ScheduleForm item={editingItem}
          onClose={() => { setShowAddForm(false); setEditingItem(null); setSelectedDate(null) }}
          onSave={() => { setShowAddForm(false); setEditingItem(null); setSelectedDate(null) }}
        />
      )}
    </div>
  )
}

export default StudySchedule