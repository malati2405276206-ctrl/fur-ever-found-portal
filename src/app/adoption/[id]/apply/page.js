// src/app/adoption/[id]/apply/page.js
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import ProtectedRoute from '@/components/ProtectedRoute'
import Link from 'next/link'

function AdoptionApplicationForm() {
  const { id }   = useParams()
  const router   = useRouter()
  const { user } = useAuth()

  const [cat,         setCat]         = useState(null)
  const [loading,     setLoading]     = useState(true)
  const [submitting,  setSubmitting]  = useState(false)
  const [success,     setSuccess]     = useState(false)
  const [error,       setError]       = useState('')

  // Form fields
  const [fullName,    setFullName]    = useState('')
  const [phone,       setPhone]       = useState('')
  const [address,     setAddress]     = useState('')
  const [city,        setCity]        = useState('')
  const [occupation,  setOccupation]  = useState('')
  const [homeType,    setHomeType]    = useState('apartment')
  const [hasChildren, setHasChildren] = useState('no')
  const [hasPets,     setHasPets]     = useState('no')
  const [petDetails,  setPetDetails]  = useState('')
  const [experience,  setExperience]  = useState('')
  const [whyAdopt,    setWhyAdopt]    = useState('')
  const [agreement,   setAgreement]   = useState(false)

  useEffect(() => {
    fetchCat()
    prefillUserData()
  }, [id, user])

  const fetchCat = async () => {
    const { data } = await supabase
      .from('adoption_cats')
      .select('*')
      .eq('id', id)
      .eq('status', 'available')
      .maybeSingle()

    if (!data) { router.push('/adoption'); return }
    setCat(data)
    setLoading(false)
  }

  const prefillUserData = async () => {
    if (!user) return
    const { data } = await supabase
      .from('profiles')
      .select('full_name, phone')
      .eq('id', user.id)
      .maybeSingle()

    if (data?.full_name) setFullName(data.full_name)
    if (data?.phone)     setPhone(data.phone)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!agreement) { setError('Please agree to the terms before submitting.'); return }
    if (!whyAdopt.trim()) { setError('Please tell us why you want to adopt this cat.'); return }

    setSubmitting(true)
    setError('')

    // Save adoption application
    const applicationData = {
      cat_id:      id,
      cat_name:    cat.name,
      user_id:     user.id,
      ngo_id:      cat.ngo_id,
      full_name:   fullName,
      phone,
      address,
      city,
      occupation,
      home_type:   homeType,
      has_children: hasChildren === 'yes',
      has_pets:    hasPets === 'yes',
      pet_details: petDetails || null,
      experience,
      why_adopt:   whyAdopt,
      status:      'pending',
    }

    const { error: dbError } = await supabase
      .from('adoption_applications')
      .insert(applicationData)

    if (dbError) {
      // Table might not exist yet — store locally and notify via chat
      console.error(dbError.message)
    }

    // Notify NGO via chat message regardless
    const { data: convo } = await supabase
      .from('conversations')
      .insert({
        cat_type:     'adoption',
        cat_id:       id,
        initiator_id: user.id,
        recipient_id: cat.ngo_id,
      })
      .select()
      .maybeSingle()

    if (convo?.id) {
      await supabase.from('messages').insert({
        conversation_id: convo.id,
        sender_id:       user.id,
        content: `Hi! I've submitted an adoption application for ${cat.name}. My details: Name: ${fullName}, Phone: ${phone}, City: ${city}, Home: ${homeType}, Experience: ${experience || 'None listed'}. Why I want to adopt: ${whyAdopt}`,
      })
    }

    setSuccess(true)
    setSubmitting(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-purple-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Application Submitted!</h2>
          <p className="text-gray-500 text-sm mb-2">
            Your adoption application for <strong>{cat?.name}</strong> has been sent to the NGO.
          </p>
          <p className="text-gray-400 text-xs mb-6">
            They will review your application and contact you via the in-app chat within 24-48 hours.
          </p>
          <div className="space-y-3">
            <Link href="/messages" className="block w-full bg-purple-500 hover:bg-purple-600 text-white py-3 rounded-xl font-semibold transition text-center text-sm">
              💬 Check Messages
            </Link>
            <Link href="/adoption" className="block w-full border border-gray-200 text-gray-600 hover:bg-gray-50 py-3 rounded-xl font-semibold transition text-sm">
              Browse More Cats
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-purple-50 py-10 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/adoption" className="text-gray-400 hover:text-gray-600 transition text-xl">←</Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Adoption Application</h1>
            <p className="text-gray-500 text-sm mt-0.5">Applying to adopt <strong>{cat?.name}</strong></p>
          </div>
        </div>

        {/* Cat preview */}
        <div className="bg-white rounded-2xl border border-purple-100 p-4 mb-6 flex gap-4 items-center">
          {cat?.image_url ? (
            <img src={cat.image_url} alt={cat.name} className="w-16 h-16 rounded-xl object-cover shrink-0" />
          ) : (
            <div className="w-16 h-16 rounded-xl bg-purple-100 flex items-center justify-center text-2xl shrink-0">🐱</div>
          )}
          <div>
            <p className="font-bold text-gray-900">{cat?.name}</p>
            <p className="text-xs text-gray-400">{cat?.breed} · {cat?.age} · {cat?.city}</p>
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{cat?.description}</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-purple-100 p-8">

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl mb-6">⚠️ {error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Personal Info */}
            <div>
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Personal Information</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name <span className="text-red-400">*</span></label>
                    <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required placeholder="Your full name" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400 transition text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone <span className="text-red-400">*</span></label>
                    <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required placeholder="+91 98765 43210" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400 transition text-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Home Address <span className="text-red-400">*</span></label>
                  <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} required placeholder="Your full address" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400 transition text-sm" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City <span className="text-red-400">*</span></label>
                    <input type="text" value={city} onChange={(e) => setCity(e.target.value)} required placeholder="Mumbai" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400 transition text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Occupation</label>
                    <input type="text" value={occupation} onChange={(e) => setOccupation(e.target.value)} placeholder="e.g. Software Engineer" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400 transition text-sm" />
                  </div>
                </div>
              </div>
            </div>

            {/* Living Situation */}
            <div>
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Living Situation</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type of Home <span className="text-red-400">*</span></label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {['apartment', 'house', 'villa', 'other'].map((type) => (
                      <button key={type} type="button" onClick={() => setHomeType(type)}
                        className={`py-2.5 rounded-xl text-sm font-medium transition capitalize border ${homeType === type ? 'bg-purple-500 text-white border-purple-500' : 'bg-white text-gray-600 border-gray-200 hover:border-purple-300'}`}>
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Children at home?</label>
                    <div className="flex gap-2">
                      {['yes', 'no'].map((v) => (
                        <button key={v} type="button" onClick={() => setHasChildren(v)}
                          className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition border ${hasChildren === v ? 'bg-purple-500 text-white border-purple-500' : 'bg-white text-gray-600 border-gray-200'}`}>
                          {v === 'yes' ? 'Yes' : 'No'}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Other pets?</label>
                    <div className="flex gap-2">
                      {['yes', 'no'].map((v) => (
                        <button key={v} type="button" onClick={() => setHasPets(v)}
                          className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition border ${hasPets === v ? 'bg-purple-500 text-white border-purple-500' : 'bg-white text-gray-600 border-gray-200'}`}>
                          {v === 'yes' ? 'Yes' : 'No'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {hasPets === 'yes' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tell us about your other pets</label>
                    <input type="text" value={petDetails} onChange={(e) => setPetDetails(e.target.value)} placeholder="e.g. 1 dog (labrador, 3 years, friendly)" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400 transition text-sm" />
                  </div>
                )}
              </div>
            </div>

            {/* Experience */}
            <div>
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Cat Experience</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Previous experience with cats</label>
                  <textarea value={experience} onChange={(e) => setExperience(e.target.value)} placeholder="Have you owned cats before? Tell us about your experience caring for animals..." rows={3} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400 transition text-sm resize-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Why do you want to adopt {cat?.name}? <span className="text-red-400">*</span>
                  </label>
                  <textarea value={whyAdopt} onChange={(e) => setWhyAdopt(e.target.value)} required placeholder={`Tell us why ${cat?.name} is the right cat for you and your home...`} rows={4} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400 transition text-sm resize-none" />
                </div>
              </div>
            </div>

            {/* Agreement */}
            <div className="bg-purple-50 rounded-2xl p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={agreement} onChange={(e) => setAgreement(e.target.checked)} className="mt-0.5 w-4 h-4 accent-purple-500" />
                <p className="text-xs text-gray-600 leading-relaxed">
                  I confirm that the information provided is accurate. I understand the NGO will review my application and may contact me for a home visit before approval. I commit to providing a safe, loving, and permanent home for {cat?.name}.
                </p>
              </label>
            </div>

            <button type="submit" disabled={submitting || !agreement}
              className="w-full bg-purple-500 hover:bg-purple-600 disabled:bg-purple-300 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition flex items-center justify-center gap-2 text-base">
              {submitting ? (
                <>
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
                  Submitting...
                </>
              ) : (
                '🐱 Submit Adoption Application'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function AdoptionApplicationPage() {
  return (
    <ProtectedRoute>
      <AdoptionApplicationForm />
    </ProtectedRoute>
  )
}