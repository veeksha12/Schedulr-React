import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { 
  Users, 
  Plus, 
  Search, 
  MessageSquare, 
  Globe, 
  Lock, 
  Shield, 
  ArrowRight,
  TrendingUp,
  Brain,
  RefreshCw
} from 'lucide-react'
import { format } from 'date-fns'
import { ACTIONS, getXPForAction } from '../../lib/gamification'

const GroupsManager = ({ onSelectGroup }) => {
  const { user, addXP } = useAuth()
  const [groups, setGroups] = useState([])
  const [isCreating, setIsCreating] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [newGroup, setNewGroup] = useState({ name: '', description: '' })
  const [isTableMissing, setIsTableMissing] = useState(false)
  const [useDemoMode, setUseDemoMode] = useState(false)

  useEffect(() => {
    if (user) fetchGroups()
  }, [user])

  const fetchGroups = async () => {
    setIsTableMissing(false)
    const { data, error } = await supabase
      .from('study_groups')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Fetch error:', error)
      if (error.code === 'PGRST116' || error.code === '42P01' || error.code === 'PGRST205' || error.message?.includes('not found') || error.status === 404) {
        setIsTableMissing(true)
      }
      return
    }
    setGroups(data || [])
  }

  const activateDemoMode = () => {
    setIsTableMissing(false)
    setUseDemoMode(true)
    setGroups([
      { id: 'demo-1', name: 'Computer Science Study Group', description: 'Collaborative space for discussing algorithms, data structures, and computer systems. Welcome all majors!' },
      { id: 'demo-2', name: 'Biological Sciences Lab', description: 'Prepare for exams, share lecture notes, and discuss the latest in genetics and neuroscience.' },
      { id: 'demo-3', name: 'Creative Arts & Design', description: 'A relaxed space for portfolio reviews and creative feedback.' }
    ])
  }

  const handleCreateGroup = async (e) => {
    e.preventDefault()
    if (!newGroup.name.trim()) return

    const { data, error } = await supabase
      .from('study_groups')
      .insert([{
        name: newGroup.name,
        description: newGroup.description,
        created_by: user.id
      }])
      .select()

    if (!error) {
      setGroups([data[0], ...groups])
      setIsCreating(false)
      setNewGroup({ name: '', description: '' })
      // Award XP for creating a group
      await addXP(getXPForAction(ACTIONS.PLANNER_CREATED)) // Reuse planner XP or just hardcode
    }
  }

  const filteredGroups = groups.filter(g => 
    g.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    g.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-12 text-gray-800">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            Study Communities <Users className="w-6 h-6 ml-3 text-indigo-600" />
          </h1>
          <p className="text-gray-500 mt-1">Connect, collaborate, and conquer your exams together</p>
        </div>
        <button 
          onClick={() => setIsCreating(true)}
          className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center space-x-2 hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 transition-all hover:scale-105 active:scale-95"
        >
          <Plus className="w-5 h-5" />
          <span>Create New Group</span>
        </button>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600"><Globe className="w-6 h-6" /></div>
          <div><p className="text-2xl font-black">{groups.length}</p><p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Active Groups</p></div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600"><TrendingUp className="w-6 h-6" /></div>
          <div><p className="text-2xl font-black">2.4k</p><p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Total Members</p></div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-amber-50 rounded-2xl text-amber-600"><Brain className="w-6 h-6" /></div>
          <div><p className="text-2xl font-black">8.1k</p><p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Study Hours</p></div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input 
          type="text" 
          placeholder="Search for subject groups (e.g. Calculus, Bio, Literature)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-white border border-gray-100 rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm"
        />
      </div>

      {/* Groups Grid */}
      {isTableMissing ? (
        <div className="bg-white rounded-[2.5rem] border-2 border-dashed border-indigo-200 p-12 text-center overflow-hidden">
          <div className="max-w-xl mx-auto space-y-6">
            <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Plus className="w-8 h-8 text-indigo-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Database Setup Required</h2>
            <p className="text-gray-500">To enable Collaborative Groups, you need to create the table in your Supabase SQL Editor. Copy the SQL below and run it!</p>
            
            <div className="bg-gray-900 rounded-2xl p-6 text-left relative group">
              <pre className="text-[10px] text-indigo-300 font-mono overflow-x-auto whitespace-pre-wrap">
{`-- 1. Create Study Groups Table
CREATE TABLE IF NOT EXISTS public.study_groups (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    description text,
    created_by uuid REFERENCES auth.users(id),
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- 2. Create Group Messages Table
CREATE TABLE IF NOT EXISTS public.group_messages (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id uuid REFERENCES public.study_groups(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id),
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- 3. Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE group_messages;

-- 4. Simple Access Policies
ALTER TABLE study_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow All" ON study_groups FOR ALL USING (true);
CREATE POLICY "Allow All" ON group_messages FOR ALL USING (true);`}
              </pre>
              <button 
                onClick={() => { navigator.clipboard.writeText(`CREATE TABLE IF NOT EXISTS public.study_groups (id uuid DEFAULT gen_random_uuid() PRIMARY KEY, name text NOT NULL, description text, created_by uuid REFERENCES auth.users(id), created_at timestamp with time zone DEFAULT now() NOT NULL); CREATE TABLE IF NOT EXISTS public.group_messages (id uuid DEFAULT gen_random_uuid() PRIMARY KEY, group_id uuid REFERENCES public.study_groups(id) ON DELETE CASCADE, user_id uuid REFERENCES auth.users(id), content text NOT NULL, created_at timestamp with time zone DEFAULT now() NOT NULL); ALTER PUBLICATION supabase_realtime ADD TABLE group_messages; ALTER TABLE study_groups ENABLE ROW LEVEL SECURITY; ALTER TABLE group_messages ENABLE ROW LEVEL SECURITY; CREATE POLICY "Allow All" ON study_groups FOR ALL USING (true); CREATE POLICY "Allow All" ON group_messages FOR ALL USING (true);`); alert('SQL Copied!') }}
                className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white px-3 py-1 rounded-lg text-[10px] uppercase font-bold tracking-widest transition-all"
              >
                Copy SQL
              </button>
            </div>

            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6 text-left">
              <p className="text-xs font-bold text-amber-800 uppercase tracking-widest mb-2 flex items-center">
                <Shield className="w-4 h-4 mr-2" />
                Troubleshooting PGRST205
              </p>
              <ul className="text-[10px] text-amber-700 space-y-2 list-disc pl-4">
                <li>Check if your <b>.env</b> file URL matches this project.</li>
                <li>Wait 30 seconds for Supabase to refresh its cache.</li>
                <li>Run this in SQL Editor: <code>NOTIFY pgrst, 'reload schema';</code></li>
              </ul>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={fetchGroups}
                className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-indigo-700 transition-all flex items-center space-x-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Retry Connection</span>
              </button>
              <button 
                onClick={activateDemoMode}
                className="bg-white border border-gray-200 text-gray-500 px-8 py-3 rounded-2xl font-bold hover:bg-gray-50 transition-all flex items-center space-x-2"
              >
                <Globe className="w-4 h-4" />
                <span>Use Demo Mode</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredGroups.map(group => (
          <div 
            key={group.id} 
            onClick={() => onSelectGroup(group)}
            className="bg-white rounded-[2.5rem] p-8 border border-gray-50 shadow-card hover:shadow-xl transition-all cursor-pointer group relative overflow-hidden flex flex-col h-full"
          >
            <div className="absolute top-0 left-0 w-2 h-full bg-indigo-500 group-hover:w-3 transition-all" />
            
            <div className="flex items-start justify-between mb-6">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
                <Users className="w-7 h-7" />
              </div>
              <div className="flex -space-x-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-gray-200" />
                ))}
                <div className="w-8 h-8 rounded-full border-2 border-white bg-indigo-50 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-indigo-600">+12</span>
                </div>
              </div>
            </div>

            <h3 className="text-xl font-bold text-gray-900 mb-2 truncate group-hover:text-indigo-600 transition-colors">
              {group.name}
            </h3>
            <p className="text-gray-500 text-sm line-clamp-3 mb-8 flex-grow">
              {group.description || 'No description provided. Join to see what this group is all about!'}
            </p>

            <div className="flex items-center justify-between pt-6 border-t border-gray-50">
              <div className="flex items-center space-x-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
                <MessageSquare className="w-4 h-4" />
                <span>Active Chat</span>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
            </div>
          </div>
        ))}

        {filteredGroups.length === 0 && (
          <div className="col-span-full py-20 bg-white rounded-[2.5rem] border border-dashed border-gray-200 flex flex-col items-center justify-center text-center">
            <Users className="w-16 h-16 text-gray-200 mb-4" />
            <h3 className="text-xl font-bold text-gray-400">No groups found</h3>
            <p className="text-gray-400 mt-2">Try searching for something else or create your own!</p>
          </div>
        )}
        </div>
      )}

      {/* Create Modal */}
      {isCreating && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-xl p-8 md:p-12 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-500/30">
                  <Users className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-bold">New Study Group</h2>
              </div>
              <button onClick={() => setIsCreating(false)} className="text-gray-400 hover:text-gray-600"><Plus className="w-6 h-6 rotate-45" /></button>
            </div>

            <form onSubmit={handleCreateGroup} className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Group Name</label>
                <input 
                  autoFocus
                  type="text" 
                  value={newGroup.name}
                  onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                  placeholder="e.g. Pre-Med Focus Group"
                  className="w-full bg-gray-50 border border-transparent rounded-2xl py-4 px-6 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Description</label>
                <textarea 
                  rows="4"
                  value={newGroup.description}
                  onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                  placeholder="What is the goal of this group?"
                  className="w-full bg-gray-50 border border-transparent rounded-2xl py-4 px-6 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all font-medium resize-none"
                />
              </div>

              <div className="flex items-center space-x-3 bg-amber-50 border border-amber-100 rounded-2xl p-4">
                <Shield className="w-5 h-5 text-amber-600 flex-shrink-0" />
                <p className="text-xs text-amber-800 leading-relaxed font-medium">As the founder, you'll be responsible for maintaining a helpful and productive environment.</p>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsCreating(false)} 
                  className="flex-1 py-4 rounded-2xl font-bold text-gray-500 hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 transition-all transform hover:scale-[1.02]"
                >
                  Launch Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default GroupsManager
