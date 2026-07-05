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
              We are glad to see you 🐾
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
                'Sign In 🐾'
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
