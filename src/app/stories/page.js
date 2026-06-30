// src/app/stories/page.js
'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useRole } from '@/hooks/useRole'
import { ChevronLeft, ChevronRight, BookOpen, Plus } from 'lucide-react'
import AddStoryModal from '@/components/AddStoryModal'

export default function StoriesPage() {
  const { user } = useAuth()
  const { isNGO } = useRole()

  const [stories, setStories] = useState([])
  const [loading, setLoading] = useState(true)
  const [pageIndex, setPageIndex] = useState(0)
  const [direction, setDirection] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    fetchStories()
  }, [])

  const fetchStories = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('adoption_cats')
      .select(`*, ngo_profiles ( org_name, city )`)
      .eq('status', 'adopted')
      .order('adopted_at', { ascending: false })

    if (!error) setStories(data || [])
    setLoading(false)
  }

  // Total "pages" = stories + 1 blank "add page" page (NGO only)
  const totalPages = stories.length + (isNGO ? 1 : 0)
  const isAddPage = isNGO && pageIndex === stories.length

  const goNext = () => {
    if (pageIndex < totalPages - 1) {
      setDirection(1)
      setPageIndex((p) => p + 1)
    }
  }

  const goPrev = () => {
    if (pageIndex > 0) {
      setDirection(-1)
      setPageIndex((p) => p - 1)
    }
  }

  const handleDragEnd = (e, info) => {
    if (info.offset.x < -80) goNext()
    else if (info.offset.x > 80) goPrev()
  }

  const handleStoryAdded = async () => {
    setModalOpen(false)
    await fetchStories()
    setPageIndex(0) // jump back to first page to show newest story
  }

  const timeAgo = (dateStr) => {
    if (!dateStr) return ''
    const diff = Date.now() - new Date(dateStr).getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    if (days === 0) return 'Today'
    if (days === 1) return 'Yesterday'
    if (days < 30) return `${days} days ago`
    const months = Math.floor(days / 30)
    if (months < 12) return `${months} month${months > 1 ? 's' : ''} ago`
    return `${Math.floor(months / 12)} year${Math.floor(months / 12) > 1 ? 's' : ''} ago`
  }

  const pageVariants = {
    enter: (dir) => ({ rotateY: dir > 0 ? 90 : -90, opacity: 0 }),
    center: { rotateY: 0, opacity: 1 },
    exit: (dir) => ({ rotateY: dir > 0 ? -90 : 90, opacity: 0 }),
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fdf6ec]">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (stories.length === 0 && !isNGO) {
    return (
      <div className="min-h-screen bg-[#fdf6ec] flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-6xl mb-4">🌱</div>
          <h3 className="text-xl font-bold text-gray-700 mb-2">No stories yet</h3>
          <p className="text-gray-400 text-sm">Success stories appear here when NGOs mark cats as adopted.</p>
        </div>
      </div>
    )
  }

  const cat = !isAddPage ? stories[pageIndex] : null

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f5ead5] to-[#fdf6ec] py-10 px-4 flex flex-col items-center">

      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 text-amber-600 mb-2">
          <BookOpen size={20} />
          <span className="text-xs font-bold uppercase tracking-widest">Success Stories</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900">Every Cat Has a Story</h1>
      </div>

      <div className="relative w-full max-w-2xl">
        <div className="absolute inset-x-4 -bottom-3 h-6 bg-amber-900/10 rounded-full blur-md" />

        <div className="relative" style={{ perspective: '1500px' }}>
          <AnimatePresence custom={direction} mode="wait">
            <motion.div
              key={isAddPage ? 'add-page' : cat.id}
              custom={direction}
              variants={pageVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.45, ease: 'easeInOut' }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={handleDragEnd}
              style={{ transformStyle: 'preserve-3d' }}
              className="bg-[#fffdf8] rounded-r-2xl rounded-l-sm shadow-2xl border border-amber-100 overflow-hidden cursor-grab active:cursor-grabbing"
            >
              <div
                className="relative px-8 sm:px-12 py-10 min-h-[480px] flex flex-col"
                style={{
                  backgroundImage: 'repeating-linear-gradient(transparent, transparent 31px, #f0e4d0 32px)',
                  backgroundPosition: '0 8px',
                }}
              >
                <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-amber-200/40 to-transparent flex flex-col justify-evenly items-center py-6">
                  {Array.from({ length: 14 }).map((_, i) => (
                    <div key={i} className="w-2 h-2 rounded-full bg-amber-700/20" />
                  ))}
                </div>

                <div className="pl-4 flex-1 flex flex-col">

                  {isAddPage ? (
                    /* ── Blank "Add Page" ── */
                    <div className="flex-1 flex flex-col items-center justify-center text-center">
                      <button
                        onClick={() => setModalOpen(true)}
                        className="w-20 h-20 rounded-full bg-amber-100 hover:bg-amber-200 flex items-center justify-center text-amber-600 transition mb-4 hover:scale-105"
                      >
                        <Plus size={32} strokeWidth={2.5} />
                      </button>
                      <h3 className="text-xl font-bold text-gray-700 mb-1">Add a New Page</h3>
                      <p className="text-sm text-gray-400 max-w-xs" style={{ fontFamily: "'Comic Sans MS', 'Segoe Print', cursive" }}>
                        Write the rescue story for one of your adopted cats
                      </p>
                    </div>
                  ) : (
                    /* ── Story Page ── */
                    <>
                      <div className="flex justify-center mb-6">
                        {cat.image_url ? (
                          <div className="bg-white p-2 pb-4 shadow-md rotate-[-2deg]">
                            <img src={cat.image_url} alt={cat.name} className="w-40 h-40 object-cover" />
                          </div>
                        ) : (
                          <div className="bg-white p-2 pb-4 shadow-md rotate-[-2deg]">
                            <div className="w-40 h-40 bg-amber-50 flex items-center justify-center text-5xl">🐱</div>
                          </div>
                        )}
                      </div>

                      <h2 className="text-3xl font-bold text-gray-900 text-center mb-1">{cat.name}</h2>

                      <div className="flex flex-wrap justify-center gap-3 text-xs text-gray-500 mb-6">
                        {cat.breed && <span>🐾 {cat.breed}</span>}
                        {cat.age && <span>🎂 {cat.age}</span>}
                        <span>📍 {cat.city}</span>
                        {cat.ngo_profiles?.org_name && <span>🏢 {cat.ngo_profiles.org_name}</span>}
                        {cat.adopted_at && <span>· {timeAgo(cat.adopted_at)}</span>}
                      </div>

                      <p className="text-gray-700 text-lg leading-loose text-center max-w-md mx-auto" style={{ fontFamily: "'Comic Sans MS', 'Segoe Print', cursive" }}>
                        {cat.storyline}
                      </p>

                      <div className="flex justify-center mt-8">
                        <span className="inline-block border-2 border-amber-400 text-amber-600 text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full rotate-[-3deg]">
                          🎉 Adopted
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <button onClick={goPrev} disabled={pageIndex === 0} className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 sm:-translate-x-12 bg-white shadow-lg rounded-full p-2.5 text-amber-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-amber-50 transition">
          <ChevronLeft size={20} />
        </button>
        <button onClick={goNext} disabled={pageIndex === totalPages - 1} className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 sm:translate-x-12 bg-white shadow-lg rounded-full p-2.5 text-amber-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-amber-50 transition">
          <ChevronRight size={20} />
        </button>
      </div>

      <p className="mt-6 text-sm text-amber-600 font-medium">
        Page {pageIndex + 1} of {totalPages}
      </p>
      <p className="text-xs text-gray-400 mt-1">Swipe or use arrows to turn the page</p>

      {isNGO && (
        <AddStoryModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onStoryAdded={handleStoryAdded}
          currentUserId={user?.id}
        />
      )}
    </div>
  )
}