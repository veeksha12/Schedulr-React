import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { Plus, BookOpen, Calendar, Target, Edit, Trash2, Users } from 'lucide-react'
import { format } from 'date-fns'

const PlannersManager = () => {
  const { user } = useAuth()
  const [planners, setPlanners] = useState([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingPlanner, setEditingPlanner] = useState(null)
  const [loading, setLoading] = useState(true)

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
    } catch (error) {
      console.error('Error fetching planners:', error)
    } finally {
      setLoading(false)
    }
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
          // Update existing planner
          const { error } = await supabase
            .from('planners')
            .update(formData)
            .eq('id', planner.id)
          
          if (error) throw error
        } else {
          // Create new planner
          const { error } = await supabase
            .from('planners')
            .insert([{ ...formData, user_id: user.id }])
          
          if (error) throw error
        }
        
        onSave()
        onClose()
        fetchPlanners()
      } catch (error) {
        console.error('Error saving planner:', error)
      }
    }

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-6 w-full max-w-md">
          <h2 className="text-xl font-semibold mb-6">
            {planner ? 'Edit Planner' : 'Create New Planner'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Planner Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="e.g., Fall 2024 Semester"
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
                placeholder="Brief description of this planner"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="semester">Semester</option>
                <option value="course">Course</option>
                <option value="degree">Degree Program</option>
                <option value="certification">Certification</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Grade
                </label>
                <input
                  type="text"
                  value={formData.target_grade}
                  onChange={(e) => setFormData({ ...formData, target_grade: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="e.g., A, 90%, 3.8 GPA"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Study Hours/Day
                </label>
                <input
                  type="number"
                  value={formData.study_hours_per_day}
                  onChange={(e) => setFormData({ ...formData, study_hours_per_day: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  min="1"
                  max="12"
                />
              </div>
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="submit"
                className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                {planner ? 'Update' : 'Create'} Planner
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Study Planners</h1>
          <p className="text-gray-600 mt-2">Manage your academic planning and goals</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>New Planner</span>
        </button>
      </div>

      {/* Planners Grid */}
      {planners.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {planners.map((planner) => (
            <div key={planner.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <BookOpen className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{planner.name}</h3>
                    <p className="text-sm text-gray-500 capitalize">{planner.type}</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setEditingPlanner(planner)}
                    className="p-1 text-gray-400 hover:text-indigo-600 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deletePlanner(planner.id)}
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {planner.description && (
                <p className="text-gray-600 text-sm mb-4">{planner.description}</p>
              )}

              <div className="space-y-3">
                {planner.target_grade && (
                  <div className="flex items-center space-x-2">
                    <Target className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-gray-700">Target: {planner.target_grade}</span>
                  </div>
                )}
                
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-gray-700">
                    {format(new Date(planner.start_date), 'MMM d, yyyy')}
                    {planner.end_date && ` - ${format(new Date(planner.end_date), 'MMM d, yyyy')}`}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-purple-600" />
                  <span className="text-sm text-gray-700">
                    {planner.study_hours_per_day}h/day study time
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <button className="w-full bg-indigo-50 text-indigo-600 py-2 px-4 rounded-lg hover:bg-indigo-100 transition-colors font-medium">
                  Open Planner
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No planners yet</h3>
          <p className="text-gray-600 mb-6">Create your first study planner to get started</p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Create Your First Planner
          </button>
        </div>
      )}

      {/* Create/Edit Form Modal */}
      {(showCreateForm || editingPlanner) && (
        <CreatePlannerForm
          planner={editingPlanner}
          onClose={() => {
            setShowCreateForm(false)
            setEditingPlanner(null)
          }}
          onSave={() => {
            setShowCreateForm(false)
            setEditingPlanner(null)
          }}
        />
      )}
    </div>
  )
}

export default PlannersManager