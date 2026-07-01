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
    <div className="min-h-screen bg-orange-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Report is Live!</h2>
          <p className="text-gray-500 text-sm">Your {reportType === 'lost' ? 'lost cat' : 'found cat'} report has been posted to our community.</p>
        </div>

        {/* What happens next */}
        <div className="bg-orange-50 rounded-2xl p-4 mb-6">
          <p className="text-xs font-bold text-orange-600 uppercase tracking-widest mb-3">What happens next</p>
          <div className="space-y-2">
            {reportType === 'lost' ? (
              <>
                <div className="flex gap-2 text-sm text-gray-600"><span>🤖</span><span>Use AI Match on your report to find potential matches from found cat reports</span></div>
                <div className="flex gap-2 text-sm text-gray-600"><span>🔔</span><span>You&apos;ll get notified if someone spots your cat or messages you</span></div>
                <div className="flex gap-2 text-sm text-gray-600"><span>📍</span><span>Your cat appears on the community map so nearby people can help</span></div>
                <div className="flex gap-2 text-sm text-gray-600"><span>✅</span><span>Once found, mark it as Reunited from your profile</span></div>
              </>
            ) : (
              <>
                <div className="flex gap-2 text-sm text-gray-600"><span>🔔</span><span>The cat&apos;s owner will be notified if there&apos;s a match</span></div>
                <div className="flex gap-2 text-sm text-gray-600"><span>💬</span><span>Owners can message you directly through the platform</span></div>
                <div className="flex gap-2 text-sm text-gray-600"><span>📍</span><span>Your report appears on the map so owners nearby can find you</span></div>
              </>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <button onClick={() => router.push('/profile')} className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-semibold transition">
            View My Reports
          </button>
          <button onClick={handleReset} className="w-full border border-gray-200 text-gray-600 hover:bg-gray-50 py-3 rounded-xl font-semibold transition">
            Submit Another Report
          </button>
        </div>
      </div>
    </div>
  )
}

  return (
    <div className="min-h-screen bg-orange-50 py-10 px-4">
      <div className="max-w-2xl mx-auto">

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Report a Cat</h1>
          <p className="text-gray-500 text-sm">Fill in the details to alert our community</p>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-orange-100 p-8">

          {/* Draft saved indicator */}
          {(catName || description) && (
            <div className="bg-amber-50 border border-amber-200 text-amber-700 text-xs px-4 py-2 rounded-xl mb-5 flex justify-between items-center">
              <span>📝 Draft saved automatically</span>
              <button onClick={clearForm} className="text-amber-500 hover:text-amber-700 font-medium">Clear draft</button>
            </div>
          )}

          {/* Report type toggle */}
          <div className="flex gap-3 mb-8">
            <button type="button" onClick={() => setReportType('lost')} className={`flex-1 py-3 rounded-xl font-semibold text-sm transition ${reportType === 'lost' ? 'bg-orange-500 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              😿 I Lost My Cat
            </button>
            <button type="button" onClick={() => setReportType('found')} className={`flex-1 py-3 rounded-xl font-semibold text-sm transition ${reportType === 'found' ? 'bg-green-500 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              😊 I Found a Cat
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl mb-6">⚠️ {error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Cat name — ONLY for lost cats */}
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
                  required={reportType === 'lost'}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-400 transition text-sm"
                />
              </div>
            )}

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description <span className="text-red-400">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={reportType === 'lost' ? 'Colour, size, breed, collar, any special marks...' : 'Colour, size, condition, any visible injuries, behaviour...'}
                required
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-400 transition text-sm resize-none"
              />
            </div>

            {/* Location — unified search + map */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location <span className="text-red-400">*</span>
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

            {/* Image upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Photo
                <span className="text-gray-400 font-normal ml-1">(recommended)</span>
              </label>
              {imagePreview ? (
                <div className="relative mb-2">
                  <img src={imagePreview} alt="Preview" className="w-full h-52 object-cover rounded-xl border border-gray-200" />
                  <button type="button" onClick={handleRemoveImage} className="absolute top-2 right-2 bg-red-500 text-white text-xs px-3 py-1 rounded-full hover:bg-red-600 transition">
                    Remove
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-orange-300 rounded-xl cursor-pointer bg-orange-50 hover:bg-orange-100 transition">
                  <span className="text-3xl mb-2">📷</span>
                  <span className="text-sm font-medium text-orange-500">Click to upload photo</span>
                  <span className="text-xs text-gray-400 mt-1">PNG, JPG up to 5MB</span>
                  <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </label>
              )}
            </div>

            {/* Contact info */}
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
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-400 transition text-sm"
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
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-400 transition text-sm"
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full text-white font-bold py-4 rounded-xl transition flex items-center justify-center gap-2 text-base disabled:opacity-60 disabled:cursor-not-allowed ${reportType === 'lost' ? 'bg-orange-500 hover:bg-orange-600' : 'bg-green-500 hover:bg-green-600'}`}
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