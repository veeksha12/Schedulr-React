import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { Calendar, Clock, BookOpen, Plus, Edit, Trash2 } from 'lucide-react'
import { format, startOfWeek, addDays, isSameDay, parseISO } from 'date-fns'

const StudySchedule = () => {
  const { user } = useAuth()
  const [scheduleItems, setScheduleItems] = useState([])
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [selectedDate, setSelectedDate] = useState(null)

  useEffect(() => {
    if (user) {
      fetchScheduleItems()
    }
  }, [user, currentWeek])

  const fetchScheduleItems = async () => {
    try {
      const weekStart = startOfWeek(currentWeek)
      const weekEnd = addDays(weekStart, 6)

      const { data, error } = await supabase
        .from('schedule_items')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', format(weekStart, 'yyyy-MM-dd'))
        .lte('date', format(weekEnd, 'yyyy-MM-dd'))
        .order('start_time', { ascending: true })

      if (error) throw error
      setScheduleItems(data || [])
    } catch (error) {
      console.error('Error fetching schedule items:', error)
    }
  }

  const ScheduleForm = ({ item, onClose, onSave }) => {
    const [formData, setFormData] = useState({
      title: item?.title || '',
      description: item?.description || '',
      date: item?.date || (selectedDate ? format(selectedDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')),
      start_time: item?.start_time || '09:00',
      end_time: item?.end_time || '10:00',
      type: item?.type || 'study',
      subject: item?.subject || '',
      priority: item?.priority || 'medium'
    })

    const handleSubmit = async (e) => {
      e.preventDefault()
      
      try {
        if (item) {
          const { error } = await supabase
            .from('schedule_items')
            .update(formData)
            .eq('id', item.id)
          
          if (error) throw error
        } else {
          const { error } = await supabase
            .from('schedule_items')
            .insert([{ ...formData, user_id: user.id }])
          
          if (error) throw error
        }
        
        onSave()
        onClose()
        fetchScheduleItems()
      } catch (error) {
        console.error('Error saving schedule item:', error)
      }
    }

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-6 w-full max-w-md">
          <h2 className="text-xl font-semibold mb-6">
            {item ? 'Edit Schedule Item' : 'Add Schedule Item'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="e.g., Math Study Session"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                rows="3"
                placeholder="Study session details"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Time
                </label>
                <input
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Time
                </label>
                <input
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="study">Study Session</option>
                  <option value="exam">Exam</option>
                  <option value="assignment">Assignment</option>
                  <option value="class">Class</option>
                  <option value="break">Break</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject
              </label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="e.g., Mathematics, Physics"
              />
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="submit"
                className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                {item ? 'Update' : 'Add'} Item
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  const deleteScheduleItem = async (itemId) => {
    if (confirm('Are you sure you want to delete this schedule item?')) {
      try {
        const { error } = await supabase
          .from('schedule_items')
          .delete()
          .eq('id', itemId)
        
        if (error) throw error
        fetchScheduleItems()
      } catch (error) {
        console.error('Error deleting schedule item:', error)
      }
    }
  }

  const getTypeColor = (type) => {
    switch (type) {
      case 'study': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'exam': return 'bg-red-100 text-red-800 border-red-200'
      case 'assignment': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'class': return 'bg-green-100 text-green-800 border-green-200'
      case 'break': return 'bg-purple-100 text-purple-800 border-purple-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'border-l-red-500'
      case 'medium': return 'border-l-yellow-500'
      case 'low': return 'border-l-green-500'
      default: return 'border-l-gray-500'
    }
  }

  const weekStart = startOfWeek(currentWeek)
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const getItemsForDay = (date) => {
    return scheduleItems.filter(item => 
      isSameDay(parseISO(item.date), date)
    ).sort((a, b) => a.start_time.localeCompare(b.start_time))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Study Schedule</h1>
          <p className="text-gray-600 mt-2">Plan and organize your study sessions</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Add Schedule Item</span>
        </button>
      </div>

      {/* Week Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">
            Week of {format(weekStart, 'MMMM d, yyyy')}
          </h2>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentWeek(addDays(currentWeek, -7))}
              className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentWeek(new Date())}
              className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 transition-colors"
            >
              Today
            </button>
            <button
              onClick={() => setCurrentWeek(addDays(currentWeek, 7))}
              className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
            >
              Next
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-4">
          {weekDays.map((day, index) => {
            const dayItems = getItemsForDay(day)
            const isToday = isSameDay(day, new Date())
            
            return (
              <div key={index} className="min-h-96">
                <div className={`p-3 rounded-lg border-2 ${
                  isToday ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 bg-white'
                }`}>
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {format(day, 'EEE')}
                      </h3>
                      <p className={`text-sm ${isToday ? 'text-indigo-600' : 'text-gray-600'}`}>
                        {format(day, 'd')}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedDate(day)
                        setShowAddForm(true)
                      }}
                      className="p-1 text-gray-400 hover:text-indigo-600 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-2">
                    {dayItems.map((item) => (
                      <div
                        key={item.id}
                        className={`p-2 rounded border-l-4 ${getPriorityColor(item.priority)} ${getTypeColor(item.type)} cursor-pointer hover:shadow-sm transition-shadow`}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="font-medium text-sm truncate">{item.title}</h4>
                          <div className="flex space-x-1 ml-2">
                            <button
                              onClick={() => setEditingItem(item)}
                              className="p-1 text-gray-400 hover:text-indigo-600 transition-colors"
                            >
                              <Edit className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => deleteScheduleItem(item.id)}
                              className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1 text-xs">
                          <Clock className="w-3 h-3" />
                          <span>{item.start_time} - {item.end_time}</span>
                        </div>
                        {item.subject && (
                          <div className="flex items-center space-x-1 text-xs mt-1">
                            <BookOpen className="w-3 h-3" />
                            <span className="truncate">{item.subject}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Today's Schedule */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-4">Today's Schedule</h2>
        <div className="space-y-3">
          {getItemsForDay(new Date()).length > 0 ? (
            getItemsForDay(new Date()).map((item) => (
              <div key={item.id} className={`p-4 rounded-lg border-l-4 ${getPriorityColor(item.priority)} ${getTypeColor(item.type)}`}>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{item.title}</h3>
                    {item.description && (
                      <p className="text-gray-600 text-sm mt-1">{item.description}</p>
                    )}
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                      <span className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>{item.start_time} - {item.end_time}</span>
                      </span>
                      {item.subject && (
                        <span className="flex items-center space-x-1">
                          <BookOpen className="w-4 h-4" />
                          <span>{item.subject}</span>
                        </span>
                      )}
                      <span className="capitalize">{item.type}</span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setEditingItem(item)}
                      className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteScheduleItem(item.id)}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No schedule items for today</p>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Form */}
      {(showAddForm || editingItem) && (
        <ScheduleForm
          item={editingItem}
          onClose={() => {
            setShowAddForm(false)
            setEditingItem(null)
            setSelectedDate(null)
          }}
          onSave={() => {
            setShowAddForm(false)
            setEditingItem(null)
            setSelectedDate(null)
          }}
        />
      )}
    </div>
  )
}

export default StudySchedule