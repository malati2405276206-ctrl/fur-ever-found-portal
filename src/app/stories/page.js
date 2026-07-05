// src/app/stories/page.js
'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useRole } from '@/hooks/useRole'
import { useSearchParams } from 'next/navigation'
import { ChevronLeft, ChevronRight, Plus, Trash2, Edit3 } from 'lucide-react'

export default function StoriesPage() {
  const { user } = useAuth()
  const { isNGO, isUser } = useRole()
  const searchParams = useSearchParams()

  const [stories,    setStories]    = useState([])
  const [loading,    setLoading]    = useState(true)
  const [pageIndex,  setPageIndex]  = useState(0)
  const [direction,  setDirection]  = useState(1)
  const [actionMsg,  setActionMsg]  = useState('')

  // Add story modal (NGO only)
  const [showAddModal,   setShowAddModal]   = useState(false)
  const [addForm,        setAddForm]        = useState({ cat_name: '', breed: '', age: '', location: '', storyline: '' })
  const [addImage,       setAddImage]       = useState(null)
  const [addImagePreview, setAddImagePreview] = useState(null)
  const [addSubmitting,  setAddSubmitting]  = useState(false)

  useEffect(() => { fetchStories() }, [])

  const fetchStories = async () => {
    setLoading(true)

    const { data, error } = await supabase
      .from('adoption_cats')
      .select('*')
      .eq('status', 'adopted')
      .order('adopted_at', { ascending: false })

    if (error) {
      console.error('Error:', error.message)
      setStories([])
      setLoading(false)
      return
    }

    if (!data || data.length === 0) {
      setStories([])
      setLoading(false)
      return
    }

    const ngoIds = [...new Set(data.map((c) => c.ngo_id).filter(Boolean))]
    let ngoMap = {}

    if (ngoIds.length > 0) {
      const { data: ngoData } = await supabase
        .from('ngo_profiles')
        .select('user_id, org_name, city')
        .in('user_id', ngoIds)
      if (ngoData) ngoData.forEach((n) => { ngoMap[n.user_id] = n })
    }

    const enriched = data.map((cat) => ({
      ...cat,
      ngo_profiles: ngoMap[cat.ngo_id] || null,
    }))

    setStories(enriched)
    setLoading(false)

    const catId = searchParams.get('catId')
    if (catId) {
      const idx = enriched.findIndex((s) => String(s.id) === catId)
      if (idx >= 0) setPageIndex(idx)
    }
  }

  const totalPages = stories.length + (isNGO ? 1 : 0)
  const isAddPage  = isNGO && pageIndex === stories.length
  const cat        = !isAddPage && stories[pageIndex] ? stories[pageIndex] : null

  const goNext = () => {
    if (pageIndex < totalPages - 1) { setDirection(1); setPageIndex((p) => p + 1) }
  }
  const goPrev = () => {
    if (pageIndex > 0) { setDirection(-1); setPageIndex((p) => p - 1) }
  }
  const handleDragEnd = (e, info) => {
    if (info.offset.x < -80) goNext()
    else if (info.offset.x > 80) goPrev()
  }

  const timeAgo = (dateStr) => {
    if (!dateStr) return ''
    const diff  = Date.now() - new Date(dateStr).getTime()
    const days  = Math.floor(diff / (1000 * 60 * 60 * 24))
    if (days === 0) return 'Today'
    if (days === 1) return 'Yesterday'
    if (days < 30)  return `${days} days ago`
    const months = Math.floor(days / 30)
    if (months < 12) return `${months} month${months > 1 ? 's' : ''} ago`
    return `${Math.floor(months / 12)} year${Math.floor(months / 12) > 1 ? 's' : ''} ago`
  }

  // ── NGO: Delete their own story ──────────────────────
  const handleDeleteStory = async (catId) => {
    if (!confirm('Remove this story from the storybook? The cat listing will remain.')) return

    const { error } = await supabase
      .from('adoption_cats')
      .update({ status: 'available', adopted_at: null })
      .eq('id', catId)
      .eq('ngo_id', user.id)

    if (error) { setActionMsg('❌ Failed to remove story.'); return }

    setActionMsg('✅ Story removed.')
    setTimeout(() => setActionMsg(''), 3000)
    setPageIndex(0)
    fetchStories()
  }

  // ── NGO: Add manual story ────────────────────────────
  const handleAddStory = async (e) => {
    e.preventDefault()
    if (!addForm.cat_name || !addForm.storyline) {
      setActionMsg('⚠️ Cat name and story are required.')
      return
    }

    setAddSubmitting(true)

    let imageUrl = null
    if (addImage) {
      const fileExt  = addImage.name.split('.').pop().toLowerCase()
      const fileName = `story_${user.id}_${Date.now()}.${fileExt}`
      const { error: uploadError } = await supabase.storage.from('cat-images').upload(fileName, addImage)
      if (!uploadError) {
        const { data: urlData } = supabase.storage.from('cat-images').getPublicUrl(fileName)
        imageUrl = urlData.publicUrl
      }
    }

    // Insert as an adopted cat (shows in stories)
    const { error } = await supabase
      .from('adoption_cats')
      .insert({
        ngo_id:      user.id,
        name:        addForm.cat_name,
        breed:       addForm.breed    || null,
        age:         addForm.age      || null,
        city:        addForm.location || 'Unknown',
        description: addForm.storyline,
        storyline:   addForm.storyline,
        image_url:   imageUrl,
        status:      'adopted',
        adopted_at:  new Date().toISOString(),
        gender:      'unknown',
      })

    if (error) {
      setActionMsg('❌ Failed to add story: ' + error.message)
      setAddSubmitting(false)
      return
    }

    setActionMsg('✅ Story added to the storybook!')
    setShowAddModal(false)
    setAddForm({ cat_name: '', breed: '', age: '', location: '', storyline: '' })
    setAddImage(null)
    setAddImagePreview(null)
    setAddSubmitting(false)
    setTimeout(() => setActionMsg(''), 3000)
    fetchStories()
  }

  const decorStickers = ['🌸', '🦋', '🌿', '🐾', '💛', '✨', '🌼', '🍃']

  const fadeVariants = {
    enter:  { opacity: 0 },
    center: { opacity: 1 },
    exit:   { opacity: 0 },
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#EBDDC5' }}>
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-amber-800 text-sm">Opening the storybook...</p>
        </div>
      </div>
    )
  }

  if (stories.length === 0 && !isNGO) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#EBDDC5' }}>
        <div className="scrapbook-case p-8 text-center max-w-md">
          <div className="text-5xl mb-4">📖</div>
          <h3 className="text-xl font-bold text-amber-900 mb-2">The storybook is empty</h3>
          <p className="text-amber-800/60 text-sm">Success stories will appear here when cats find their forever homes.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-6 sm:py-10 px-4 flex flex-col items-center" style={{ background: '#EBDDC5' }}>
      <div className="w-full max-w-5xl">

        {/* Page title */}
        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-amber-900">📖 Story Book</h1>
          <p className="text-amber-800/60 text-sm mt-1">Every rescued cat has a tale to tell</p>
        </div>

        {/* Action message */}
        {actionMsg && (
          <div className="mb-4 text-center text-sm font-medium text-amber-900 bg-amber-100 border border-amber-300 px-4 py-2 rounded-xl">
            {actionMsg}
          </div>
        )}

        <div className="scrapbook-case relative">
          {/* Leather stitching */}
          <div className="absolute top-2 left-4 right-4 h-[2px] opacity-40 z-30"
            style={{ backgroundImage: 'repeating-linear-gradient(90deg, #a07030 0px, #a07030 6px, transparent 6px, transparent 12px)' }}
          />
          <div className="absolute bottom-2 left-4 right-4 h-[2px] opacity-40 z-30"
            style={{ backgroundImage: 'repeating-linear-gradient(90deg, #a07030 0px, #a07030 6px, transparent 6px, transparent 12px)' }}
          />

          <div className="flex flex-col md:flex-row gap-0 relative">

            {/* ── LEFT PAGE ── */}
            <div className="flex-1 relative p-4 sm:p-6 md:p-8 h-[500px] md:h-[550px] overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #2a6b6b 0%, #1f5c5c 50%, #184e4e 100%)',
                borderRadius: '12px 0 0 12px',
                borderRight: '3px solid #3d2b1a',
              }}
            >
              <div className="absolute inset-0 opacity-10 rounded-l-xl pointer-events-none"
                style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M0 0h20v20H0zM20 20h20v20H20z\' fill=\'%23000\' fill-opacity=\'.03\'/%3E%3C/svg%3E")' }}
              />
              <div className="absolute top-4 left-4 w-4 h-4 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-md z-10" />
              <div className="absolute top-4 right-4 sm:top-6 sm:right-6 text-3xl opacity-70">🧭</div>
              <div className="absolute bottom-4 left-4 w-16 h-12 rounded opacity-30"
                style={{ background: 'linear-gradient(135deg, #8fbc8f, #6b8e6b)', border: '1px solid #4a6b4a' }}
              />
              <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 z-10">
                <div className="flex items-center gap-1.5 bg-[#1a3d3d] px-3 py-1.5 rounded-full border border-teal-700/50">
                  <span className="text-xs">🐱</span>
                  <span className="text-[9px] text-teal-300 uppercase tracking-widest font-bold">Fur-ever Home</span>
                </div>
              </div>

              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={isAddPage ? 'add-left' : `left-${cat?.id}`}
                  custom={direction}
                  variants={fadeVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.5 }}
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.1}
                  onDragEnd={handleDragEnd}
                  className="relative z-[5] h-full flex flex-col cursor-grab active:cursor-grabbing"
                >
                  {isAddPage ? (
                    /* ── ADD PAGE (NGO only) ── */
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <button
                        onClick={() => setShowAddModal(true)}
                        className="w-20 h-20 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition mb-4 hover:scale-105"
                      >
                        <Plus size={36} />
                      </button>
                      <h3 className="text-white font-bold text-lg mb-1">Add a New Story</h3>
                      <p className="text-teal-200 text-xs max-w-[180px]">
                        Share a rescue story from your NGO
                      </p>
                    </div>
                  ) : cat ? (
                    <>
                      {/* Cat info card */}
                      <div className="bg-white p-4 sm:p-5 mb-4 shadow-md" style={{ borderRadius: '4px', transform: 'rotate(-1.5deg)' }}>
                        <div className="flex items-start justify-between">
                          <h2 className="text-xl sm:text-2xl font-black text-gray-900 uppercase tracking-wide mb-3">
                            {cat.name}
                          </h2>
                          {/* NGO can delete their own stories */}
                          {isNGO && cat.ngo_id === user?.id && (
                            <button
                              onClick={() => handleDeleteStory(cat.id)}
                              className="text-red-400 hover:text-red-600 transition p-1"
                              title="Remove from storybook"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                        <div className="space-y-1 text-sm text-gray-700" style={{ fontFamily: "'Courier New', monospace" }}>
                          {cat.breed && <p>// Breed: <span className="font-bold">{cat.breed}</span></p>}
                          {cat.age && <p>// Age: <span className="font-bold">{cat.age}</span></p>}
                          <p>// Location: <span className="font-bold">{cat.city}</span></p>
                          {cat.ngo_profiles?.org_name && (
                            <p>// Rescued by: <span className="font-bold">{cat.ngo_profiles.org_name}</span></p>
                          )}
                          {cat.adopted_at && (
                            <p>// Adopted: <span className="font-bold">{timeAgo(cat.adopted_at)}</span></p>
                          )}
                        </div>
                      </div>

                      {/* Polaroid photo */}
                      <div className="flex justify-center mt-auto">
                        <div className="relative">
                          <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-3 rounded-sm z-10"
                            style={{ background: 'linear-gradient(135deg, #d4a056, #c4903e)', boxShadow: '0 2px 4px rgba(0,0,0,0.3)' }}
                          />
                          <div className="bg-white p-2 pb-6 shadow-xl" style={{ transform: 'rotate(-2deg)' }}>
                            {cat.image_url ? (
                              <img src={cat.image_url} alt={cat.name} className="w-36 h-36 sm:w-44 sm:h-44 object-cover" />
                            ) : (
                              <div className="w-36 h-36 sm:w-44 sm:h-44 bg-amber-50 flex items-center justify-center text-5xl">🐱</div>
                            )}
                            <p className="text-center text-[10px] text-gray-500 mt-1" style={{ fontFamily: "'Comic Sans MS', 'Segoe Print', cursive" }}>
                              {cat.name} 💛
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="absolute bottom-6 left-4 text-lg opacity-50" style={{ transform: 'rotate(-15deg)' }}>
                        {decorStickers[pageIndex % decorStickers.length]}
                      </div>
                      <div className="absolute top-20 right-6 text-sm opacity-40" style={{ transform: 'rotate(10deg)' }}>
                        {decorStickers[(pageIndex + 3) % decorStickers.length]}
                      </div>
                    </>
                  ) : null}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* ── SPINE ── */}
            <div className="hidden md:flex flex-col items-center justify-center w-8 relative z-20"
              style={{ background: 'linear-gradient(180deg, #5c3d1e 0%, #4a3018 50%, #3d2710 100%)' }}
            >
              <div className="absolute top-6 w-4 h-4 rounded-full bg-amber-700/60" />
              <div className="absolute top-1/3 w-3 h-3 rounded-full bg-amber-800/40" />
              <div className="absolute top-1/2 w-5 h-1 bg-amber-600/30 rounded-full" />
              <div className="absolute top-2/3 w-3 h-3 rounded-full bg-amber-800/40" />
              <div className="absolute bottom-6 w-4 h-4 rounded-full bg-amber-700/60" />
            </div>

            {/* ── RIGHT PAGE ── */}
            <div className="flex-1 relative p-4 sm:p-6 md:p-8 h-[500px] md:h-[550px] overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #c4956a 0%, #b8845a 30%, #a87548 100%)',
                borderRadius: '0 12px 12px 0',
                borderLeft: '3px solid #3d2b1a',
              }}
            >
              {/* Static decorations — keep exactly as your teammate built */}
              <div className="absolute inset-0 opacity-20 pointer-events-none"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='30' cy='30' r='1' fill='%23000' fill-opacity='.15'/%3E%3Ccircle cx='10' cy='10' r='0.5' fill='%23000' fill-opacity='.1'/%3E%3Ccircle cx='50' cy='50' r='0.8' fill='%23000' fill-opacity='.12'/%3E%3C/svg%3E")` }}
              />
              <div className="absolute top-4 left-6 w-3 h-3 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 shadow-md z-10" />
              <div className="absolute top-4 right-8 w-3 h-3 rounded-full bg-gradient-to-br from-green-400 to-green-600 shadow-md z-10" />
              <div className="absolute bottom-6 left-8 w-3 h-3 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-md z-10" />
              <div className="absolute top-16 right-3 flex flex-col gap-2 z-10">
                <div className="w-4 h-4 bg-yellow-300 shadow-sm" style={{ transform: 'rotate(35deg)' }} />
                <div className="w-3.5 h-3.5 bg-teal-400 shadow-sm" style={{ transform: 'rotate(-25deg)' }} />
              </div>
              <div className="absolute bottom-20 right-4 flex flex-col gap-2 z-10">
                <div className="w-3 h-3 bg-teal-500 shadow-sm" style={{ transform: 'rotate(40deg)' }} />
                <div className="w-3.5 h-3.5 bg-yellow-400 shadow-sm" style={{ transform: 'rotate(-30deg)' }} />
              </div>
              <div className="absolute top-3 right-20 text-2xl opacity-70 z-[3]" style={{ transform: 'rotate(15deg)' }}>🌸</div>
              <div className="absolute top-14 right-6 text-xl opacity-60 z-[3]" style={{ transform: 'rotate(-10deg)' }}>🌺</div>
              <div className="absolute bottom-4 left-4 z-[6]">
                <div className="bg-yellow-200 p-2 w-[80px] shadow-md" style={{ transform: 'rotate(-2deg)', borderRadius: '1px' }}>
                  <p className="text-[9px] text-gray-600 leading-tight" style={{ fontFamily: "'Comic Sans MS', 'Segoe Print', cursive" }}>
                    Happy tails! 🌟
                  </p>
                </div>
              </div>
              <div className="absolute bottom-3 right-3 z-10">
                <div className="bg-gradient-to-br from-gray-400 to-gray-500 px-2 py-1 rounded-sm shadow-md" style={{ transform: 'rotate(5deg)' }}>
                  <p className="text-[7px] text-white font-bold uppercase tracking-wider">Fur-ever</p>
                  <p className="text-[7px] text-white font-bold uppercase tracking-wider">Home</p>
                </div>
              </div>

              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={isAddPage ? 'add-right' : `right-${cat?.id}`}
                  custom={direction}
                  variants={fadeVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.5 }}
                  className="relative z-[5] h-full flex flex-col"
                >
                  {isAddPage ? (
                    <div className="flex flex-col items-center justify-center h-full text-center px-4">
                      <div className="text-4xl mb-3">✍️</div>
                      <p className="text-amber-900 font-medium text-sm" style={{ fontFamily: "'Comic Sans MS', cursive" }}>
                        As an NGO, you can add rescued cat stories that didn&apos;t go through the adoption flow — street rescues, rare finds, or special cases.
                      </p>
                      <button
                        onClick={() => setShowAddModal(true)}
                        className="mt-4 bg-amber-800 hover:bg-amber-900 text-white px-5 py-2 rounded-xl text-sm font-semibold transition"
                      >
                        + Write a Story
                      </button>
                    </div>
                  ) : cat ? (
                    <>
                      <div className="mb-4">
                        <div className="inline-block bg-white/90 px-4 py-2 shadow-md"
                          style={{ transform: 'rotate(1deg)', backgroundImage: 'repeating-linear-gradient(transparent, transparent 19px, #e0e0e0 19px, #e0e0e0 20px)', borderRadius: '2px' }}
                        >
                          <h2 className="text-xl sm:text-2xl font-bold text-gray-800" style={{ fontFamily: "'Comic Sans MS', 'Segoe Print', cursive" }}>
                            Stories
                          </h2>
                        </div>
                      </div>

                      <div className="relative bg-white/90 p-4 sm:p-5 shadow-lg mt-2 overflow-y-auto"
                        style={{ transform: 'rotate(0.5deg)', borderRadius: '2px', backgroundImage: 'repeating-linear-gradient(transparent, transparent 27px, #f0e8e0 27px, #f0e8e0 28px)', maxHeight: '340px' }}
                      >
                        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-12 h-4 opacity-60 z-10"
                          style={{ background: 'linear-gradient(135deg, #f0e68c, #daa520)', borderRadius: '2px' }}
                        />
                        <p className="text-gray-700 text-base sm:text-lg leading-relaxed pt-2" style={{ fontFamily: "'Comic Sans MS', 'Segoe Print', cursive" }}>
                          {cat.storyline || 'This cat found their forever home — a beautiful story of rescue and love. 🐾'}
                        </p>
                        <div className="mt-6 flex justify-end">
                          <div className="inline-block border-green-600 text-green-700 px-4 py-2 uppercase font-black text-xs tracking-widest"
                            style={{ transform: 'rotate(-4deg)', borderWidth: '3px', borderStyle: 'solid', borderRadius: '4px', opacity: 0.8 }}
                          >🎉 Adopted {timeAgo(cat.adopted_at)}</div>
                        </div>
                      </div>
                    </>
                  ) : null}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-center gap-4 mt-6">
          <button onClick={goPrev} disabled={pageIndex === 0}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-all disabled:opacity-20 disabled:cursor-not-allowed hover:scale-110"
            style={{ background: '#3d2b1a', color: '#F3D58D' }}
          >
            <ChevronLeft size={18} />
          </button>

          <div className="text-center">
            <p className="text-[#2E4365] text-sm font-medium">
              Page {pageIndex + 1} of {totalPages}
            </p>
            <p className="text-[#2E4365]/50 text-[10px] mt-0.5 hidden sm:block">
              Use arrows or swipe to turn pages
            </p>
          </div>

          <button onClick={goNext} disabled={pageIndex === totalPages - 1}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-all disabled:opacity-20 disabled:cursor-not-allowed hover:scale-110"
            style={{ background: '#3d2b1a', color: '#F3D58D' }}
          >
            <ChevronRight size={18} />
          </button>
        </div>

        <p className="sm:hidden text-xs text-center text-[#2E4365]/50 mt-2">← Swipe left or right →</p>
      </div>

      {/* ── Add Story Modal (NGO only) ── */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">

            <div className="flex items-center justify-between px-6 py-4 border-b border-amber-100 bg-amber-50">
              <h3 className="font-bold text-amber-900">✍️ Add a Rescue Story</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>

            <form onSubmit={handleAddStory} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

              {/* Photo */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">Cat Photo</label>
                {addImagePreview ? (
                  <div className="relative">
                    <img src={addImagePreview} alt="Preview" className="w-full h-36 object-cover rounded-xl" />
                    <button type="button" onClick={() => { setAddImage(null); setAddImagePreview(null) }}
                      className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                      Remove
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-amber-300 rounded-xl cursor-pointer bg-amber-50 hover:bg-amber-100 transition">
                    <span className="text-2xl mb-1">📷</span>
                    <span className="text-xs text-amber-600 font-medium">Upload photo</span>
                    <input type="file" accept="image/*" className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0]
                        if (!f) return
                        setAddImage(f)
                        setAddImagePreview(URL.createObjectURL(f))
                      }}
                    />
                  </label>
                )}
              </div>

              {/* Fields */}
              {[
                { label: "Cat's Name *",   key: 'cat_name',  placeholder: 'e.g. Luna',           required: true  },
                { label: 'Breed',          key: 'breed',     placeholder: 'e.g. Tabby, Persian',  required: false },
                { label: 'Age',            key: 'age',       placeholder: 'e.g. 2 years',         required: false },
                { label: 'Rescue Location',key: 'location',  placeholder: 'Where was cat found?', required: false },
              ].map((f) => (
                <div key={f.key}>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1">{f.label}</label>
                  <input
                    type="text"
                    value={addForm[f.key]}
                    onChange={(e) => setAddForm((p) => ({ ...p, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    required={f.required}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-400 transition text-sm"
                  />
                </div>
              ))}

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1">Rescue Story *</label>
                <textarea
                  value={addForm.storyline}
                  onChange={(e) => setAddForm((p) => ({ ...p, storyline: e.target.value }))}
                  placeholder="Tell the story of how this cat was rescued, their recovery, and how they found their home..."
                  required
                  rows={5}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-400 transition text-sm resize-none"
                />
              </div>

              <button type="submit" disabled={addSubmitting}
                className="w-full bg-amber-600 hover:bg-amber-700 disabled:bg-amber-300 text-white font-bold py-3 rounded-xl transition">
                {addSubmitting ? 'Adding story...' : '📖 Add to Storybook'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}