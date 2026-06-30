// src/components/ProtectedRoute.js
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useRole } from '@/hooks/useRole'

// Props:
// requiredRole = 'ngo' | null (null = any logged-in user)
// redirectTo   = where to send unauthorized users
export default function ProtectedRoute({
  children,
  requiredRole = null,
  redirectTo = '/login',
}) {
  const { role, loading, isGuest } = useRole()
  const router = useRouter()

  useEffect(() => {
    if (loading) return

    // Not logged in → send to login
    if (isGuest) {
      router.push(redirectTo)
      return
    }

    // Needs NGO role but user is not NGO → send home
    if (requiredRole === 'ngo' && role !== 'ngo') {
      router.push('/')
    }
  }, [role, loading, isGuest])

  // Show spinner while role is being checked
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Don't flash protected content before redirect fires
  if (isGuest) return null
  if (requiredRole === 'ngo' && role !== 'ngo') return null

  return children
}