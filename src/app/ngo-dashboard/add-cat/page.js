// src/app/ngo-dashboard/add-cat/page.js
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useFormPersist, clearPersistedForm } from '@/hooks/useFormPersist'
import dynamic from 'next/dynamic'

const LocationSearch = dynamic(() => import('@/components/LocationSearch'), { ssr: false })

function AddCatForm() {
  const router = useRouter()

  // Persisted form fields
  const [name,        setName]        = useFormPersist('addcat_name',     '')
  const [age,         setAge]         = useFormPersist('addcat_age',      '')
  const [gender,      setGender]      = useFormPersist('addcat_gender',   'unknown')
  const [breed,       setBreed]       = useFormPersist('addcat_breed',    '')
  const [description, setDescription] = useFormPersist('addcat_desc',     '')
  const [storyline,   setStoryline]   = useFormPersist('addcat_storyline','')

  // Non-persisted
  const [city,         setCity]         = useState('')
  const [latitude,     setLatitude]     = useState(null)
  const [longitude,    setLongitude]    = useState(null)
  const [imageFile,    setImageFile]    = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState('')
  const [success,      setSuccess]      = useState(false)

  useEffect(() => {
    const prefill = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: ngo } = await supabase.from('ngo_profiles').select('city').eq('user_id', user.id).maybeSingle()
      if (ngo?.city) setCity(ngo.city)
    }
    prefill()
  }, [])

  const handleImageChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { setError('Please select an image file.'); return }
    if (file.size > 5 * 1024 * 1024) { setError('Image must be under 5MB.'); return }
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
    setError('')
  }

  const handleRemoveImage = () => { setImageFile(null); setImagePreview(null) }

  const clearForm = () => {
    clearPersistedForm(['addcat_name', 'addcat_age', 'addcat_gender', 'addcat_breed', 'addcat_desc', 'addcat_storyline'])
    setName(''); setAge(''); setGender('unknown'); setBreed('')
    setDescription(''); setStoryline(''); setCity('')
    setLatitude(null); setLongitude(null)
    setImageFile(null); setImagePreview(null); setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not logged in.')

      let imageUrl = null

      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop().toLowerCase()
        const fileName = `adoption_${user.id}_${Date.now()}.${fileExt}`
        const { error: uploadError } = await supabase.storage.from('cat-images').upload(fileName, imageFile)
        if (uploadError) throw uploadError
        const { data: urlData } = supabase.storage.from('cat-images').getPublicUrl(fileName)
        imageUrl = urlData.publicUrl
      }

      const { error: dbError } = await supabase.from('adoption_cats').insert({
        ngo_id:      user.id,
        name,
        age:         age   || null,
        gender,
        breed:       breed || null,
        city,
        description,
        storyline,
        image_url:   imageUrl,
        latitude:    latitude  || null,
        longitude:   longitude || null,
        status:      'available',
      })

      if (dbError) throw dbError

      clearForm()
      setSuccess(true)

    } catch (err) {
      setError(err.message || 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  // Steps for left sidebar
  const steps = [
    { label: 'Cat details', active: true },
    { label: 'Photo & info', active: !!(name || imagePreview) },
    { label: 'Location', active: !!city },
    { label: 'Rescue story', active: !!storyline },
    { label: 'Submit', active: false },
  ]

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: '#EBDDC5' }}>
        <div className="organic-card p-8 sm:p-10 max-w-md w-full text-center animate-fade-in-up relative overflow-hidden">
          <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: '#F3D58D' }}>
            <svg className="w-8 h-8" style={{ color: '#8A3B08' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="heading-artistic text-2xl sm:text-3xl mb-2" style={{ color: '#2E4365' }}>Cat Listed!</h2>
          <p className="text-sm mb-6" style={{ color: '#2E4365', opacity: 0.7 }}>
            <strong>{name || 'Your cat'}</strong> is now live on the adoption feed.
          </p>

          <div className="rounded-2xl p-5 mb-6 text-left" style={{ background: '#F3D58D' }}>
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#8A3B08' }}>What happens next</p>
            <div className="space-y-2.5">
              <div className="flex gap-2 text-sm" style={{ color: '#2E4365' }}><span className="font-bold">•</span><span>Your cat appears on the Adoption feed</span></div>
              <div className="flex gap-2 text-sm" style={{ color: '#2E4365' }}><span className="font-bold">•</span><span>Potential adopters can view their profile</span></div>
              <div className="flex gap-2 text-sm" style={{ color: '#2E4365' }}><span className="font-bold">•</span><span>Mark as adopted from your dashboard when they find a home</span></div>
              <div className="flex gap-2 text-sm" style={{ color: '#2E4365' }}><span className="font-bold">•</span><span>Their rescue story will go live on the Stories page</span></div>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => router.push('/adoption')}
              className="w-full font-bold py-3.5 rounded-full transition-all hover:scale-[1.02] hover:opacity-90 text-sm"
              style={{ background: '#7A9E7E', color: 'white' }}
            >
              View Adoption Feed
            </button>
            <button
              onClick={() => { setSuccess(false); clearForm() }}
              className="w-full border-2 font-bold py-3.5 rounded-full transition-all hover:scale-[1.02] text-sm"
              style={{ borderColor: '#7A9E7E', color: '#7A9E7E' }}
            >
              Add Another Cat
            </button>
            <button
              onClick={() => router.push('/ngo-dashboard')}
              className="w-full text-sm py-2 transition hover:opacity-70"
              style={{ color: '#2E4365' }}
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: '#EBDDC5' }}>
      <div className="max-w-6xl mx-auto min-h-screen flex flex-col lg:flex-row lg:rounded-3xl lg:overflow-hidden lg:my-6 lg:mx-6 xl:mx-auto lg:shadow-2xl lg:min-h-[calc(100vh-3rem)]">

        {/* ── Left Sidebar (purple-toned panel) ── */}
        <div className="relative lg:w-[340px] xl:w-[380px] flex-shrink-0 flex flex-col justify-between p-8 lg:p-10 overflow-hidden" style={{ background: '#7A9E7E' }}>
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-12">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(243, 213, 141, 0.2)', border: '2px solid rgba(243, 213, 141, 0.4)' }}>
                <img src="/icon-emoji/cat-face.png" alt="" width={60} height={60} className="inline-block" />
              </div>
              <span className="text-lg font-bold" style={{ color: '#F3D58D' }}>Add Adoption Cat</span>
            </div>

            {/* Stepper */}
            <div className="space-y-0">
              {steps.map((step, i) => (
                <div key={step.label} className="flex items-start gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all" style={{
                      borderColor: step.active ? '#F3D58D' : 'rgba(255,255,255,0.25)',
                      background: step.active ? '#F3D58D' : 'transparent',
                    }}>
                      {step.active && <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#7A9E7E' }} />}
                    </div>
                    {i < steps.length - 1 && (
                      <div className="w-px h-8" style={{ background: 'rgba(255,255,255,0.15)' }} />
                    )}
                  </div>
                  <span className="text-sm pt-px transition-all" style={{ color: step.active ? '#F3D58D' : 'rgba(255,255,255,0.5)', fontWeight: step.active ? 600 : 400 }}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Decorative at bottom */}
          <div className="hidden lg:block mt-auto pt-10">
            <div className="relative">
              <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full opacity-10" style={{ background: '#F3D58D' }} />
              <div className="relative flex justify-center">
                <span className="opacity-40"><img src="/icon-emoji/cat-paw.png" alt="" width={60} height={60} /></span>
              </div>
            </div>
            {(name || description || storyline) && (
              <button onClick={clearForm} className="mt-6 text-sm underline underline-offset-4 opacity-70 hover:opacity-100 transition" style={{ color: '#F3D58D' }}>
                Clear and start over
              </button>
            )}
          </div>
        </div>

        {/* ── Right Panel (form area) ── */}
        <div className="flex-1 flex flex-col" style={{ background: '#faf5ee' }}>
          {/* Scrollable form content */}
          <div className="flex-1 overflow-y-auto px-6 sm:px-10 lg:px-12 py-8 lg:py-10">

            {/* Title */}
            <h1 className="heading-artistic text-2xl sm:text-3xl mb-2" style={{ color: '#2E4365' }}>
              Tell us about this cat.
            </h1>
            <p className="text-sm mb-8" style={{ color: '#2E4365', opacity: 0.6 }}>
              Fill in the details to list this cat for adoption.
            </p>

            {/* Draft saved indicator */}
            {(name || description || storyline) && (
              <div className="flex justify-between items-center px-4 py-2.5 rounded-xl mb-6 text-xs" style={{ background: '#F3D58D', color: '#8A3B08' }}>
                <span className="font-medium">Draft saved automatically</span>
                <button onClick={clearForm} className="font-bold hover:underline">Clear</button>
              </div>
            )}

            {error && (
              <div className="px-4 py-3 rounded-xl mb-6 text-sm font-medium" style={{ background: '#FEE2E2', color: '#991B1B', border: '1px solid #FECACA' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Name + Photo row */}
              <div className="flex flex-col sm:flex-row gap-4 items-start">
                <div className="flex-1 space-y-1.5 w-full">
                  <label className="block text-sm font-semibold" style={{ color: '#2E4365' }}>
                    Cat&apos;s Name <span style={{ color: '#7A9E7E' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Luna, Mochi, Simba"
                    required
                    className="w-full px-4 py-3 rounded-lg border focus:outline-none transition text-sm"
                    style={{ borderColor: '#ddd', background: 'white', color: '#2E4365' }}
                    onFocus={(e) => e.target.style.borderColor = '#7A9E7E'}
                    onBlur={(e) => e.target.style.borderColor = '#ddd'}
                  />
                </div>
                <div className="flex-shrink-0 pt-7">
                  <label className="flex items-center gap-2 px-4 py-3 rounded-lg border transition text-sm font-medium" style={{ borderColor: '#ddd', color: '#2E4365', background: 'white' }}>
                    <svg className="w-5 h-5 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Upload a photo
                    <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                  </label>
                </div>
              </div>

              {/* Image preview */}
              {imagePreview && (
                <div className="relative">
                  <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover rounded-xl border" style={{ borderColor: '#F3D58D' }} />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute top-2 right-2 text-white text-xs px-3 py-1.5 rounded-full font-bold transition hover:opacity-90"
                    style={{ background: '#7A9E7E' }}
                  >
                    Remove
                  </button>
                </div>
              )}

              {/* Age + Gender */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold" style={{ color: '#2E4365' }}>
                    Age <span className="font-normal opacity-50">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="e.g. 2 years, 4 months"
                    className="w-full px-4 py-3 rounded-lg border focus:outline-none transition text-sm"
                    style={{ borderColor: '#ddd', background: 'white', color: '#2E4365' }}
                    onFocus={(e) => e.target.style.borderColor = '#7A9E7E'}
                    onBlur={(e) => e.target.style.borderColor = '#ddd'}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold" style={{ color: '#2E4365' }}>Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border focus:outline-none transition text-sm"
                    style={{ borderColor: '#ddd', background: 'white', color: '#2E4365' }}
                    onFocus={(e) => e.target.style.borderColor = '#7A9E7E'}
                    onBlur={(e) => e.target.style.borderColor = '#ddd'}
                  >
                    <option value="unknown">Unknown</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
              </div>

              {/* Breed */}
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold" style={{ color: '#2E4365' }}>
                  Breed <span className="font-normal opacity-50">(optional)</span>
                </label>
                <input
                  type="text"
                  value={breed}
                  onChange={(e) => setBreed(e.target.value)}
                  placeholder="e.g. Tabby, Persian, Siamese"
                  className="w-full px-4 py-3 rounded-lg border focus:outline-none transition text-sm"
                  style={{ borderColor: '#ddd', background: 'white', color: '#2E4365' }}
                  onFocus={(e) => e.target.style.borderColor = '#7A9E7E'}
                  onBlur={(e) => e.target.style.borderColor = '#ddd'}
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold" style={{ color: '#2E4365' }}>
                  Description <span style={{ color: '#7A9E7E' }}>*</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Personality, behaviour, vaccinated?, neutered?, good with kids/other pets..."
                  required
                  rows={3}
                  className="w-full px-4 py-3 rounded-lg border focus:outline-none transition text-sm resize-none"
                  style={{ borderColor: '#ddd', background: 'white', color: '#2E4365' }}
                  onFocus={(e) => e.target.style.borderColor = '#7A9E7E'}
                  onBlur={(e) => e.target.style.borderColor = '#ddd'}
                />
              </div>

              {/* Location */}
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold" style={{ color: '#2E4365' }}>
                  Location
                </label>
                <LocationSearch
                  location={city}
                  lat={latitude}
                  lng={longitude}
                  onLocationChange={(text, newLat, newLng) => {
                    setCity(text)
                    setLatitude(newLat || null)
                    setLongitude(newLng || null)
                  }}
                />
              </div>

              {/* Rescue Storyline */}
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold" style={{ color: '#2E4365' }}>
                  Rescue Story <span style={{ color: '#7A9E7E' }}>*</span>
                </label>
                <p className="text-xs" style={{ color: '#2E4365', opacity: 0.5 }}>
                  How you found them, their recovery. This goes live on Stories page once adopted.
                </p>
                <textarea
                  value={storyline}
                  onChange={(e) => setStoryline(e.target.value)}
                  placeholder="We found Luna shivering under a car during the monsoon rains..."
                  required
                  rows={5}
                  className="w-full px-4 py-3 rounded-lg border focus:outline-none transition text-sm resize-none"
                  style={{ borderColor: '#ddd', background: 'white', color: '#2E4365' }}
                  onFocus={(e) => e.target.style.borderColor = '#7A9E7E'}
                  onBlur={(e) => e.target.style.borderColor = '#ddd'}
                />
                <p className="text-xs text-right" style={{ color: '#2E4365', opacity: 0.4 }}>{storyline.length} characters</p>
              </div>

            </form>
          </div>

          {/* Bottom action bar */}
          <div className="flex-shrink-0 px-6 sm:px-10 lg:px-12 py-5 border-t flex items-center justify-between" style={{ borderColor: '#E5E7EB', background: 'white' }}>
            <button
              type="button"
              onClick={() => router.push('/ngo-dashboard')}
              className="px-6 py-2.5 rounded-full border-2 text-sm font-semibold transition hover:opacity-80"
              style={{ borderColor: '#2E4365', color: '#2E4365' }}
            >
              Back
            </button>
            <button
              type="submit"
              disabled={loading}
              onClick={handleSubmit}
              className="px-8 py-2.5 rounded-full text-sm font-bold transition-all hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ background: '#7A9E7E', color: 'white' }}
            >
              {loading ? 'Listing...' : 'List for Adoption'}
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}

export default function AddCatPage() {
  return (
    <ProtectedRoute requiredRole="ngo">
      <AddCatForm />
    </ProtectedRoute>
  )
}
