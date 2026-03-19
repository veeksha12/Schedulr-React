import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isRecovering, setIsRecovering] = useState(false)

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'PASSWORD_RECOVERY') {
          setIsRecovering(true)
        }
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email, password, username) => {
    if (!supabase) {
      return { error: { message: 'Please connect to Supabase first' } }
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username
        }
      }
    })
    return { data, error }
  }

  const signIn = async (email, password) => {
    if (!supabase) {
      return { error: { message: 'Please connect to Supabase first' } }
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    return { data, error }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  const resetPassword = async (email) => {
    if (!supabase) return { error: { message: 'Missing Supabase client' } }
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    return { data, error }
  }

  const updatePassword = async (newPassword) => {
    if (!supabase) return { error: { message: 'Missing Supabase client' } }
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    })
    return { data, error }
  }

  const updateUserMetadata = async (updates) => {
    if (!supabase || !user) return
    
    const { data, error } = await supabase.auth.updateUser({
      data: {
        ...user.user_metadata,
        ...updates
      }
    })
    
    if (!error && data.user) {
      setUser(data.user)
    }
    return { data, error }
  }

  const addXP = async (amount) => {
    if (!supabase || !user) return
    
    const currentXP = user.user_metadata?.xp || 0
    const newXP = currentXP + amount
    
    return await updateUserMetadata({ xp: newXP })
  }

  const value = {
    user,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    addXP,
    updateUserMetadata,
    loading,
    isRecovering
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}