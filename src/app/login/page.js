// src/app/login/page.js
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import Link from 'next/link'
import { login } from '@/lib/auth'
import { checkRateLimit } from '@/lib/rateLimit'
import { motion } from 'framer-motion'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')

  const { user, loading: authLoading } = useAuth()
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

  const handleGoogleLogin = async () => {
    setGoogleLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
      setGoogleLoading(false)
    }
    // No need to handle success — Google will redirect automatically
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left animation panel */}
      <div className="hidden lg:block lg:w-[48%] relative min-h-screen overflow-hidden" style={{ background: '#EBDDC5' }}>
        {/* Background video */}
        <video
          src="/cat-in-box-animation.mp4"
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover z-10"
        />

        {/* Wavy partition edge on the right side */}
        <svg
          className="absolute top-0 right-0 h-full w-16 z-20"
          viewBox="0 0 80 900"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M40,0 C10,50 70,100 40,150 C10,200 70,250 40,300 C10,350 70,400 40,450 C10,500 70,550 40,600 C10,650 70,700 40,750 C10,800 70,850 40,900 L80,900 L80,0 Z"
            fill="#EBDDC5"
          />
        </svg>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center px-4 py-10 sm:py-16 lg:px-12" style={{ background: '#EBDDC5' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Greeting */}
          <div className="mb-8">
            <h1 className="heading-artistic text-3xl sm:text-4xl mb-2" style={{ color: 'var(--police-blue)' }}>
              Hello! Welcome Back
            </h1>
            <p className="text-base" style={{ color: 'var(--police-blue)', opacity: 0.7 }}>
              We are glad to see you <img src="/icon-emoji/cat-paw.png" alt="" width={30} height={30} className="inline-block" />
            </p>
          </div>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-full mb-5"
            >
              {error}
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--police-blue)' }}>
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full px-5 py-3.5 rounded-full border-none text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 transition"
                style={{ background: '#f7f3eb', color: 'var(--police-blue)' }}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--police-blue)' }}>
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password"
                  required
                  className="w-full px-5 py-3.5 pr-16 rounded-full border-none text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 transition"
                  style={{ background: '#f7f3eb', color: 'var(--police-blue)' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold transition"
                  style={{ color: 'var(--police-blue)', opacity: 0.6 }}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {/* Google Sign In */}
              <button
                onClick={handleGoogleLogin}
                disabled={googleLoading}
                className="w-full flex items-center justify-center gap-3 border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold py-3 rounded-xl transition mb-4 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {googleLoading ? (
                  <span className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                )}
                {googleLoading ? 'Connecting...' : 'Continue with Google'}
              </button>

            {/* Sign in button */}
            <motion.button
              type="submit"
              disabled={submitting}
              whileHover={{ scale: submitting ? 1 : 1.02 }}
              whileTap={{ scale: submitting ? 1 : 0.97 }}
              className="w-full font-bold py-3.5 rounded-full transition flex items-center justify-center gap-2 text-sm mt-2 shadow-md"
              style={{
                background: submitting ? 'var(--buff)' : 'var(--police-blue)',
                color: submitting ? 'var(--police-blue)' : '#F3D58D',
              }}
            >
              {submitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin inline-block" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </motion.button>
          </form>

          {/* Divider */}
          <div className="flex items-center my-6">
            <div className="flex-1 h-px" style={{ background: 'var(--police-blue)', opacity: 0.15 }} />
            <span className="px-4 text-xs font-medium" style={{ color: 'var(--police-blue)', opacity: 0.5 }}>or</span>
            <div className="flex-1 h-px" style={{ background: 'var(--police-blue)', opacity: 0.15 }} />
          </div>

          {/* Footer links */}
          <p className="text-center text-sm" style={{ color: 'var(--police-blue)', opacity: 0.7 }}>
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="font-bold hover:underline" style={{ color: 'var(--marigold)' }}>
              Create one free
            </Link>
          </p>

          <p className="text-center text-xs mt-3" style={{ color: 'var(--police-blue)', opacity: 0.5 }}>
            Registering a rescue organisation?{' '}
            <Link href="/ngo-signup" className="font-semibold hover:underline" style={{ color: 'var(--marigold)' }}>
              NGO Registration →
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
