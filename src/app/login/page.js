// src/app/login/page.js
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import Link from 'next/link'
import { login } from '@/lib/auth'
import { checkRateLimit } from '@/lib/rateLimit'

export default function LoginPage() {
  const [email,        setEmail]        = useState('')
  const [password,     setPassword]     = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting,   setSubmitting]   = useState(false) // ← renamed, was never declared
  const [error,        setError]        = useState('')

  const { user, loading: authLoading } = useAuth() // ← aliased to avoid conflict
  const router = useRouter()

  useEffect(() => {
    if (!authLoading && user) {
      router.push('/')
    }
  }, [user, authLoading])

  if (authLoading || user) return null

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    const { allowed, message } = checkRateLimit('login')
    if (!allowed) {
      setError(message)
      setSubmitting(false)
      return
    }

    const { error } = await login(email, password)

    if (error) {
      setError(error.message)
      setSubmitting(false)
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 sm:py-12" style={{ background: '#EBDDC5' }}>
      <div className="bg-white rounded-3xl shadow-xl p-6 sm:p-8 w-full max-w-md">

        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🐾</div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--police-blue)' }}>Welcome Back</h1>
          <p className="text-gray-500 text-sm mt-1">Sign in to help reunite cats with families</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl mb-5">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-400 transition text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
                required
                className="w-full px-4 py-3 pr-16 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-400 transition text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-medium"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2 text-white"
            style={{ background: submitting ? 'var(--buff)' : 'var(--marigold)' }}
          >
            {submitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <p className="text-center text-gray-400 text-sm mt-6">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="font-semibold hover:underline" style={{ color: 'var(--marigold)' }}>
            Create one free
          </Link>
        </p>
      </div>
    </div>
  )
}