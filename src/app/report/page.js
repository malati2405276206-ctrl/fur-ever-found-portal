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

// Dynamic import — prevents SSR issues with Leaflet
const LocationPicker = dynamic(() => import('@/components/LocationPicker'), { ssr: false })

function ReportForm() {
  const router = useRouter()
  const { user } = useAuth()

  // ── Persisted form fields ─────────────────────────
  // These survive tab switches, remounts, refreshes
  const [reportType,   setReportType]   = useFormPersist('report_type',   'lost')
  const [catName,      setCatName]      = useFormPersist('report_name',    '')
  const [description,  setDescription]  = useFormPersist('report_desc',    '')
  const [location,     setLocation]     = useFormPersist('report_location','')
  const [contactEmail, setContactEmail] = useFormPersist('report_email',   '')
  const [contactPhone, setContactPhone] = useFormPersist('report_phone',   '')

  // ── Non-persisted (image can't go in localStorage) ──
  const [imageFile,    setImageFile]    = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState('')
  const [success,      setSuccess]      = useState(false)
  const [latitude,  setLatitude]  = useState(null)
  const [longitude, setLongitude] = useState(null)  

  // Pre-fill email only if field is empty
  useEffect(() => {
    if (user?.email && !contactEmail) {
      setContactEmail(user.email)
    }
  }, [user])

  const handleImageChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be under 5MB.')
      return
    }
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
    setError('')
  }

  const handleRemoveImage = () => {
    setImageFile(null)
    setImagePreview(null)
  }

  // Clear all persisted form data after success
  const clearForm = () => {
    clearPersistedForm([
      'report_type', 'report_name', 'report_desc',
      'report_location', 'report_email', 'report_phone'
    ])
    setCatName('')
    setDescription('')
    setLocation('')
    setContactPhone('')
    setImageFile(null)
    setImagePreview(null)
    setError('')
  }

    // Replace handleSubmit with this:
    const handleSubmit = async (e) => {
      e.preventDefault()
      if (!user) return

      // Rate limit check
      const { allowed, message } = checkRateLimit(`report_${user.id}`, 5, 15 * 60 * 1000)
      if (!allowed) {
        setError(message)
        setLoading(false)
        return
      }

      setLoading(true)
      setError('')

      // Sanitize all inputs before saving
      const clean = sanitizeForm({
        catName:      { value: catName,      type: 'text',  maxLength: 100  },
        description:  { value: description,  type: 'text',  maxLength: 1000 },
        location:     { value: location,     type: 'text',  maxLength: 200  },
        contactEmail: { value: contactEmail, type: 'email'                  },
        contactPhone: { value: contactPhone, type: 'phone'                  },
      })

      // Validate required fields after sanitization
      if (!clean.description || !clean.location || !clean.contactEmail) {
        setError('Please fill in all required fields.')
        setLoading(false)
        return
      }

      try {
        let imageUrl = null

        if (imageFile) {
          const fileExt  = imageFile.name.split('.').pop().toLowerCase()
          const allowed  = ['jpg', 'jpeg', 'png', 'webp']

          // Validate file type
          if (!allowed.includes(fileExt)) {
            setError('Only JPG, PNG or WebP images are allowed.')
            setLoading(false)
            return
          }

          const fileName = `${user.id}_${Date.now()}.${fileExt}`

          const { error: uploadError } = await supabase.storage
            .from('cat-images')
            .upload(fileName, imageFile)

          if (uploadError) throw uploadError

          const { data: urlData } = supabase.storage
            .from('cat-images')
            .getPublicUrl(fileName)

          imageUrl = urlData.publicUrl
        }

        if (reportType === 'lost') {
          const { error: dbError } = await supabase
            .from('lost_cats')
            .insert({
              user_id:       user.id,
              name:          clean.catName,
              description:   clean.description,
              location:      clean.location,
              latitude:      latitude  || null,
              longitude:     longitude || null,
              image_url:     imageUrl,
              contact_email: clean.contactEmail,
              contact_phone: clean.contactPhone || null,
            })
          if (dbError) throw dbError
        } else {
          const { error: dbError } = await supabase
            .from('found_cats')
            .insert({
              user_id:       user.id,
              description:   clean.description,
              location:      clean.location,
              latitude:      latitude  || null,
              longitude:     longitude || null,
              image_url:     imageUrl,
              contact_email: clean.contactEmail,
              contact_phone: clean.contactPhone || null,
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
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--pearl)' }}>
        <div className="bg-white rounded-3xl shadow-xl p-6 sm:p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--police-blue)' }}>Report Submitted!</h2>
          <p className="text-gray-500 text-sm mb-8">
            Your {reportType === 'lost' ? 'lost cat' : 'found cat'} report is now live.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => router.push(reportType === 'lost' ? '/lost-cats' : '/found-cats')}
              className="w-full text-white py-3 rounded-xl font-semibold transition"
              style={{ background: 'var(--marigold)' }}
            >
              View All Reports
            </button>
            <button
              onClick={handleReset}
              className="w-full border border-gray-200 text-gray-600 hover:bg-gray-50 py-3 rounded-xl font-semibold transition"
            >
              Submit Another
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-10 px-4" style={{ background: 'var(--pearl)' }}>
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--police-blue)' }}>Report a Cat</h1>
          <p className="text-gray-500 text-sm">Fill in the details to alert our community</p>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border p-5 sm:p-8" style={{ borderColor: 'var(--buff)' }}>

          {/* Draft saved indicator */}
          {(catName || description || location) && (
            <div className="bg-amber-50 border border-amber-200 text-amber-700 text-xs px-4 py-2 rounded-xl mb-5 flex justify-between items-center">
              <span>📝 Draft saved automatically</span>
              <button
                onClick={clearForm}
                className="text-amber-500 hover:text-amber-700 font-medium"
              >
                Clear draft
              </button>
            </div>
          )}

          {/* Report type toggle */}
          <div className="flex flex-col sm:flex-row gap-3 mb-8">
            <button
              type="button"
              onClick={() => setReportType('lost')}
              className={`flex-1 py-3 rounded-xl font-semibold text-sm transition
                ${reportType === 'lost'
                  ? 'bg-[#E59D2C] text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              😿 I Lost My Cat
            </button>
            <button
              type="button"
              onClick={() => setReportType('found')}
              className={`flex-1 py-3 rounded-xl font-semibold text-sm transition
                ${reportType === 'found'
                  ? 'bg-green-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              😊 I Found a Cat
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600
                            text-sm px-4 py-3 rounded-xl mb-6">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">

            {reportType === 'lost' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cat&apos;s Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  placeholder="e.g. Whiskers, Luna, Mochi"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-400 transition text-sm"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description <span className="text-red-400">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={
                  reportType === 'lost'
                    ? 'Colour, size, breed, collar, any special marks...'
                    : 'Colour, size, condition, exact spot where found...'
                }
                required
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-400 transition text-sm resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Near Bandra Station, Mumbai"
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-400 transition text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pin on Map
                <span className="text-gray-400 font-normal ml-1">(recommended)</span>
              </label>
              <LocationPicker
                lat={latitude}
                lng={longitude}
                onLocationSelect={(lat, lng) => {
                  setLatitude(lat)
                  setLongitude(lng)
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Photo
                <span className="text-gray-400 font-normal ml-1">(recommended)</span>
              </label>
              {imagePreview ? (
                <div className="relative mb-2">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-52 object-cover rounded-xl border border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute top-2 right-2 bg-red-500 text-white text-xs px-3 py-1 rounded-full hover:bg-red-600 transition"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed rounded-xl cursor-pointer transition" style={{ borderColor: 'var(--buff)', background: 'var(--pearl)' }}>
                  <span className="text-3xl mb-2">📷</span>
                  <span className="text-sm font-medium" style={{ color: 'var(--marigold)' }}>Click to upload photo</span>
                  <span className="text-xs text-gray-400 mt-1">PNG, JPG up to 5MB</span>
                  <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </label>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Email <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-400 transition text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                  <span className="text-gray-400 font-normal ml-1">(optional)</span>
                </label>
                <input
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-400 transition text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full text-white font-bold py-4 rounded-xl transition flex items-center justify-center gap-2 text-base disabled:opacity-60 disabled:cursor-not-allowed
                          ${reportType === 'lost'
                            ? 'bg-[#E59D2C] hover:bg-[#c5860f]'
                            : 'bg-green-500 hover:bg-green-600'}`}
            >
              {loading ? (
                <>
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
                  Submitting...
                </>
              ) : (
                `Submit ${reportType === 'lost' ? '😿 Lost' : '😊 Found'} Cat Report`
              )}
            </button>
          </form>
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
