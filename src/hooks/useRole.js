// src/hooks/useRole.js
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'

export function useRole() {
  const { user, loading: authLoading } = useAuth()
  const [role, setRole]       = useState(null)   // null = guest or not loaded yet
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // If auth is still loading, wait
    if (authLoading) return

    // If no user is logged in, they are a guest
    if (!user) {
      setRole(null)
      setLoading(false)
      return
    }

    // Fetch this user's role from the profiles table
    const fetchRole = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)   // match by user ID
        .single()            // expect exactly one row

      if (error) {
        console.error('Error fetching role:', error.message)
        setRole('user')      // fallback to basic user
      } else {
        setRole(data.role)   // 'user' or 'ngo'
      }

      setLoading(false)
    }

    fetchRole()
  }, [user, authLoading])

  // Convenience booleans — easier to use in components
  return {
    role,                          // raw value: null | 'user' | 'ngo'
    loading,
    isGuest: !user,                // true if not logged in
    isUser:  role === 'user',      // true if regular user
    isNGO:   role === 'ngo',       // true if verified NGO
  }

  // Usage example in any component:
  // const { isNGO, isGuest, role } = useRole()
}