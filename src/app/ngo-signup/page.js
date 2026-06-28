// src/app/ngo-signup/page.js
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function NGOSignupPage() {
  const [step, setStep] = useState(1)

  // Step 1 fields
  const [fullName,         setFullName]         = useState('')
  const [email,            setEmail]            = useState('')
  const [password,         setPassword]         = useState('')
  const [confirmPassword,  setConfirmPassword]  = useState('')

  // Step 2 fields
  const [orgName,          setOrgName]          = useState('')
  const [orgDescription,   setOrgDescription]   = useState('')
  const [city,             setCity]             = useState('')
  const [website,          setWebsite]          = useState('')
  const [contactPhone,     setContactPhone]     = useState('')

  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [success,  setSuccess]  = useState(false)

  // Step 1: validate credentials, move to step 2
  const handleStep1 = (e) => {
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
    setStep(2)
  }

  // Step 2: create account + save NGO details
  const handleStep2 = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { allowed, message } = checkRateLimit('ngoSignup')
    if (!allowed) {
      setError(message)
      setLoading(false)
      return
    }

    // Sanitize NGO fields
    const clean = sanitizeForm({
      orgName:        { value: orgName,        type: 'text',  maxLength: 200 },
      orgDescription: { value: orgDescription, type: 'text',  maxLength: 1000 },
      city:           { value: city,           type: 'text',  maxLength: 100 },
      website:        { value: website,        type: 'url'                   },
      contactPhone:   { value: contactPhone,   type: 'phone'                 },
    })

    // Create auth account
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    const userId = data?.user?.id

    // Save NGO org details (verified starts as false)
    if (userId) {
      const { error: ngoError } = await supabase
        .from('ngo_profiles')
        .insert({
          user_id:         userId,
          org_name:        orgName,
          org_description: orgDescription,
          city,
          website:         website || null,
          contact_phone:   contactPhone,
          verified:        false,
        })

      if (ngoError) {
        setError(ngoError.message)
        setLoading(false)
        return
      }
    }

    setSuccess(true)
    setLoading(false)
  }

  // ── Success screen ──
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50
                      flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Application Submitted!
          </h2>
          <p className="text-gray-500 text-sm mb-4">
            Thanks for registering <strong>{orgName}</strong>.
            Please confirm your email, then wait for admin verification.
          </p>
          <div className="bg-amber-50 border border-amber-200
                          rounded-xl p-4 mb-6 text-left">
            <p className="text-amber-700 text-xs font-semibold mb-2">
              ⏳ What happens next?
            </p>
            <ol className="text-amber-600 text-xs space-y-1 list-decimal list-inside">
              <li>Confirm your email via the link we sent</li>
              <li>Admin reviews your organisation details</li>
              <li>You get approved and unlocked as an NGO</li>
              <li>Post adoption cats and manage your dashboard</li>
            </ol>
          </div>
          <Link
            href="/login"
            className="inline-block bg-purple-500 hover:bg-purple-600
                       text-white px-6 py-3 rounded-xl font-semibold transition"
          >
            Go to Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50
                    py-10 px-4">
      <div className="max-w-lg mx-auto">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🏢</div>
          <h1 className="text-2xl font-bold text-gray-800">NGO Registration</h1>
          <p className="text-gray-500 text-sm mt-1">
            Register your rescue organisation
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className={`flex items-center gap-2 text-sm font-medium
            ${step === 1 ? 'text-purple-600' : 'text-green-500'}`}>
            <span className={`w-7 h-7 rounded-full flex items-center
                              justify-center text-xs font-bold
              ${step > 1 ? 'bg-green-500 text-white' : 'bg-purple-500 text-white'}`}>
              {step > 1 ? '✓' : '1'}
            </span>
            Account
          </div>

          <div className={`h-0.5 w-12 rounded
            ${step > 1 ? 'bg-green-400' : 'bg-gray-200'}`} />

          <div className={`flex items-center gap-2 text-sm font-medium
            ${step === 2 ? 'text-purple-600' : 'text-gray-400'}`}>
            <span className={`w-7 h-7 rounded-full flex items-center
                              justify-center text-xs font-bold
              ${step === 2 ? 'bg-purple-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
              2
            </span>
            Organisation
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-purple-100 p-8">

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600
                            text-sm px-4 py-3 rounded-xl mb-5">
              ⚠️ {error}
            </div>
          )}

          {/* Step 1: Account */}
          {step === 1 && (
            <form onSubmit={handleStep1} className="space-y-4">
              <h2 className="text-lg font-bold text-gray-800 mb-4">
                Create Your Account
              </h2>

              {[
                { label: 'Your Full Name',  value: fullName,        set: setFullName,        type: 'text',     placeholder: 'Contact person name' },
                { label: 'Email Address',   value: email,           set: setEmail,           type: 'email',    placeholder: 'org@example.com' },
                { label: 'Password',        value: password,        set: setPassword,        type: 'password', placeholder: 'Minimum 6 characters' },
                { label: 'Confirm Password',value: confirmPassword, set: setConfirmPassword, type: 'password', placeholder: 'Repeat password' },
              ].map((field) => (
                <div key={field.label}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {field.label}
                  </label>
                  <input
                    type={field.type}
                    value={field.value}
                    onChange={(e) => field.set(e.target.value)}
                    placeholder={field.placeholder}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200
                               focus:outline-none focus:ring-2 focus:ring-purple-400
                               transition text-sm"
                  />
                </div>
              ))}

              <button
                type="submit"
                className="w-full bg-purple-500 hover:bg-purple-600 text-white
                           font-semibold py-3 rounded-xl transition mt-2"
              >
                Next: Organisation Details →
              </button>
            </form>
          )}

          {/* Step 2: NGO details */}
          {step === 2 && (
            <form onSubmit={handleStep2} className="space-y-4">
              <h2 className="text-lg font-bold text-gray-800 mb-4">
                Organisation Details
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Organisation Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="e.g. Mumbai Cat Rescue Trust"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200
                             focus:outline-none focus:ring-2 focus:ring-purple-400
                             transition text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  What does your organisation do? <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={orgDescription}
                  onChange={(e) => setOrgDescription(e.target.value)}
                  placeholder="Describe your rescue work, experience, how many cats helped..."
                  required
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200
                             focus:outline-none focus:ring-2 focus:ring-purple-400
                             transition text-sm resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Mumbai"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200
                               focus:outline-none focus:ring-2 focus:ring-purple-400
                               transition text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Phone <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200
                               focus:outline-none focus:ring-2 focus:ring-purple-400
                               transition text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Website
                  <span className="text-gray-400 font-normal ml-1">(optional)</span>
                </label>
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://yourorg.org"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200
                             focus:outline-none focus:ring-2 focus:ring-purple-400
                             transition text-sm"
                />
              </div>

              <div className="bg-purple-50 border border-purple-200
                              rounded-xl p-3 text-xs text-purple-700">
                🔍 Our team reviews your details within 24–48 hours before
                granting NGO access.
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 border border-gray-200 text-gray-600
                             hover:bg-gray-50 py-3 rounded-xl font-semibold
                             transition text-sm"
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-purple-500 hover:bg-purple-600
                             disabled:bg-purple-300 text-white font-semibold
                             py-3 rounded-xl transition flex items-center
                             justify-center gap-2 text-sm"
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white
                                        border-t-transparent rounded-full
                                        animate-spin inline-block" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Application 🏢'
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        <p className="text-center text-gray-400 text-sm mt-6">
          Not an NGO?{' '}
          <Link href="/signup" className="text-orange-500 font-semibold hover:underline">
            Regular signup here
          </Link>
        </p>
      </div>
    </div>
  )
}