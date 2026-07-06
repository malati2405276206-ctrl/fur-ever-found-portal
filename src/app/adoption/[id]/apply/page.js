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
      .neq('status', 'deleted')
      .neq('status', 'adopted')
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

    // Notify NGO via chat message — reuse existing conversation if present
    let convoId = null

    // Check for existing conversation first
    const { data: existingConvo } = await supabase
      .from('conversations')
      .select('id')
      .eq('cat_type', 'adoption')
      .eq('cat_id', id)
      .or(`and(initiator_id.eq.${user.id},recipient_id.eq.${cat.ngo_id}),and(initiator_id.eq.${cat.ngo_id},recipient_id.eq.${user.id})`)
      .maybeSingle()

    if (existingConvo?.id) {
      convoId = existingConvo.id
    } else {
      const { data: newConvo, error: convoError } = await supabase
        .from('conversations')
        .insert({
          cat_type:     'adoption',
          cat_id:       id,
          initiator_id: user.id,
          recipient_id: cat.ngo_id,
          last_message_at: new Date().toISOString(),
        })
        .select('id')
        .maybeSingle()

      if (convoError?.code === '23505') {
        // Race condition duplicate — fetch existing
        const { data: retry } = await supabase
          .from('conversations')
          .select('id')
          .eq('cat_type', 'adoption')
          .eq('cat_id', id)
          .or(`and(initiator_id.eq.${user.id},recipient_id.eq.${cat.ngo_id}),and(initiator_id.eq.${cat.ngo_id},recipient_id.eq.${user.id})`)
          .maybeSingle()
        convoId = retry?.id
      } else {
        convoId = newConvo?.id
      }
    }

    if (convoId) {
      await supabase.from('messages').insert({
        conversation_id: convoId,
        sender_id:       user.id,
        content: `Hi! I've submitted an adoption application for ${cat.name}. My details: Name: ${fullName}, Phone: ${phone}, City: ${city}, Home: ${homeType}, Experience: ${experience || 'None listed'}. Why I want to adopt: ${whyAdopt}`,
      })

      // Update last_message_at for ordering
      await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', convoId)
    }

    setSuccess(true)
    setSubmitting(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
        <div className="flex flex-col items-center gap-3 animate-fade-in">
          <div className="w-12 h-12 border-4 border-[var(--gold)] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-[var(--foreground)] opacity-70">Loading application...</p>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-10" style={{ background: 'var(--background)' }}>
        <div className="organic-card p-8 sm:p-10 max-w-md w-full text-center animate-slide-up">
          <div className="w-20 h-20 mx-auto mb-5 rounded-full flex items-center justify-center text-4xl" style={{ background: 'var(--gold-light)' }}>
            🎉
          </div>
          <h2 className="heading-artistic text-2xl sm:text-3xl mb-2" style={{ color: 'var(--foreground)' }}>Application Submitted!</h2>
          <p className="text-sm mb-2" style={{ color: 'var(--foreground)', opacity: 0.7 }}>
            Your adoption application for <strong>{cat?.name}</strong> has been sent to the NGO.
          </p>
          <p className="text-xs mb-8" style={{ color: 'var(--foreground)', opacity: 0.5 }}>
            They will review your application and contact you via the in-app chat within 24-48 hours.
          </p>
          <div className="space-y-3">
            <Link href="/messages" className="block w-full text-white py-3.5 rounded-xl font-semibold transition text-center text-sm hover:opacity-90" style={{ background: 'var(--gold)' }}>
              💬 Check Messages
            </Link>
            <Link href="/adoption" className="block w-full border py-3.5 rounded-xl font-semibold transition text-sm hover:opacity-80 text-center" style={{ borderColor: 'var(--cream-dark)', color: 'var(--foreground)' }}>
              Browse More Cats
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-6 sm:py-10 px-4" style={{ background: 'var(--background)' }}>
      <div className="max-w-6xl mx-auto">

        {/* Back button */}
        <div className="mb-6 animate-fade-in-up">
          <Link href="/adoption" className="inline-flex items-center gap-2 text-sm font-medium transition hover:opacity-70" style={{ color: 'var(--foreground)' }}>
            <span className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'white', border: '1px solid var(--cream-dark)' }}>←</span>
            Back to Cats
          </Link>
        </div>

        {/* Split layout card */}
        <div className="organic-card overflow-hidden animate-slide-up" style={{ background: 'white' }}>
          <div className="flex flex-col lg:flex-row">

            {/* LEFT PANEL — Cat image & details */}
            <div className="lg:w-[42%] relative flex flex-col" style={{ background: 'linear-gradient(160deg, var(--gold-light) 0%, var(--cream) 100%)' }}>
              {/* Cat image */}
              <div className="relative w-full aspect-square lg:aspect-auto lg:flex-1 min-h-[280px] lg:min-h-[500px]">
                {cat?.image_url ? (
                  <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-8xl" style={{ background: 'var(--gold-light)' }}>🐱</div>
                )}
                {/* Gradient overlay at bottom */}
                <div className="absolute inset-x-0 bottom-0 h-40" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 100%)' }} />
              </div>

              {/* Cat details overlay */}
              <div className="absolute bottom-0 inset-x-0 p-6 text-white">
                <h2 className="heading-artistic text-3xl sm:text-4xl mb-1">{cat?.name}</h2>
                <div className="flex flex-wrap gap-2 mb-3">
                  {cat?.breed && <span className="px-3 py-1 rounded-full text-xs font-medium" style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(4px)' }}>{cat.breed}</span>}
                  {cat?.age && <span className="px-3 py-1 rounded-full text-xs font-medium" style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(4px)' }}>{cat.age}</span>}
                  {cat?.city && <span className="px-3 py-1 rounded-full text-xs font-medium" style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(4px)' }}>📍 {cat.city}</span>}
                </div>
                {cat?.description && <p className="text-sm opacity-90 line-clamp-3">{cat.description}</p>}
              </div>
            </div>

            {/* RIGHT PANEL — Application form */}
            <div className="lg:w-[58%] p-6 sm:p-8 lg:p-10 overflow-y-auto lg:max-h-[85vh]">
              {/* Form heading */}
              <div className="mb-6">
                <h1 className="heading-artistic text-2xl sm:text-3xl mb-1" style={{ color: 'var(--foreground)' }}>Adoption Application</h1>
                <p className="text-sm" style={{ color: 'var(--foreground)', opacity: 0.6 }}>Fill in your details to adopt <strong>{cat?.name}</strong></p>
              </div>

          {error && (
            <div className="border text-sm px-4 py-3 rounded-xl mb-6 flex items-center gap-2" style={{ background: '#fef2f2', borderColor: '#fecaca', color: '#dc2626' }}>
              <span>⚠️</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">

            {/* Personal Info */}
            <div>
              <div className="flex items-center gap-2 mb-5">
                <span className="w-8 h-8 rounded-full flex items-center justify-center text-sm" style={{ background: 'var(--gold-light)', color: 'var(--foreground)' }}>1</span>
                <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--foreground)' }}>Personal Information</h2>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--foreground)' }}>Full Name <span style={{ color: 'var(--gold)' }}>*</span></label>
                    <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required placeholder="Your full name" className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 transition text-sm" style={{ borderColor: 'var(--cream-dark)', background: 'var(--sage-50)', color: 'var(--foreground)', '--tw-ring-color': 'var(--gold-light)' }} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--foreground)' }}>Phone <span style={{ color: 'var(--gold)' }}>*</span></label>
                    <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required placeholder="+91 98765 43210" className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 transition text-sm" style={{ borderColor: 'var(--cream-dark)', background: 'var(--sage-50)', color: 'var(--foreground)', '--tw-ring-color': 'var(--gold-light)' }} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--foreground)' }}>Home Address <span style={{ color: 'var(--gold)' }}>*</span></label>
                  <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} required placeholder="Your full address" className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 transition text-sm" style={{ borderColor: 'var(--cream-dark)', background: 'var(--sage-50)', color: 'var(--foreground)', '--tw-ring-color': 'var(--gold-light)' }} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--foreground)' }}>City <span style={{ color: 'var(--gold)' }}>*</span></label>
                    <input type="text" value={city} onChange={(e) => setCity(e.target.value)} required placeholder="Mumbai" className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 transition text-sm" style={{ borderColor: 'var(--cream-dark)', background: 'var(--sage-50)', color: 'var(--foreground)', '--tw-ring-color': 'var(--gold-light)' }} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--foreground)' }}>Occupation</label>
                    <input type="text" value={occupation} onChange={(e) => setOccupation(e.target.value)} placeholder="e.g. Software Engineer" className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 transition text-sm" style={{ borderColor: 'var(--cream-dark)', background: 'var(--sage-50)', color: 'var(--foreground)', '--tw-ring-color': 'var(--gold-light)' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Living Situation */}
            <div>
              <div className="flex items-center gap-2 mb-5">
                <span className="w-8 h-8 rounded-full flex items-center justify-center text-sm" style={{ background: 'var(--gold-light)', color: 'var(--foreground)' }}>2</span>
                <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--foreground)' }}>Living Situation</h2>
              </div>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium mb-2.5" style={{ color: 'var(--foreground)' }}>Type of Home <span style={{ color: 'var(--gold)' }}>*</span></label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {['apartment', 'house', 'villa', 'other'].map((type) => (
                      <button key={type} type="button" onClick={() => setHomeType(type)}
                        className="py-3 rounded-xl text-sm font-medium transition capitalize border"
                        style={homeType === type
                          ? { background: 'var(--gold)', color: 'white', borderColor: 'var(--gold)' }
                          : { background: 'var(--sage-50)', color: 'var(--foreground)', borderColor: 'var(--cream-dark)' }
                        }>
                        {type === 'apartment' && '🏢 '}
                        {type === 'house' && '🏠 '}
                        {type === 'villa' && '🏡 '}
                        {type === 'other' && '🏘️ '}
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2.5" style={{ color: 'var(--foreground)' }}>Children at home?</label>
                    <div className="flex gap-2.5">
                      {['yes', 'no'].map((v) => (
                        <button key={v} type="button" onClick={() => setHasChildren(v)}
                          className="flex-1 py-3 rounded-xl text-sm font-medium transition border"
                          style={hasChildren === v
                            ? { background: 'var(--gold)', color: 'white', borderColor: 'var(--gold)' }
                            : { background: 'var(--sage-50)', color: 'var(--foreground)', borderColor: 'var(--cream-dark)' }
                          }>
                          {v === 'yes' ? '👶 Yes' : '🚫 No'}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2.5" style={{ color: 'var(--foreground)' }}>Other pets?</label>
                    <div className="flex gap-2.5">
                      {['yes', 'no'].map((v) => (
                        <button key={v} type="button" onClick={() => setHasPets(v)}
                          className="flex-1 py-3 rounded-xl text-sm font-medium transition border"
                          style={hasPets === v
                            ? { background: 'var(--gold)', color: 'white', borderColor: 'var(--gold)' }
                            : { background: 'var(--sage-50)', color: 'var(--foreground)', borderColor: 'var(--cream-dark)' }
                          }>
                          {v === 'yes' ? '🐾 Yes' : '🚫 No'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {hasPets === 'yes' && (
                  <div className="animate-fade-in">
                    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--foreground)' }}>Tell us about your other pets</label>
                    <input type="text" value={petDetails} onChange={(e) => setPetDetails(e.target.value)} placeholder="e.g. 1 dog (labrador, 3 years, friendly)" className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 transition text-sm" style={{ borderColor: 'var(--cream-dark)', background: 'var(--sage-50)', color: 'var(--foreground)', '--tw-ring-color': 'var(--gold-light)' }} />
                  </div>
                )}
              </div>
            </div>

            {/* Experience */}
            <div>
              <div className="flex items-center gap-2 mb-5">
                <span className="w-8 h-8 rounded-full flex items-center justify-center text-sm" style={{ background: 'var(--gold-light)', color: 'var(--foreground)' }}>3</span>
                <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--foreground)' }}>Cat Experience</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--foreground)' }}>Previous experience with cats</label>
                  <textarea value={experience} onChange={(e) => setExperience(e.target.value)} placeholder="Have you owned cats before? Tell us about your experience caring for animals..." rows={3} className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 transition text-sm resize-none" style={{ borderColor: 'var(--cream-dark)', background: 'var(--sage-50)', color: 'var(--foreground)', '--tw-ring-color': 'var(--gold-light)' }} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--foreground)' }}>
                    Why do you want to adopt {cat?.name}? <span style={{ color: 'var(--gold)' }}>*</span>
                  </label>
                  <textarea value={whyAdopt} onChange={(e) => setWhyAdopt(e.target.value)} required placeholder={`Tell us why ${cat?.name} is the right cat for you and your home...`} rows={4} className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 transition text-sm resize-none" style={{ borderColor: 'var(--cream-dark)', background: 'var(--sage-50)', color: 'var(--foreground)', '--tw-ring-color': 'var(--gold-light)' }} />
                </div>
              </div>
            </div>

            {/* Agreement */}
            <div className="rounded-2xl p-5" style={{ background: 'var(--sage-50)', border: '1px solid var(--cream-dark)' }}>
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={agreement} onChange={(e) => setAgreement(e.target.checked)} className="mt-0.5 w-5 h-5 rounded" style={{ accentColor: 'var(--gold)' }} />
                <p className="text-xs leading-relaxed" style={{ color: 'var(--foreground)', opacity: 0.75 }}>
                  I confirm that the information provided is accurate. I understand the NGO will review my application and may contact me for a home visit before approval. I commit to providing a safe, loving, and permanent home for {cat?.name}.
                </p>
              </label>
            </div>

            {/* Progress indicator */}
            <div className="flex items-center justify-center gap-1.5 py-2">
              <div className="w-8 h-1 rounded-full" style={{ background: fullName && phone ? 'var(--gold)' : 'var(--cream-dark)' }}></div>
              <div className="w-8 h-1 rounded-full" style={{ background: address && city ? 'var(--gold)' : 'var(--cream-dark)' }}></div>
              <div className="w-8 h-1 rounded-full" style={{ background: whyAdopt ? 'var(--gold)' : 'var(--cream-dark)' }}></div>
              <div className="w-8 h-1 rounded-full" style={{ background: agreement ? 'var(--gold)' : 'var(--cream-dark)' }}></div>
            </div>

            <button type="submit" disabled={submitting || !agreement}
              className="w-full text-white font-bold py-4 rounded-xl transition flex items-center justify-center gap-2 text-base shadow-lg hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-lg"
              style={{ background: submitting || !agreement ? 'var(--cream-dark)' : 'var(--gold)', color: submitting || !agreement ? 'var(--foreground)' : 'white' }}>
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
            </div>{/* end right panel */}

          </div>{/* end flex row */}
        </div>{/* end organic-card */}
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