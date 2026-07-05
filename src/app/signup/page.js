// src/app/signup/page.js
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { motion } from 'framer-motion'

export default function SignupPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!authLoading && user) {
      router.push('/')
    }
  }, [user, authLoading])

  if (authLoading || user) return null

  const handleSignup = async (e) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setSubmitting(true)

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName }
      }
    })

    if (signUpError) {
      setError(signUpError.message || 'Signup failed. Please try again.')
      setSubmitting(false)
      return
    }

    setSuccess(true)
    setSubmitting(false)
  }

  // ── Success screen ──
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-8" style={{ background: '#EBDDC5' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md text-center"
        >
          <div className="sticky-note sticky-note-buff mx-auto p-8">
            <div className="text-6xl mb-4">📬</div>
            <h2 className="heading-artistic text-2xl mb-3" style={{ color: 'var(--police-blue)' }}>
              Check your email!
            </h2>
            <p className="text-sm mb-6 leading-relaxed" style={{ color: 'var(--police-blue)', opacity: 0.7 }}>
              We sent a confirmation link to{' '}
              <span className="font-bold" style={{ opacity: 1 }}>{email}</span>.
              <br />Click it to activate your account.
            </p>
            <Link
              href="/login"
              className="inline-block px-6 py-3 rounded-full font-bold text-sm transition shadow-md hover:scale-105"
              style={{ background: 'var(--police-blue)', color: '#F3D58D' }}
            >
              Go to Login 🐾
            </Link>
          </div>
        </motion.div>
      </div>
    )
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
      <div className="flex-1 flex items-center justify-center px-4 py-8 sm:py-12 lg:px-12" style={{ background: '#EBDDC5' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Greeting */}
          <div className="mb-7">
            <h1 className="heading-artistic text-3xl sm:text-4xl mb-2" style={{ color: 'var(--police-blue)' }}>
              Hello! Welcome Aboard
            </h1>
            <p className="text-base" style={{ color: 'var(--police-blue)', opacity: 0.7 }}>
              We are glad to see you 😊
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
          <form onSubmit={handleSignup} className="space-y-4">
            {/* Name & Email row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--police-blue)' }}>
                  Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your full name"
                  required
                  className="w-full px-5 py-3.5 rounded-full border-none text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 transition"
                  style={{ background: '#f7f3eb', color: 'var(--police-blue)' }}
                />
              </div>
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
            </div>

            {/* Password & Confirm row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--police-blue)' }}>
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    required
                    className="w-full px-5 py-3.5 pr-14 rounded-full border-none text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 transition"
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
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--police-blue)' }}>
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    required
                    className="w-full px-5 py-3.5 pr-14 rounded-full border-none text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 transition"
                    style={{ background: '#f7f3eb', color: 'var(--police-blue)' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold transition"
                    style={{ color: 'var(--police-blue)', opacity: 0.6 }}
                    aria-label={showConfirm ? 'Hide password' : 'Show password'}
                  >
                    {showConfirm ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
            </div>

            {/* Password mismatch hint */}
            {confirmPassword && password !== confirmPassword && (
              <p className="text-xs text-red-500 -mt-2 pl-2">Passwords don&apos;t match</p>
            )}

            {/* Terms checkbox */}
            <label className="flex items-center gap-3 mt-2" style={{ color: 'var(--police-blue)' }}>
              <input
                type="checkbox"
                required
                className="w-5 h-5 rounded border-2 accent-amber-500"
                style={{ borderColor: 'var(--police-blue)' }}
              />
              <span className="text-sm">
                I agree to the{' '}
                <span className="font-semibold underline" style={{ color: 'var(--marigold)' }}>terms of service</span>
                {' '}and{' '}
                <span className="font-semibold underline" style={{ color: 'var(--marigold)' }}>privacy policy</span>
              </span>
            </label>

            {/* Sign up button */}
            <motion.button
              type="submit"
              disabled={submitting}
              whileHover={{ scale: submitting ? 1 : 1.02 }}
              whileTap={{ scale: submitting ? 1 : 0.97 }}
              className="w-full sm:w-auto font-bold py-3.5 px-10 rounded-full transition flex items-center justify-center gap-2 text-sm mt-3 shadow-md"
              style={{
                background: submitting ? 'var(--buff)' : 'var(--police-blue)',
                color: submitting ? 'var(--police-blue)' : '#F3D58D',
              }}
            >
              {submitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin inline-block" />
                  Creating account...
                </>
              ) : (
                'Sign Up 🐾'
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
            Already have an account?{' '}
            <Link href="/login" className="font-bold hover:underline" style={{ color: 'var(--marigold)' }}>
              Sign in
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
