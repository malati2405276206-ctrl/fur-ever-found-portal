// src/hooks/useRole.js
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export function useRole() {
  const [role,    setRole]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [userId,  setUserId]  = useState(null)

  useEffect(() => {
    // Step 1: Get current session directly
    // (more reliable than waiting for useAuth)
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.user) {
        // No user logged in — guest
        setRole(null)
        setLoading(false)
        return
      }

      setUserId(session.user.id)
      await fetchRole(session.user.id)
    }

    init()

    // Step 2: Re-fetch role whenever auth state changes
    // (catches login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!session?.user) {
          setRole(null)
          setUserId(null)
          setLoading(false)
          return
        }

        setUserId(session.user.id)
        await fetchRole(session.user.id)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const fetchRole = async (uid) => {
    setLoading(true)

    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', uid)
      .single()

    if (error) {
      console.error('useRole error:', error.message)
      setRole('user') // safe fallback
    } else {
      setRole(data?.role ?? 'user')
    }

    setLoading(false)
  }

  return {
    role,
    loading,
    isGuest: !userId,
    isUser:  role === 'user',
    isNGO:   role === 'ngo',
  }
}