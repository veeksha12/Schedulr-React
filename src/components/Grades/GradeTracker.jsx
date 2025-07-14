import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { 
  Plus, 
  TrendingUp, 
  Award, 
  Calendar, 
  Edit, 
  Trash2,
  Target,
  BarChart3
} from 'lucide-react'
import { format } from 'date-fns'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'

const GradeTracker = () => {
  const { user } = useAuth()
  const [courses, setCourses] = useState([])
  const [exams, setExams] = useState([])
  const [showAddCourse, setShowAddCourse] = useState(false)
  const [showAddExam, setShowAddExam] = useState(false)
  const [editingCourse, setEditingCourse] = useState(null)
  const [editingExam, setEditingExam] = useState(null)
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [gradeData, setGradeData] = useState([])

  useEffect(() => {
    if (user) {
      fetchCourses()
      fetchExams()
    }
  }, [user])

  useEffect(() => {
    if (selectedCourse) {
      calculateGradeData()
    }
  }, [selectedCourse, exams])

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setCourses(data || [])
      if (data && data.length > 0 && !selectedCourse) {
        setSelectedCourse(data[0])
      }
    } catch (error) {
      console.error('Error fetching courses:', error)
    }
  }

  const fetchExams = async () => {
    try {
      const { data, error } = await supabase
        .from('exams')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: true })

      if (error) throw error
      setExams(data || [])
    } catch (error) {
      console.error('Error fetching exams:', error)
    }
  }

  const calculateGradeData = () => {
    if (!selectedCourse) return

    const courseExams = exams.filter(exam => exam.course_id === selectedCourse.id && exam.grade !== null)
    
    let runningTotal = 0
    let runningWeight = 0
    
    const data = courseExams.map((exam, index) => {
      runningTotal += (exam.grade * exam.weight) / 100
      runningWeight += exam.weight
      
      const currentGrade = runningWeight > 0 ? (runningTotal / runningWeight) * 100 : 0
      
      return {
        name: exam.name,
        grade: exam.grade,
        currentGrade: Math.round(currentGrade * 100) / 100,
        date: format(new Date(exam.date), 'MMM d')
      }
    })

    setGradeData(data)
  }

  const CourseForm = ({ course, onClose, onSave }) => {
    const [formData, setFormData] = useState({
      name: course?.name || '',
      code: course?.code || '',
      target_grade: course?.target_grade || '',
      current_grade: course?.current_grade || 0,
      credits: course?.credits || 3
    })

    const handleSubmit = async (e) => {
      e.preventDefault()
      
      try {
        if (course) {
          const { error } = await supabase
            .from('courses')
            .update(formData)
            .eq('id', course.id)
          
          if (error) throw error
        } else {
          const { error } = await supabase
            .from('courses')
            .insert([{ ...formData, user_id: user.id }])
          
          if (error) throw error
        }
        
        onSave()
        onClose()
        fetchCourses()
      } catch (error) {
        console.error('Error saving course:', error)
      }
    }

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-6 w-full max-w-md">
          <h2 className="text-xl font-semibold mb-6">
            {course ? 'Edit Course' : 'Add New Course'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Course Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="e.g., Calculus I"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Course Code
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="e.g., MATH 101"
              />
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
                  placeholder="e.g., A, 90%"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Credits
                </label>
                <input
                  type="number"
                  value={formData.credits}
                  onChange={(e) => setFormData({ ...formData, credits: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  min="1"
                  max="6"
                />
              </div>
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="submit"
                className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                {course ? 'Update' : 'Add'} Course
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

  const ExamForm = ({ exam, onClose, onSave }) => {
    const [formData, setFormData] = useState({
      name: exam?.name || '',
      course_id: exam?.course_id || selectedCourse?.id || '',
      date: exam?.date || '',
      weight: exam?.weight || 20,
      grade: exam?.grade || '',
      max_grade: exam?.max_grade || 100
    })

    const handleSubmit = async (e) => {
      e.preventDefault()
      
      try {
        const examData = {
          ...formData,
          grade: formData.grade ? parseFloat(formData.grade) : null
        }

        if (exam) {
          const { error } = await supabase
            .from('exams')
            .update(examData)
            .eq('id', exam.id)
          
          if (error) throw error
        } else {
          const { error } = await supabase
            .from('exams')
            .insert([{ ...examData, user_id: user.id }])
          
          if (error) throw error
        }
        
        onSave()
        onClose()
        fetchExams()
      } catch (error) {
        console.error('Error saving exam:', error)
      }
    }

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-6 w-full max-w-md">
          <h2 className="text-xl font-semibold mb-6">
            {exam ? 'Edit Exam' : 'Add New Exam'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Exam Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="e.g., Midterm Exam"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Course
              </label>
              <select
                value={formData.course_id}
                onChange={(e) => setFormData({ ...formData, course_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              >
                <option value="">Select a course</option>
                {courses.map(course => (
                  <option key={course.id} value={course.id}>
                    {course.name} ({course.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Weight (%)
                </label>
                <input
                  type="number"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  min="1"
                  max="100"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Grade Received
                </label>
                <input
                  type="number"
                  value={formData.grade}
                  onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  min="0"
                  max={formData.max_grade}
                  step="0.1"
                  placeholder="Leave empty if not graded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Grade
                </label>
                <input
                  type="number"
                  value={formData.max_grade}
                  onChange={(e) => setFormData({ ...formData, max_grade: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  min="1"
                  required
                />
              </div>
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="submit"
                className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                {exam ? 'Update' : 'Add'} Exam
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

  const deleteCourse = async (courseId) => {
    if (confirm('Are you sure you want to delete this course? This will also delete all associated exams.')) {
      try {
        const { error } = await supabase
          .from('courses')
          .delete()
          .eq('id', courseId)
        
        if (error) throw error
        fetchCourses()
        if (selectedCourse?.id === courseId) {
          setSelectedCourse(null)
        }
      } catch (error) {
        console.error('Error deleting course:', error)
      }
    }
  }

  const deleteExam = async (examId) => {
    if (confirm('Are you sure you want to delete this exam?')) {
      try {
        const { error } = await supabase
          .from('exams')
          .delete()
          .eq('id', examId)
        
        if (error) throw error
        fetchExams()
      } catch (error) {
        console.error('Error deleting exam:', error)
      }
    }
  }

  const getCurrentGrade = (course) => {
    const courseExams = exams.filter(exam => exam.course_id === course.id && exam.grade !== null)
    
    if (courseExams.length === 0) return 0
    
    let totalWeightedGrade = 0
    let totalWeight = 0
    
    courseExams.forEach(exam => {
      totalWeightedGrade += (exam.grade / exam.max_grade) * exam.weight
      totalWeight += exam.weight
    })
    
    return totalWeight > 0 ? Math.round((totalWeightedGrade / totalWeight) * 100 * 100) / 100 : 0
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Grade Tracker</h1>
          <p className="text-gray-600 mt-2">Monitor your academic performance and progress</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowAddCourse(true)}
            className="flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Add Course</span>
          </button>
          <button
            onClick={() => setShowAddExam(true)}
            className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Add Exam</span>
          </button>
        </div>
      </div>

      {/* Course Selection */}
      {courses.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">Select Course</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {courses.map(course => (
              <button
                key={course.id}
                onClick={() => setSelectedCourse(course)}
                className={`p-4 rounded-lg border-2 transition-colors text-left ${
                  selectedCourse?.id === course.id
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-900">{course.name}</h3>
                  <div className="flex space-x-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditingCourse(course)
                      }}
                      className="p-1 text-gray-400 hover:text-indigo-600"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteCourse(course.id)
                      }}
                      className="p-1 text-gray-400 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-2">{course.code}</p>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Current: {getCurrentGrade(course)}%</span>
                  <span className="text-sm text-gray-500">Target: {course.target_grade}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Grade Chart */}
      {selectedCourse && gradeData.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">Grade Progress - {selectedCourse.name}</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={gradeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="currentGrade" 
                  stroke="#4f46e5" 
                  strokeWidth={2}
                  name="Current Grade"
                />
                <Line 
                  type="monotone" 
                  dataKey="grade" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  name="Exam Grade"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Exams List */}
      {selectedCourse && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">Exams - {selectedCourse.name}</h2>
          <div className="space-y-4">
            {exams
              .filter(exam => exam.course_id === selectedCourse.id)
              .map(exam => (
                <div key={exam.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className={`p-2 rounded-lg ${exam.grade ? 'bg-green-100' : 'bg-yellow-100'}`}>
                      <Award className={`w-5 h-5 ${exam.grade ? 'text-green-600' : 'text-yellow-600'}`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{exam.name}</h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>{format(new Date(exam.date), 'MMM d, yyyy')}</span>
                        </span>
                        <span>Weight: {exam.weight}%</span>
                        {exam.grade && (
                          <span className="font-medium text-green-600">
                            Grade: {exam.grade}/{exam.max_grade} ({Math.round((exam.grade / exam.max_grade) * 100)}%)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setEditingExam(exam)}
                      className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteExam(exam.id)}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Empty States */}
      {courses.length === 0 && (
        <div className="text-center py-12">
          <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No courses yet</h3>
          <p className="text-gray-600 mb-6">Add your first course to start tracking grades</p>
          <button
            onClick={() => setShowAddCourse(true)}
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Add Your First Course
          </button>
        </div>
      )}

      {/* Forms */}
      {(showAddCourse || editingCourse) && (
        <CourseForm
          course={editingCourse}
          onClose={() => {
            setShowAddCourse(false)
            setEditingCourse(null)
          }}
          onSave={() => {
            setShowAddCourse(false)
            setEditingCourse(null)
          }}
        />
      )}

      {(showAddExam || editingExam) && (
        <ExamForm
          exam={editingExam}
          onClose={() => {
            setShowAddExam(false)
            setEditingExam(null)
          }}
          onSave={() => {
            setShowAddExam(false)
            setEditingExam(null)
          }}
        />
      )}
    </div>
  )
}

export default GradeTracker