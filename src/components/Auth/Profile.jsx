import React, { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { 
  User, 
  Mail, 
  BookOpen, 
  MapPin, 
  Calendar, 
  Camera, 
  Check, 
  ShieldCheck,
  GraduationCap,
  Save,
  Loader2
} from 'lucide-react'

const AVATARS = [
  'https://api.dicebear.com/7.x/notionists/svg?seed=Felix',
  'https://api.dicebear.com/7.x/notionists/svg?seed=Aneka',
  'https://api.dicebear.com/7.x/notionists/svg?seed=Milo',
  'https://api.dicebear.com/7.x/notionists/svg?seed=Lilly',
  'https://api.dicebear.com/7.x/notionists/svg?seed=Jasper',
  'https://api.dicebear.com/7.x/notionists/svg?seed=Sasha',
  'https://api.dicebear.com/7.x/notionists/svg?seed=Toby',
  'https://api.dicebear.com/7.x/notionists/svg?seed=Chloe',
  'https://api.dicebear.com/7.x/notionists/svg?seed=Bear',
  'https://api.dicebear.com/7.x/notionists/svg?seed=Cookie',
  'https://api.dicebear.com/7.x/notionists/svg?seed=Ginger',
  'https://api.dicebear.com/7.x/notionists/svg?seed=Jack'
]

const Profile = () => {
  const { user, updateUserMetadata } = useAuth()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState({
    username: user?.user_metadata?.username || '',
    bio: user?.user_metadata?.bio || '',
    major: user?.user_metadata?.major || '',
    year: user?.user_metadata?.year || '',
    avatar_url: user?.user_metadata?.avatar_url || AVATARS[0]
  })

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 1024 * 1024) { // 1MB limit
        alert('Image too large. Please select a file under 1MB.')
        return
      }
      
      const reader = new FileReader()
      reader.onloadend = () => {
        setFormData({ ...formData, avatar_url: reader.result })
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setSuccess(false)
    
    const { error } = await updateUserMetadata(formData)
    
    if (!error) {
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } else {
      alert('Error updating profile: ' + error.message)
    }
    setLoading(false)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Student Profile</h1>
        <p className="text-[10px] text-[#98B4A6] font-black uppercase tracking-widest mt-1">Manage your professional presence and academic details</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Avatar Selection */}
        <div className="lg:col-span-1 space-y-8">
          <div className="bg-white rounded-[3rem] border-4 border-[#F3EFE9] p-10 text-center overflow-hidden relative shadow-sm">
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-[#F2F8F5] to-[#98B4A6]/10" />
            
            <div className="relative inline-block mt-8 mb-8">
              <div className="w-36 h-36 rounded-[2.5rem] bg-white p-2 shadow-xl ring-8 ring-[#FCFAF7] border-2 border-[#F3EFE9]">
                <img 
                  src={formData.avatar_url} 
                  alt="Avatar" 
                  className="w-full h-full rounded-[2rem] object-cover"
                />
              </div>
              <div className="absolute -bottom-3 -right-3">
                <label className="w-12 h-12 flex items-center justify-center bg-[#98B4A6] rounded-2xl text-white shadow-lg cursor-pointer hover:bg-[#6B8E7E] transition-all transform hover:scale-110 active:scale-95 border-4 border-white">
                  <Camera className="w-5 h-5" />
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleFileChange} 
                  />
                </label>
              </div>
            </div>
            
            <h2 className="text-2xl font-black text-gray-800 tracking-tight leading-tight">{formData.username || 'Student Name'}</h2>
            <p className="text-xs text-gray-400 font-medium mt-2 mb-8">{user?.email}</p>
            
            <div className="flex items-center justify-center space-x-2.5 text-[9px] font-black text-[#98B4A6] bg-[#F2F8F5] py-3 rounded-[1.5rem] border border-[#98B4A6]/20 uppercase tracking-[0.2em] shadow-sm">
              <ShieldCheck className="w-4 h-4" />
              <span>Verified Account</span>
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] border-2 border-[#F3EFE9] p-8 shadow-sm">
            <h3 className="text-[10px] font-black text-gray-400 mb-6 uppercase tracking-widest text-center">Customize Avatar</h3>
            <div className="grid grid-cols-4 gap-3">
              {AVATARS.map((url, i) => (
                <button
                  key={i}
                  onClick={() => setFormData({ ...formData, avatar_url: url })}
                  className={`relative rounded-xl overflow-hidden aspect-square border-2 transition-all group ${
                    formData.avatar_url === url 
                      ? 'border-[#98B4A6] scale-95 ring-4 ring-[#F2F8F5]' 
                      : 'border-transparent hover:border-[#F3EFE9]'
                  }`}
                >
                  <img src={url} alt={`Avatar option ${i}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                  {formData.avatar_url === url && (
                    <div className="absolute inset-0 bg-[#98B4A6]/10 flex items-center justify-center">
                      <div className="bg-white rounded-full p-1 shadow-sm">
                        <Check className="w-3 h-3 text-[#98B4A6] stroke-[4]" />
                      </div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Form */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-[2.5rem] border-4 border-[#F3EFE9] p-10 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-48 h-48 bg-[#F2F8F5] opacity-20 blur-3xl group-hover:opacity-40 transition-opacity" />
            <h3 className="text-2xl font-black text-gray-800 mb-8 flex items-center tracking-tight">
              <div className="w-10 h-10 bg-[#F2F8F5] flex items-center justify-center rounded-xl mr-4 border border-[#98B4A6]/20">
                <User className="w-5 h-5 text-[#98B4A6]" />
              </div>
              Profile Details
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Display Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#98B4A6]/40" />
                    <input 
                      type="text" 
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      className="w-full pl-12 pr-6 py-4 border-2 border-[#F3EFE9] rounded-[1.5rem] focus:ring-0 focus:border-[#98B4A6] text-sm bg-[#FCFAF7] font-medium transition-all" 
                      placeholder="Your cool student handle"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Email (Locked)</label>
                  <div className="relative opacity-60">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#98B4A6]/30" />
                    <input 
                      type="email" 
                      value={user?.email} 
                      disabled 
                      className="w-full pl-12 pr-6 py-4 border-2 border-[#F3EFE9] rounded-[1.5rem] text-sm bg-gray-100 cursor-not-allowed font-medium" 
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">About You</label>
                <textarea 
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="w-full px-6 py-4 border-2 border-[#F3EFE9] rounded-[1.5rem] focus:ring-0 focus:border-[#98B4A6] text-sm bg-[#FCFAF7] font-medium transition-all min-h-[120px] resize-none" 
                  placeholder="Share a bit about your academic journey..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Study Program</label>
                  <div className="relative">
                    <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#98B4A6]/40" />
                    <input 
                      type="text" 
                      value={formData.major}
                      onChange={(e) => setFormData({ ...formData, major: e.target.value })}
                      className="w-full pl-12 pr-6 py-4 border-2 border-[#F3EFE9] rounded-[1.5rem] focus:ring-0 focus:border-[#98B4A6] text-sm bg-[#FCFAF7] font-medium transition-all" 
                      placeholder="e.g., Computer Science"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Academic Year</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#98B4A6]/40" />
                    <select 
                      value={formData.year}
                      onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                      className="w-full pl-12 pr-10 py-4 border-2 border-[#F3EFE9] rounded-[1.5rem] focus:ring-0 focus:border-[#98B4A6] text-sm bg-[#FCFAF7] font-medium transition-all appearance-none"
                    >
                      <option value="">Select your year</option>
                      <option value="1">1st Year / Freshman</option>
                      <option value="2">2nd Year / Sophomore</option>
                      <option value="3">3rd Year / Junior</option>
                      <option value="4">4th Year / Senior</option>
                      <option value="postgrad">Postgraduate</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-6 pt-6 border-t-2 border-[#FCFAF7]">
                {success && (
                  <span className="text-[#98B4A6] text-[10px] font-black uppercase tracking-widest animate-fade-in flex items-center">
                    <Check className="w-4 h-4 mr-2" /> Profile Saved!
                  </span>
                )}
                <button 
                  type="submit" 
                  disabled={loading}
                  className="flex items-center space-x-3 bg-[#98B4A6] text-white px-10 py-5 rounded-[2rem] hover:bg-[#6B8E7E] transition-all font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-[#98B4A6]/20 disabled:opacity-50 transform hover:-translate-y-1 active:translate-y-0"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Save className="w-5 h-5" />
                  )}
                  <span>{loading ? 'Saving...' : 'Update Profile'}</span>
                </button>
              </div>
            </form>
          </div>
          
          <div className="bg-[#FFF9F2] rounded-[2rem] border-2 border-[#D4A373]/10 p-8 flex items-start space-x-5 shadow-sm">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center border border-[#D4A373]/20 shadow-sm">
              <ShieldCheck className="w-6 h-6 text-[#D4A373]" />
            </div>
            <div>
              <h4 className="text-[#D4A373] font-black text-[10px] uppercase tracking-widest mt-1">Advisor's Note</h4>
              <p className="text-[#D4A373] text-xs mt-2 leading-relaxed font-bold italic">
                "Your profile information helps me personalize my advice and study strategies for your specific academic journey. 
                Keep your details updated for the best results!"
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile
