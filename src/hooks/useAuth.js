// src/hooks/useAuth.js
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export function useAuth() {
  const [user, setUser] = useState(null)    // null = not logged in
  const [loading, setLoading] = useState(true) // true = still checking

  useEffect(() => {
    // Step 1: Check if someone is already logged in when page loads
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)       // Save user (or null if nobody)
      setLoading(false)   // Done checking
    }

    getUser()

    // Step 2: Watch for login/logout events in real time
    // Like a security camera - fires whenever auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
        // session?.user = user if logged in, null if logged out
      }
    )

    // Step 3: Cleanup when component is removed from screen
    return () => subscription.unsubscribe()
  }, [])

  return { user, loading }
}