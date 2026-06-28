// src/app/ngo-dashboard/add-cat/page.js
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useFormPersist, clearPersistedForm } from '@/hooks/useFormPersist'

function AddCatForm() {
  const router = useRouter()

  // ── Form fields ───────────────────────────────────
 const [name,        setName]        = useFormPersist('addcat_name',      '')
const [age,         setAge]         = useFormPersist('addcat_age',        '')
const [gender,      setGender]      = useFormPersist('addcat_gender',     'unknown')
const [breed,       setBreed]       = useFormPersist('addcat_breed',      '')
const [city,        setCity]        = useFormPersist('addcat_city',       '')
const [description, setDescription] = useFormPersist('addcat_desc',       '')
const [storyline,   setStoryline]   = useFormPersist('addcat_storyline',  '')

  // ── Image ─────────────────────────────────────────
  const [imageFile,    setImageFile]    = useState(null)
  const [imagePreview, setImagePreview] = useState(null)

  // ── UI states ─────────────────────────────────────
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [success, setSuccess] = useState(false)

  // Pre-fill city from NGO profile
  useEffect(() => {
    const prefill = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: ngo } = await supabase
        .from('ngo_profiles')
        .select('city')
        .eq('user_id', user.id)
        .single()

      if (ngo?.city) setCity(ngo.city)
    }
    prefill()
  }, [])

  // ── Image handler ─────────────────────────────────
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

  // ── Submit ────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not logged in.')

      let imageUrl = null

      // Upload image if selected
      if (imageFile) {
        const fileExt  = imageFile.name.split('.').pop()
        const fileName = `adoption_${user.id}_${Date.now()}.${fileExt}`

        const { error: uploadError } = await supabase.storage
          .from('cat-images')
          .upload(fileName, imageFile)

        if (uploadError) throw uploadError

        const { data: urlData } = supabase.storage
          .from('cat-images')
          .getPublicUrl(fileName)

        imageUrl = urlData.publicUrl
      }

      // Save to adoption_cats table
      const { error: dbError } = await supabase
        .from('adoption_cats')
        .insert({
          ngo_id:      user.id,
          name,
          age:         age      || null,
          gender,
          breed:       breed    || null,
          city,
          description,
          storyline,
          image_url:   imageUrl,
          status:      'available',
        })

      if (dbError) throw dbError

      // Clear persisted form data on success
    clearPersistedForm([
    'addcat_name', 'addcat_age', 'addcat_gender',
    'addcat_breed', 'addcat_city', 'addcat_desc', 'addcat_storyline'
    ])

      setSuccess(true)

    } catch (err) {
      setError(err.message || 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  // ── Success screen ────────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen bg-purple-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Cat Listed!
          </h2>
          <p className="text-gray-500 text-sm mb-8">
            <strong>{name}</strong> is now live on the adoption feed.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => router.push('/adoption')}
              className="w-full bg-purple-500 hover:bg-purple-600 text-white py-3 rounded-xl font-semibold transition"
            >
              View Adoption Feed
            </button>
            <button
              onClick={() => {
                setSuccess(false)
                setName(''); setAge(''); setGender('unknown')
                setBreed(''); setDescription(''); setStoryline('')
                setImageFile(null); setImagePreview(null); setError('')
              }}
              className="w-full border border-gray-200 text-gray-600 hover:bg-gray-50 py-3 rounded-xl font-semibold transition"
            >
              Add Another Cat
            </button>
            <button
              onClick={() => router.push('/ngo-dashboard')}
              className="w-full text-purple-500 hover:underline text-sm font-medium py-1 transition"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Main form ─────────────────────────────────────
  return (
    <div className="min-h-screen bg-purple-50 py-10 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => router.push('/ngo-dashboard')}
            className="text-gray-400 hover:text-gray-600 transition text-xl"
          >
            ←
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              List a Cat for Adoption
            </h1>
            <p className="text-gray-500 text-sm mt-0.5">
              Tell the world about this cat&apos;s journey
            </p>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-purple-100 p-8">

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl mb-6">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Draft saved indicator — add this at top of form */}
            {(name || description || storyline) && (
            <div className="bg-amber-50 border border-amber-200 text-amber-700
                            text-xs px-4 py-2 rounded-xl mb-5 flex justify-between items-center">
                <span>📝 Draft saved automatically</span>
                <button
                type="button"
                onClick={() => {
                    clearPersistedForm([
                    'addcat_name', 'addcat_age', 'addcat_gender',
                    'addcat_breed', 'addcat_city', 'addcat_desc', 'addcat_storyline'
                    ])
                    setName(''); setAge(''); setGender('unknown')
                    setBreed(''); setDescription(''); setStoryline('')
                }}
                className="text-amber-500 hover:text-amber-700 font-medium"
                >
                Clear draft
                </button>
            </div>
            )}

            {/* ── Cat Photo ── */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Cat&apos;s Photo
                <span className="text-gray-400 font-normal ml-1">(recommended)</span>
              </label>

              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-64 object-cover rounded-2xl border border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute top-3 right-3 bg-red-500 hover:bg-red-600 text-white text-xs px-3 py-1.5 rounded-full transition"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-purple-300 rounded-2xl cursor-pointer bg-purple-50 hover:bg-purple-100 transition">
                  <span className="text-4xl mb-2">📷</span>
                  <span className="text-sm font-medium text-purple-500">
                    Click to upload photo
                  </span>
                  <span className="text-xs text-gray-400 mt-1">PNG, JPG up to 5MB</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* ── Basic Info ── */}
            <div>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-4">
                Basic Info
              </h2>

              <div className="space-y-4">

                {/* Cat name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cat&apos;s Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Luna, Mochi, Simba"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400 transition text-sm"
                  />
                </div>

                {/* Age + Gender in a row */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Age
                      <span className="text-gray-400 font-normal ml-1">(optional)</span>
                    </label>
                    <input
                      type="text"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      placeholder="e.g. 2 years, 4 months"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400 transition text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Gender
                    </label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200
                                 focus:outline-none focus:ring-2 focus:ring-purple-400
                                 transition text-sm bg-white"
                    >
                      <option value="unknown">Unknown</option>
                      <option value="male">Male 🐱</option>
                      <option value="female">Female 🐱</option>
                    </select>
                  </div>
                </div>

                {/* Breed + City in a row */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Breed
                      <span className="text-gray-400 font-normal ml-1">(optional)</span>
                    </label>
                    <input
                      type="text"
                      value={breed}
                      onChange={(e) => setBreed(e.target.value)}
                      placeholder="e.g. Tabby, Persian"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200
                                 focus:outline-none focus:ring-2 focus:ring-purple-400
                                 transition text-sm"
                    />
                  </div>
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
                </div>

              </div>
            </div>

            {/* ── Description ── */}
            <div>
              <h2 className="text-sm font-semibold text-gray-500 uppercase
                             tracking-widest mb-4">
                About This Cat
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Personality, behaviour, vaccinated?, neutered?, good with kids/other pets..."
                  required
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200
                             focus:outline-none focus:ring-2 focus:ring-purple-400
                             transition text-sm resize-none"
                />
              </div>
            </div>

            {/* ── Storyline ── */}
            <div>
              <h2 className="text-sm font-semibold text-gray-500 uppercase
                             tracking-widest mb-1">
                Rescue Storyline ✨
              </h2>
              <p className="text-xs text-gray-400 mb-4">
                This is the special part — tell the cat&apos;s rescue journey.
                How you found them, their recovery, their transformation.
                This becomes their story on the Success Stories page when adopted.
              </p>

              <textarea
                value={storyline}
                onChange={(e) => setStoryline(e.target.value)}
                placeholder="We found Luna shivering under a car during the monsoon rains. She had an injured paw and was severely malnourished. After 3 weeks of care, medication, and love — she started purring for the first time..."
                required
                rows={6}
                className="w-full px-4 py-3 rounded-xl border border-purple-200
                           focus:outline-none focus:ring-2 focus:ring-purple-400
                           transition text-sm resize-none bg-purple-50
                           placeholder-purple-300"
              />
              <p className="text-xs text-gray-400 mt-1 text-right">
                {storyline.length} characters
              </p>
            </div>

            {/* ── Submit ── */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-500 hover:bg-purple-600
                         disabled:bg-purple-300 disabled:cursor-not-allowed
                         text-white font-bold py-4 rounded-xl transition
                         flex items-center justify-center gap-2 text-base"
            >
              {loading ? (
                <>
                  <span className="w-5 h-5 border-2 border-white border-t-transparent
                                    rounded-full animate-spin inline-block" />
                  Listing cat...
                </>
              ) : (
                '🐱 List Cat for Adoption'
              )}
            </button>

          </form>
        </div>
      </div>
    </div>
  )
}

// Wrap with ProtectedRoute — NGO only
export default function AddCatPage() {
  return (
    <ProtectedRoute requiredRole="ngo">
      <AddCatForm />
    </ProtectedRoute>
  )
}