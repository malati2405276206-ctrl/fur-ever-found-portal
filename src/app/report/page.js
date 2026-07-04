// src/app/report/page.js
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useFormPersist, clearPersistedForm } from '@/hooks/useFormPersist'
import { sanitizeForm } from '@/lib/sanitize'
import { checkRateLimit } from '@/lib/rateLimit'
import dynamic from 'next/dynamic'

const LocationSearch = dynamic(() => import('@/components/LocationSearch'), { ssr: false })

function ReportForm() {
  const router = useRouter()
  const { user } = useAuth()

  // Persisted form fields
  const [reportType,    setReportType]    = useFormPersist('report_type',    'lost')
  const [catName,       setCatName]       = useFormPersist('report_name',    '')
  const [description,   setDescription]   = useFormPersist('report_desc',    '')
  const [contactEmail,  setContactEmail]  = useFormPersist('report_email',   '')
  const [contactPhone,  setContactPhone]  = useFormPersist('report_phone',   '')

  // Non-persisted states
  const [location,     setLocation]     = useState('')
  const [latitude,     setLatitude]     = useState(null)
  const [longitude,    setLongitude]    = useState(null)
  const [imageFile,    setImageFile]    = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState('')
  const [success,      setSuccess]      = useState(false)

  useEffect(() => {
    if (user?.email && !contactEmail) {
      setContactEmail(user.email)
    }
  }, [user])

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
    clearPersistedForm(['report_type', 'report_name', 'report_desc', 'report_email', 'report_phone'])
    setCatName('')
    setDescription('')
    setContactPhone('')
    setLocation('')
    setLatitude(null)
    setLongitude(null)
    setImageFile(null)
    setImagePreview(null)
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!user) return

    const { allowed, message } = checkRateLimit('report')
    if (!allowed) { setError(message); return }

    const clean = sanitizeForm({
      catName:      { value: catName,      type: 'text',  maxLength: 100  },
      description:  { value: description,  type: 'text',  maxLength: 1000 },
      location:     { value: location,     type: 'text',  maxLength: 200  },
      contactEmail: { value: contactEmail, type: 'email'                  },
      contactPhone: { value: contactPhone, type: 'phone'                  },
    })

    if (!clean.description || !clean.location || !clean.contactEmail) {
      setError('Please fill in all required fields.')
      return
    }

    setLoading(true)
    setError('')

    try {
      let imageUrl = null

      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop().toLowerCase()
        if (!['jpg', 'jpeg', 'png', 'webp'].includes(fileExt)) {
          setError('Only JPG, PNG or WebP images are allowed.')
          setLoading(false)
          return
        }
        const fileName = `${user.id}_${Date.now()}.${fileExt}`
        const { error: uploadError } = await supabase.storage.from('cat-images').upload(fileName, imageFile)
        if (uploadError) throw uploadError
        const { data: urlData } = supabase.storage.from('cat-images').getPublicUrl(fileName)
        imageUrl = urlData.publicUrl
      }

      if (reportType === 'lost') {
        const { error: dbError } = await supabase.from('lost_cats').insert({
          user_id:       user.id,
          name:          clean.catName,
          description:   clean.description,
          location:      clean.location,
          image_url:     imageUrl,
          contact_email: clean.contactEmail,
          contact_phone: clean.contactPhone || null,
          latitude:      latitude  || null,
          longitude:     longitude || null,
        })
        if (dbError) throw dbError
      } else {
        const { error: dbError } = await supabase.from('found_cats').insert({
          user_id:       user.id,
          description:   clean.description,
          location:      clean.location,
          image_url:     imageUrl,
          contact_email: clean.contactEmail,
          contact_phone: clean.contactPhone || null,
          latitude:      latitude  || null,
          longitude:     longitude || null,
        })
        if (dbError) throw dbError
      }

      clearForm()
      setSuccess(true)

    } catch (err) {
      setError(err.message || 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setSuccess(false)
    setReportType('lost')
    clearForm()
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: '#EBDDC5' }}>
        <div className="organic-card p-8 sm:p-10 max-w-md w-full text-center animate-fade-in-up relative overflow-hidden">
          <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: '#F3D58D' }}>
            <svg className="w-8 h-8" style={{ color: '#8A3B08' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="heading-artistic text-2xl sm:text-3xl mb-2" style={{ color: '#2E4365' }}>Report is Live!</h2>
          <p className="text-sm mb-6" style={{ color: '#2E4365', opacity: 0.7 }}>
            Your {reportType === 'lost' ? 'lost cat' : 'found cat'} report has been posted to our community.
          </p>

          <div className="rounded-2xl p-5 mb-6 text-left" style={{ background: '#F3D58D' }}>
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#8A3B08' }}>What happens next</p>
            <div className="space-y-2.5">
              {reportType === 'lost' ? (
                <>
                  <div className="flex gap-2 text-sm" style={{ color: '#2E4365' }}><span className="font-bold">•</span><span>Use AI Match to find potential matches from found cat reports</span></div>
                  <div className="flex gap-2 text-sm" style={{ color: '#2E4365' }}><span className="font-bold">•</span><span>You&apos;ll get notified if someone spots your cat</span></div>
                  <div className="flex gap-2 text-sm" style={{ color: '#2E4365' }}><span className="font-bold">•</span><span>Your cat appears on the community map</span></div>
                  <div className="flex gap-2 text-sm" style={{ color: '#2E4365' }}><span className="font-bold">•</span><span>Once found, mark it as Reunited from your profile</span></div>
                </>
              ) : (
                <>
                  <div className="flex gap-2 text-sm" style={{ color: '#2E4365' }}><span className="font-bold">•</span><span>The cat&apos;s owner will be notified if there&apos;s a match</span></div>
                  <div className="flex gap-2 text-sm" style={{ color: '#2E4365' }}><span className="font-bold">•</span><span>Owners can message you directly through the platform</span></div>
                  <div className="flex gap-2 text-sm" style={{ color: '#2E4365' }}><span className="font-bold">•</span><span>Your report appears on the map for owners nearby</span></div>
                </>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => router.push('/profile')}
              className="w-full text-white font-bold py-3.5 rounded-full transition-all hover:scale-[1.02] hover:opacity-90 text-sm"
              style={{ background: '#2E4365' }}
            >
              View My Reports
            </button>
            <button
              onClick={handleReset}
              className="w-full border-2 font-bold py-3.5 rounded-full transition-all hover:scale-[1.02] text-sm"
              style={{ borderColor: '#2E4365', color: '#2E4365' }}
            >
              Submit Another Report
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Steps for left sidebar
  const steps = [
    { label: 'Report type', active: true },
    { label: 'Cat details', active: !!(description || catName) },
    { label: 'Location', active: !!location },
    { label: 'Submit', active: false },
  ]

  return (
    <div className="min-h-screen" style={{ background: '#EBDDC5' }}>
      <div className="max-w-6xl mx-auto min-h-screen flex flex-col lg:flex-row lg:rounded-3xl lg:overflow-hidden lg:my-6 lg:mx-6 xl:mx-auto lg:shadow-2xl lg:min-h-[calc(100vh-3rem)]">

        {/* ── Left Sidebar (dark panel) ── */}
        <div className="relative lg:w-[340px] xl:w-[380px] flex-shrink-0 flex flex-col justify-between p-8 lg:p-10 overflow-hidden" style={{ background: '#2E4365' }}>
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-12">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(243, 213, 141, 0.2)', border: '2px solid rgba(243, 213, 141, 0.4)' }}>
                <svg className="w-5 h-5" style={{ color: '#F3D58D' }} fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
              <span className="text-lg font-bold" style={{ color: '#F3D58D' }}>Fur Ever Found</span>
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
                      {step.active && <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#2E4365' }} />}
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

          {/* Cat illustration at bottom */}
          <div className="hidden lg:block mt-auto pt-10">
            <div className="relative">
              <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full opacity-10" style={{ background: '#F3D58D' }} />
              <div className="relative flex justify-center">
                <svg className="w-28 h-28 opacity-60" style={{ color: '#F3D58D' }} fill="currentColor" viewBox="0 0 512 512">
                  <path d="M290.6 71.6c-9.5-17.9-34.7-17.9-44.2 0L206 144.4c-7.6 14.2-22.3 23.1-38.6 23.1H96c-20 0-32.3 21.7-22.1 39l40.3 68.4c7.6 12.9 7.6 29 0 41.9L73.9 385.4c-10.2 17.3 2.1 39 22.1 39h71.4c16.3 0 31 8.9 38.6 23.1l40.4 72.8c9.5 17.9 34.7 17.9 44.2 0l40.4-72.8c7.6-14.2 22.3-23.1 38.6-23.1H441c20 0 32.3-21.7 22.1-39l-40.3-68.4c-7.6-12.9-7.6-29 0-41.9l40.3-68.4c10.2-17.3-2.1-39-22.1-39h-71.4c-16.3 0-31-8.9-38.6-23.1L290.6 71.6z"/>
                </svg>
              </div>
            </div>
            {/* Save and exit link */}
            {(catName || description) && (
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
              {reportType === 'lost' ? 'Tell us about your lost cat.' : 'Tell us about the cat you found.'}
            </h1>
            <p className="text-sm mb-8" style={{ color: '#2E4365', opacity: 0.6 }}>
              Fill in the details below to alert the community.
            </p>

            {/* Draft saved indicator */}
            {(catName || description) && (
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

              {/* Report type toggle */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#2E4365' }}>Report Type</label>
                <div className="flex gap-0 rounded-full overflow-hidden border-2" style={{ borderColor: '#E5E7EB' }}>
                  <button
                    type="button"
                    onClick={() => setReportType('lost')}
                    className="flex-1 py-3 text-sm font-semibold transition-all"
                    style={reportType === 'lost'
                      ? { background: '#2E4365', color: '#F3D58D' }
                      : { background: 'white', color: '#2E4365' }
                    }
                  >
                    I Lost My Cat
                  </button>
                  <button
                    type="button"
                    onClick={() => setReportType('found')}
                    className="flex-1 py-3 text-sm font-semibold transition-all"
                    style={reportType === 'found'
                      ? { background: '#E59D2C', color: 'white' }
                      : { background: 'white', color: '#2E4365' }
                    }
                  >
                    I Found a Cat
                  </button>
                </div>
              </div>

              {/* Cat name + Photo upload in row (like reference) */}
              {reportType === 'lost' && (
                <div className="flex flex-col sm:flex-row gap-4 items-start">
                  <div className="flex-1 space-y-1.5 w-full">
                    <label className="block text-sm font-semibold" style={{ color: '#2E4365' }}>
                      Cat&apos;s Name <span style={{ color: '#E59D2C' }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={catName}
                      onChange={(e) => setCatName(e.target.value)}
                      placeholder="e.g. Whiskers, Luna, Mochi"
                      required={reportType === 'lost'}
                      className="w-full px-4 py-3 rounded-lg border focus:outline-none transition text-sm"
                      style={{ borderColor: '#ddd', background: 'white', color: '#2E4365' }}
                      onFocus={(e) => e.target.style.borderColor = '#E59D2C'}
                      onBlur={(e) => e.target.style.borderColor = '#ddd'}
                    />
                  </div>
                  {/* Upload photo button (compact, beside name) */}
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
              )}

              {/* Photo upload for found type */}
              {reportType === 'found' && (
                <div>
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: '#2E4365' }}>
                    Photo <span className="font-normal opacity-50">(recommended)</span>
                  </label>
                  <label className="inline-flex items-center gap-2 px-4 py-3 rounded-lg border transition text-sm font-medium" style={{ borderColor: '#ddd', color: '#2E4365', background: 'white' }}>
                    <svg className="w-5 h-5 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Upload a photo
                    <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                  </label>
                </div>
              )}

              {/* Image preview */}
              {imagePreview && (
                <div className="relative">
                  <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover rounded-xl border" style={{ borderColor: '#F3D58D' }} />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute top-2 right-2 text-white text-xs px-3 py-1.5 rounded-full font-bold transition hover:opacity-90"
                    style={{ background: '#2E4365' }}
                  >
                    Remove
                  </button>
                </div>
              )}

              {/* Description */}
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold" style={{ color: '#2E4365' }}>
                  Description <span style={{ color: '#E59D2C' }}>*</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={reportType === 'lost' ? 'Colour, size, breed, collar, any special marks...' : 'Colour, size, condition, any visible injuries, behaviour...'}
                  required
                  rows={3}
                  className="w-full px-4 py-3 rounded-lg border focus:outline-none transition text-sm resize-none"
                  style={{ borderColor: '#ddd', background: 'white', color: '#2E4365' }}
                  onFocus={(e) => e.target.style.borderColor = '#E59D2C'}
                  onBlur={(e) => e.target.style.borderColor = '#ddd'}
                />
              </div>

              {/* Location */}
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold" style={{ color: '#2E4365' }}>
                  Location <span style={{ color: '#E59D2C' }}>*</span>
                </label>
                <LocationSearch
                  location={location}
                  lat={latitude}
                  lng={longitude}
                  onLocationChange={(text, newLat, newLng) => {
                    setLocation(text)
                    setLatitude(newLat || null)
                    setLongitude(newLng || null)
                  }}
                />
              </div>

              {/* Contact info - side by side */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold" style={{ color: '#2E4365' }}>
                    Contact Email <span style={{ color: '#E59D2C' }}>*</span>
                  </label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-lg border focus:outline-none transition text-sm"
                    style={{ borderColor: '#ddd', background: 'white', color: '#2E4365' }}
                    onFocus={(e) => e.target.style.borderColor = '#E59D2C'}
                    onBlur={(e) => e.target.style.borderColor = '#ddd'}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold" style={{ color: '#2E4365' }}>
                    Phone <span className="font-normal opacity-50">(optional)</span>
                  </label>
                  <input
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-4 py-3 rounded-lg border focus:outline-none transition text-sm"
                    style={{ borderColor: '#ddd', background: 'white', color: '#2E4365' }}
                    onFocus={(e) => e.target.style.borderColor = '#E59D2C'}
                    onBlur={(e) => e.target.style.borderColor = '#ddd'}
                  />
                </div>
              </div>

            </form>
          </div>

          {/* Bottom action bar (fixed at bottom of right panel) */}
          <div className="flex-shrink-0 px-6 sm:px-10 lg:px-12 py-5 border-t flex items-center justify-between" style={{ borderColor: '#E5E7EB', background: 'white' }}>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2.5 rounded-full border-2 text-sm font-semibold transition hover:opacity-80"
              style={{ borderColor: '#2E4365', color: '#2E4365' }}
            >
              Back
            </button>
            <button
              type="submit"
              form="report-form"
              disabled={loading}
              onClick={handleSubmit}
              className="px-8 py-2.5 rounded-full text-sm font-bold transition-all hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed"
              style={reportType === 'lost'
                ? { background: '#2E4365', color: '#F3D58D' }
                : { background: '#E59D2C', color: 'white' }
              }
            >
              {loading ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}

export default function ReportPage() {
  return (
    <ProtectedRoute>
      <ReportForm />
    </ProtectedRoute>
  )
}
