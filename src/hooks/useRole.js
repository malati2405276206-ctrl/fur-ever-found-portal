// src/hooks/useRole.js
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export function useRole() {
  const [role,    setRole]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [userId,  setUserId]  = useState(null)

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.user) {
        setRole(null)
        setLoading(false)
        return
      }

      setUserId(session.user.id)
      await fetchRole(session.user.id)
    }

    init()

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
      .maybeSingle()  // ← safe — never crashes on 0 or multiple rows

    if (error) {
      console.error('useRole error:', error.message)
      setRole('user')
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