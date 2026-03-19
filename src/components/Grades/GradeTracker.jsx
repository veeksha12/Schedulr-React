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
  BarChart3,
  TrendingDown,
  Sparkles,
  X,
  Loader2
} from 'lucide-react'
import { format } from 'date-fns'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { fetchGemini } from '../../lib/ai-retry'
import { ACTIONS, getXPForAction } from '../../lib/gamification'

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash-lite:generateContent'

const GradeTracker = () => {
  const { user, addXP } = useAuth()
  const [courses, setCourses] = useState([])
  const [exams, setExams] = useState([])
  const [showAddCourse, setShowAddCourse] = useState(false)
  const [showAddExam, setShowAddExam] = useState(false)
  const [editingCourse, setEditingCourse] = useState(null)
  const [editingExam, setEditingExam] = useState(null)
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [gradeData, setGradeData] = useState([])
  const [difficultyAssessment, setDifficultyAssessment] = useState(null)
  const [assessingDifficulty, setAssessingDifficulty] = useState(false)
  const [allCoursesChart, setAllCoursesChart] = useState([])

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
    buildAllCoursesChart()
  }, [selectedCourse, exams, courses])

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase.from('courses').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
      if (error) throw error
      setCourses(data || [])
      if (data && data.length > 0 && !selectedCourse) setSelectedCourse(data[0])
    } catch (error) {
      console.error('Error fetching courses:', error)
    }
  }

  const fetchExams = async () => {
    try {
      const { data, error } = await supabase.from('exams').select('*').eq('user_id', user.id).order('date', { ascending: true })
      if (error) throw error
      setExams(data || [])
    } catch (error) {
      console.error('Error fetching exams:', error)
    }
  }

  const calculateGradeData = () => {
    if (!selectedCourse) return
    const courseExams = exams.filter(exam => exam.course_id === selectedCourse.id && exam.grade !== null)
    let runningTotal = 0, runningWeight = 0
    const data = courseExams.map((exam) => {
      runningTotal += (exam.grade * exam.weight) / 100
      runningWeight += exam.weight
      const currentGrade = runningWeight > 0 ? (runningTotal / runningWeight) * 100 : 0
      return { name: exam.name, grade: exam.grade, currentGrade: Math.round(currentGrade * 100) / 100, date: format(new Date(exam.date), 'MMM d') }
    })
    setGradeData(data)
  }

  const buildAllCoursesChart = () => {
    const chartData = courses.map(course => {
      const current = getCurrentGrade(course)
      const targetNum = parseInt(course.target_grade) || 0
      return { name: course.name.length > 12 ? course.name.substring(0, 12) + '…' : course.name, current, target: targetNum }
    }).filter(d => d.current > 0 || d.target > 0)
    setAllCoursesChart(chartData)
  }

  const getCurrentGrade = (course) => {
    const courseExams = exams.filter(exam => exam.course_id === course.id && exam.grade !== null)
    if (courseExams.length === 0) return 0
    let totalWeightedGrade = 0, totalWeight = 0
    courseExams.forEach(exam => {
      totalWeightedGrade += (exam.grade / exam.max_grade) * exam.weight
      totalWeight += exam.weight
    })
    return totalWeight > 0 ? Math.round((totalWeightedGrade / totalWeight) * 100 * 100) / 100 : 0
  }

  const getGradeLetter = (pct) => {
    if (pct >= 90) return { letter: 'A', color: 'text-emerald-600 bg-emerald-50' }
    if (pct >= 80) return { letter: 'B', color: 'text-blue-600 bg-blue-50' }
    if (pct >= 70) return { letter: 'C', color: 'text-amber-600 bg-amber-50' }
    if (pct >= 60) return { letter: 'D', color: 'text-orange-600 bg-orange-50' }
    return { letter: 'F', color: 'text-red-600 bg-red-50' }
  }

  const assessDifficulty = async () => {
    if (!GEMINI_API_KEY || !selectedCourse) return
    setAssessingDifficulty(true)
    setDifficultyAssessment(null)

    const courseExams = exams.filter(e => e.course_id === selectedCourse.id)
    const gradeInfo = courseExams.map(e => `${e.name}: ${e.grade !== null ? `${e.grade}/${e.max_grade} (${e.weight}% weight)` : 'not graded yet'}`).join(', ')

    const prompt = `You are an academic advisor. A student is taking "${selectedCourse.name}" (${selectedCourse.code || 'no code'}). Target grade: ${selectedCourse.target_grade || 'not set'}. Current grade: ${getCurrentGrade(selectedCourse)}%. Exams: ${gradeInfo || 'none yet'}.

Based on this data, provide a brief difficulty assessment in 2-3 sentences. Rate difficulty as Easy/Moderate/Challenging/Very Challenging. Include one actionable tip. Be encouraging. Keep under 80 words.`

    try {
      const data = await fetchGemini(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      })
      
      setDifficultyAssessment(data.candidates?.[0]?.content?.parts?.[0]?.text || 'Unable to assess.')
    } catch (error) {
      console.error('Error assessing difficulty:', error)
      if (error.message.includes('429') || error.message.includes('rate limit')) {
        setDifficultyAssessment('Rate limit exceeded. Please wait a minute and try again.')
      } else {
        setDifficultyAssessment('Unable to generate assessment. Please check your API key or try again later.')
      }
    } finally {
      setAssessingDifficulty(false)
    }
  }

  const CourseForm = ({ course, onClose, onSave }) => {
    const [formData, setFormData] = useState({
      name: course?.name || '', code: course?.code || '', target_grade: course?.target_grade || '',
      current_grade: course?.current_grade || 0, credits: course?.credits || 3
    })

    const handleSubmit = async (e) => {
      e.preventDefault()
      try {
        if (course) { await supabase.from('courses').update(formData).eq('id', course.id) }
        else { await supabase.from('courses').insert([{ ...formData, user_id: user.id }]) }
        onSave(); onClose(); fetchCourses()
      } catch (error) { console.error('Error saving course:', error) }
    }
    return (
      <div className="fixed inset-0 bg-white/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4">
        <div className="bg-white rounded-[3rem] p-8 w-full max-w-md shadow-2xl border-4 border-[#F3EFE9] animate-scale-in">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-black text-gray-800 tracking-tight">{course ? 'Edit Course' : 'New Course'}</h2>
            <button onClick={onClose} className="w-10 h-10 flex items-center justify-center bg-[#FCFAF7] hover:bg-gray-100 rounded-2xl transition-colors">
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[10px] font-black text-[#98B4A6] uppercase tracking-widest mb-2 px-1">Course Name</label>
              <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-5 py-3.5 border-2 border-[#F3EFE9] rounded-2xl focus:ring-0 focus:border-[#98B4A6] text-sm bg-[#FCFAF7] font-bold placeholder:text-gray-300 transition-all" placeholder="e.g., Computer Science" required />
            </div>
            <div>
              <label className="block text-[10px] font-black text-[#98B4A6] uppercase tracking-widest mb-2 px-1">Course Code (Optional)</label>
              <input type="text" value={formData.code} onChange={(e) => setFormData({...formData, code: e.target.value})} className="w-full px-5 py-3.5 border-2 border-[#F3EFE9] rounded-2xl focus:ring-0 focus:border-[#98B4A6] text-sm bg-[#FCFAF7] font-bold placeholder:text-gray-300 transition-all" placeholder="e.g., CS 101" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-[#98B4A6] uppercase tracking-widest mb-2 px-1">Target Grade (%)</label>
                <input type="text" value={formData.target_grade} onChange={(e) => setFormData({...formData, target_grade: e.target.value})} className="w-full px-4 py-3 border-2 border-[#F3EFE9] rounded-2xl focus:ring-0 focus:border-[#98B4A6] text-sm bg-[#FCFAF7] font-bold text-gray-600" placeholder="e.g., 90%" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-[#98B4A6] uppercase tracking-widest mb-2 px-1">Credits</label>
                <input type="number" value={formData.credits} onChange={(e) => setFormData({...formData, credits: parseInt(e.target.value)})} className="w-full px-4 py-3 border-2 border-[#F3EFE9] rounded-2xl focus:ring-0 focus:border-[#98B4A6] text-sm bg-[#FCFAF7] font-bold text-gray-600" min="1" max="6" />
              </div>
            </div>
            <div className="flex space-x-4 pt-4">
              <button type="submit" className="flex-1 bg-[#98B4A6] text-white py-4 px-6 rounded-[2rem] hover:bg-[#6B8E7E] transition-all font-black text-sm shadow-lg shadow-[#98B4A6]/20">{course ? 'Save' : 'Add'} Course</button>
              <button type="button" onClick={onClose} className="flex-1 bg-[#FCFAF7] text-gray-500 py-4 px-6 rounded-[2rem] hover:bg-gray-100 transition-all font-bold text-sm border-2 border-[#F3EFE9]">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  const ExamForm = ({ exam, onClose, onSave }) => {
    const [formData, setFormData] = useState({
      name: exam?.name || '', course_id: exam?.course_id || selectedCourse?.id || '', date: exam?.date || '',
      weight: exam?.weight || 20, grade: exam?.grade || '', max_grade: exam?.max_grade || 100
    })

    const handleSubmit = async (e) => {
      e.preventDefault()
      try {
        const examData = { ...formData, grade: formData.grade ? parseFloat(formData.grade) : null }
        if (exam) { await supabase.from('exams').update(examData).eq('id', exam.id) }
        else { 
          await supabase.from('exams').insert([{ ...examData, user_id: user.id }])
          await addXP(getXPForAction(ACTIONS.EXAM_LOGGED))
        }
        onSave(); onClose(); fetchExams()
      } catch (error) { console.error('Error saving exam:', error) }
    }
    return (
      <div className="fixed inset-0 bg-white/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4">
        <div className="bg-white rounded-[3rem] p-8 w-full max-w-md shadow-2xl border-4 border-[#F3EFE9] animate-scale-in">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-black text-gray-800 tracking-tight">{exam ? 'Edit Exam' : 'Log Exam'}</h2>
            <button onClick={onClose} className="w-10 h-10 flex items-center justify-center bg-[#FCFAF7] hover:bg-gray-100 rounded-2xl transition-colors">
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[10px] font-black text-[#98B4A6] uppercase tracking-widest mb-2 px-1">Exam Name</label>
              <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-5 py-3.5 border-2 border-[#F3EFE9] rounded-2xl focus:ring-0 focus:border-[#98B4A6] text-sm bg-[#FCFAF7] font-bold placeholder:text-gray-300 transition-all" placeholder="e.g., Midterm Exam" required />
            </div>
            <div>
              <label className="block text-[10px] font-black text-[#98B4A6] uppercase tracking-widest mb-2 px-1">Course</label>
              <select value={formData.course_id} onChange={(e) => setFormData({...formData, course_id: e.target.value})} className="w-full px-5 py-3.5 border-2 border-[#F3EFE9] rounded-2xl focus:ring-0 focus:border-[#98B4A6] text-sm bg-[#FCFAF7] font-bold text-gray-600 transition-all" required>
                <option value="">Select a course</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-[#98B4A6] uppercase tracking-widest mb-2 px-1">Exam Date</label>
                <input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className="w-full px-4 py-3 border-2 border-[#F3EFE9] rounded-2xl focus:ring-0 focus:border-[#98B4A6] text-sm bg-[#FCFAF7] font-bold text-gray-600" required />
              </div>
              <div>
                <label className="block text-[10px] font-black text-[#98B4A6] uppercase tracking-widest mb-2 px-1">Weight (%)</label>
                <input type="number" value={formData.weight} onChange={(e) => setFormData({...formData, weight: parseInt(e.target.value)})} className="w-full px-4 py-3 border-2 border-[#F3EFE9] rounded-2xl focus:ring-0 focus:border-[#98B4A6] text-sm bg-[#FCFAF7] font-bold text-gray-600" min="1" max="100" required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-[#98B4A6] uppercase tracking-widest mb-2 px-1">Grade Received</label>
                <input type="number" value={formData.grade} onChange={(e) => setFormData({...formData, grade: e.target.value})} className="w-full px-4 py-3 border-2 border-[#F3EFE9] rounded-2xl focus:ring-0 focus:border-[#98B4A6] text-sm bg-[#FCFAF7] font-bold text-gray-600" min="0" max={formData.max_grade} step="0.1" placeholder="Not yet graded" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-[#98B4A6] uppercase tracking-widest mb-2 px-1">Max Grade</label>
                <input type="number" value={formData.max_grade} onChange={(e) => setFormData({...formData, max_grade: parseInt(e.target.value)})} className="w-full px-4 py-3 border-2 border-[#F3EFE9] rounded-2xl focus:ring-0 focus:border-[#98B4A6] text-sm bg-[#FCFAF7] font-bold text-gray-600" min="1" required />
              </div>
            </div>
            <div className="flex space-x-4 pt-4">
              <button type="submit" className="flex-1 bg-[#E8B4B8] text-white py-4 px-6 rounded-[2rem] hover:bg-[#D49BA0] transition-all font-black text-sm shadow-lg shadow-[#E8B4B8]/20">{exam ? 'Save' : 'Log'} Exam</button>
              <button type="button" onClick={onClose} className="flex-1 bg-[#FCFAF7] text-gray-500 py-4 px-6 rounded-[2rem] hover:bg-gray-100 transition-all font-bold text-sm border-2 border-[#F3EFE9]">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  const deleteCourse = async (courseId) => {
    if (confirm('Delete this course and all exams?')) {
      try { await supabase.from('courses').delete().eq('id', courseId); fetchCourses(); if (selectedCourse?.id === courseId) setSelectedCourse(null) }
      catch (error) { console.error('Error:', error) }
    }
  }

  const deleteExam = async (examId) => {
    if (confirm('Delete this exam?')) {
      try { await supabase.from('exams').delete().eq('id', examId); fetchExams() }
      catch (error) { console.error('Error:', error) }
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header - Wholesome Style */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Grade Tracker</h1>
          <p className="text-[10px] text-[#98B4A6] font-bold uppercase tracking-widest mt-1">Monitor your academic progress and course goals</p>
        </div>
        <div className="flex space-x-3">
          <button onClick={() => setShowAddCourse(true)} className="flex items-center space-x-2 bg-white text-gray-600 border-2 border-[#F3EFE9] px-4 py-2.5 rounded-[1.5rem] hover:bg-[#FCFAF7] transition-all font-bold text-sm">
            <Plus className="w-4 h-4 text-[#98B4A6]" /><span>New Course</span>
          </button>
          <button onClick={() => setShowAddExam(true)} className="flex items-center space-x-2 bg-[#E8B4B8] text-white px-5 py-2.5 rounded-[1.5rem] hover:bg-[#D49BA0] transition-all shadow-lg shadow-[#E8B4B8]/20 font-black text-sm">
            <Plus className="w-4 h-4" /><span>Log Exam</span>
          </button>
        </div>
      </div>

      {/* All Courses Bar Chart - Wholesome Colors */}
      {allCoursesChart.length > 0 && (
        <div className="bg-white rounded-[3rem] border-2 border-[#F3EFE9] p-8 shadow-sm">
          <h2 className="text-lg font-black text-gray-800 tracking-tight mb-8">Course Overview</h2>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={allCoursesChart} barGap={6}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3EFE9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 700, fill: '#98B4A6' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fontWeight: 700, fill: '#98B4A6' }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: '#FCFAF7' }} contentStyle={{ borderRadius: '1.5rem', border: '2px solid #F3EFE9', boxShadow: 'none' }} />
                <Bar dataKey="current" fill="#98B4A6" radius={[8, 8, 8, 8]} name="Current" barSize={24} />
                <Bar dataKey="target" fill="#E8B4B8" radius={[8, 8, 8, 8]} name="Target" barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Course Selection - Cozy Cards */}
      {courses.length > 0 && (
        <div className="bg-white rounded-[3rem] border-2 border-[#F3EFE9] p-8 shadow-sm">
          <h2 className="text-lg font-black text-gray-800 tracking-tight mb-8">Select Course</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {courses.map(course => {
              const grade = getCurrentGrade(course)
              const gradeLetter = getGradeLetter(grade)
              const isActive = selectedCourse?.id === course.id
              return (
                <div 
                  key={course.id} 
                  onClick={() => { setSelectedCourse(course); setDifficultyAssessment(null) }}
                  className={`p-6 rounded-[2rem] border-2 transition-all duration-500 text-left cursor-pointer card-hover relative overflow-hidden group ${isActive ? 'border-[#98B4A6] bg-[#F2F8F5]' : 'border-[#F3EFE9] bg-white'}`}
                >
                  <div className="flex justify-between items-start mb-4 relative z-10">
                    <div>
                      <h3 className="font-black text-gray-800 tracking-tight text-base group-hover:text-[#98B4A6] transition-colors">{course.name}</h3>
                      <p className="text-[10px] text-[#98B4A6] font-bold uppercase tracking-widest mt-1">{course.code}</p>
                    </div>
                    <div className="flex space-x-1">
                      <button onClick={(e) => { e.stopPropagation(); setEditingCourse(course) }} className="p-2 text-gray-300 hover:text-[#98B4A6] hover:bg-white rounded-xl transition-all"><Edit className="w-4 h-4" /></button>
                      <button onClick={(e) => { e.stopPropagation(); deleteCourse(course.id) }} className="p-2 text-gray-300 hover:text-[#E8B4B8] hover:bg-white rounded-xl transition-all"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center relative z-10">
                    <div className="flex items-center space-x-3">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Grade: <span className="text-gray-800">{grade}%</span></span>
                      {grade > 0 && <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${gradeLetter.color.replace('text-', 'text-').replace('bg-', 'bg-')} border border-current opacity-70`}>{gradeLetter.letter}</span>}
                    </div>
                    <span className="text-[10px] font-black text-[#98B4A6] uppercase tracking-widest bg-white px-2 py-1 rounded-lg border border-[#F3EFE9]">Target {course.target_grade || '—'}</span>
                  </div>
                  {isActive && <div className="absolute top-0 right-0 w-16 h-16 bg-[#98B4A6]/10 rounded-full -mr-8 -mt-8" />}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* AI Difficulty Assessment - Wholesome Sparkles */}
      {selectedCourse && GEMINI_API_KEY && (
        <div className="bg-white rounded-[3rem] border-2 border-[#F3EFE9] p-8 shadow-sm overflow-hidden relative">
          <div className="flex items-center justify-between mb-6 relative z-10">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-[#F2F8F5] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-[#98B4A6]" />
              </div>
              <h2 className="text-lg font-black text-gray-800 tracking-tight">AI Difficulty Assessment</h2>
            </div>
            <button onClick={assessDifficulty} disabled={assessingDifficulty} className="flex items-center space-x-2 bg-[#98B4A6] text-white px-5 py-2.5 rounded-[1.5rem] hover:bg-[#6B8E7E] transition-all font-black text-sm disabled:opacity-50 shadow-lg shadow-[#98B4A6]/20">
              {assessingDifficulty ? <><Loader2 className="w-4 h-4 animate-spin" /><span>Analyzing...</span></> : <><Sparkles className="w-4 h-4" /><span>Analyze</span></>}
            </button>
          </div>
          {difficultyAssessment ? (
            <div className="bg-[#FCFAF7] rounded-[2rem] p-6 text-sm text-gray-600 leading-relaxed border border-[#F3EFE9] animate-fade-in relative z-10 font-medium">
              {difficultyAssessment}
            </div>
          ) : !assessingDifficulty && (
            <p className="text-sm text-[#98B4A6] font-bold uppercase tracking-widest px-2 opacity-70">Analyze {selectedCourse.name} to see AI insights on course difficulty.</p>
          )}
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#F2F8F5]/50 rounded-full -mr-16 -mt-16" />
        </div>
      )}

      {/* Grade Progress Chart - Wholesome Curves */}
      {selectedCourse && gradeData.length > 0 && (
        <div className="bg-white rounded-[3rem] border-2 border-[#F3EFE9] p-8 shadow-sm">
          <h2 className="text-lg font-black text-gray-800 tracking-tight mb-8">Performance Trend — {selectedCourse.name}</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={gradeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3EFE9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 700, fill: '#98B4A6' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fontWeight: 700, fill: '#98B4A6' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '1.5rem', border: '2px solid #F3EFE9', boxShadow: 'none' }} />
                <Line type="monotone" dataKey="currentGrade" stroke="#98B4A6" strokeWidth={4} name="Overall Grade" dot={{ r: 6, fill: '#98B4A6', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8 }} />
                <Line type="monotone" dataKey="grade" stroke="#E8B4B8" strokeWidth={3} strokeDasharray="5 5" name="Exam Grade" dot={{ r: 4, fill: '#E8B4B8' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Exams List - Wholesome Log */}
      {selectedCourse && (
        <div className="bg-white rounded-[3rem] border-2 border-[#F3EFE9] p-8 shadow-sm">
          <h2 className="text-lg font-black text-gray-800 tracking-tight mb-8 flex items-center">
            Recent Exams — {selectedCourse.name} <span className="ml-3 w-2 h-2 rounded-full bg-[#E8B4B8]" />
          </h2>
          <div className="space-y-4">
            {exams.filter(exam => exam.course_id === selectedCourse.id).map((exam, idx, arr) => {
              const prevExam = idx > 0 ? arr[idx - 1] : null
              const trend = prevExam && prevExam.grade !== null && exam.grade !== null ? exam.grade - prevExam.grade : null
              return (
                <div key={exam.id} className="flex items-center justify-between p-5 bg-[#FCFAF7] rounded-[2rem] border border-[#F3EFE9] group hover:bg-white transition-all duration-500">
                  <div className="flex items-center space-x-5">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors duration-500 ${exam.grade ? 'bg-[#F2F8F5] text-[#98B4A6]' : 'bg-[#FFF9F2] text-[#D4A373]'}`}>
                      <Award className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-black text-gray-800 tracking-tight text-sm">{exam.name}</h3>
                      <div className="flex items-center space-x-4 text-[10px] font-black uppercase tracking-widest text-[#98B4A6] mt-1.5">
                        <span className="flex items-center space-x-1.5"><Calendar className="w-3.5 h-3.5 opacity-60" /><span>{format(new Date(exam.date), 'MMM d, yyyy')}</span></span>
                        <span className="opacity-60">Weight: {exam.weight}%</span>
                        {exam.grade !== null && (
                          <span className="text-[#98B4A6] bg-white px-2 py-0.5 rounded-lg border border-[#F3EFE9]">
                            {exam.grade}/{exam.max_grade} ({Math.round((exam.grade / exam.max_grade) * 100)}%)
                          </span>
                        )}
                        {trend !== null && (
                          <span className={`flex items-center space-x-1 px-2 py-0.5 rounded-lg border ${trend >= 0 ? 'text-[#98B4A6] border-[#98B4A6]/20' : 'text-[#E8B4B8] border-[#E8B4B8]/20 bg-white'}`}>
                            {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            <span>{trend >= 0 ? '+' : ''}{trend.toFixed(1)}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button onClick={() => setEditingExam(exam)} className="w-10 h-10 flex items-center justify-center text-gray-300 hover:text-[#98B4A6] hover:bg-white rounded-xl transition-all duration-300"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => deleteExam(exam.id)} className="w-10 h-10 flex items-center justify-center text-gray-300 hover:text-[#E8B4B8] hover:bg-white rounded-xl transition-all duration-300"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {courses.length === 0 && (
        <div className="text-center py-16">
          <div className="w-20 h-20 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-5">
            <BarChart3 className="w-10 h-10 text-indigo-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No courses yet</h3>
          <p className="text-gray-500 mb-6 text-sm">Add your first course to start tracking grades</p>
          <button onClick={() => setShowAddCourse(true)} className="bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 font-semibold text-sm shadow-sm shadow-indigo-500/20">
            Add Your First Course
          </button>
        </div>
      )}

      {/* Forms */}
      {(showAddCourse || editingCourse) && <CourseForm course={editingCourse} onClose={() => { setShowAddCourse(false); setEditingCourse(null) }} onSave={() => { setShowAddCourse(false); setEditingCourse(null) }} />}
      {(showAddExam || editingExam) && <ExamForm exam={editingExam} onClose={() => { setShowAddExam(false); setEditingExam(null) }} onSave={() => { setShowAddExam(false); setEditingExam(null) }} />}
    </div>
  )
}

export default GradeTracker