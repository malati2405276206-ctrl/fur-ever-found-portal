// src/app/stories/page.js
'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useRole } from '@/hooks/useRole'
import { useSearchParams } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function StoriesPage() {
  const { user } = useAuth()
  const { isNGO } = useRole()
  const searchParams = useSearchParams()

  const [stories, setStories] = useState([])
  const [loading, setLoading] = useState(true)
  const [pageIndex, setPageIndex] = useState(0)
  const [direction, setDirection] = useState(1)

  useEffect(() => {
    fetchStories()
  }, [])

  const fetchStories = async () => {
    setLoading(true)

    const { data, error } = await supabase
      .from('adoption_cats')
      .select('*')
      .eq('status', 'adopted')
      .order('adopted_at', { ascending: false })

    if (error) {
      console.error('Error fetching stories:', error.message)
      setStories([])
      setLoading(false)
      return
    }

    if (!data || data.length === 0) {
      setStories([])
      setLoading(false)
      return
    }

    const ngoIds = [...new Set(data.map((c) => c.ngo_id))]
    const { data: ngoData } = await supabase
      .from('ngo_profiles')
      .select('user_id, org_name, city')
      .in('user_id', ngoIds)

    const ngoMap = {}
    if (ngoData) ngoData.forEach((n) => { ngoMap[n.user_id] = n })

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

  const totalPages = stories.length

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

  const decorStickers = ['🌸', '🦋', '🌿', '🐾', '💛', '✨', '🌼', '🍃']

  // Simple fade transition
  const fadeVariants = {
    enter: { opacity: 0 },
    center: { opacity: 1 },
    exit: { opacity: 0 },
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

  if (stories.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#EBDDC5' }}>
        <div className="scrapbook-case p-8 text-center max-w-md">
          <div className="text-5xl mb-4">📖</div>
          <h3 className="text-xl font-bold text-amber-100 mb-2">The storybook is empty</h3>
          <p className="text-amber-200/60 text-sm">Success stories will appear here when NGOs mark cats as adopted.</p>
        </div>
      </div>
    )
  }

  const cat = stories[pageIndex]

  return (
    <div className="min-h-screen py-6 sm:py-10 px-4 flex flex-col items-center" style={{ background: '#EBDDC5' }}>
      <div className="w-full max-w-5xl">

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
                  key={`left-${cat.id}`}
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
                  {/* Name + details card */}
                  <div className="bg-white p-4 sm:p-5 mb-4 shadow-md"
                    style={{ borderRadius: '4px', transform: 'rotate(-1.5deg)' }}
                  >
                    <h2 className="text-xl sm:text-2xl font-black text-gray-900 uppercase tracking-wide mb-3">
                      {cat.name}
                    </h2>
                    <div className="space-y-1 text-sm text-gray-700"
                      style={{ fontFamily: "'Courier New', monospace" }}
                    >
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

                  {/* Polaroid */}
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
                        <p className="text-center text-[10px] text-gray-500 mt-1"
                          style={{ fontFamily: "'Comic Sans MS', 'Segoe Print', cursive" }}
                        >{cat.name} 💛</p>
                      </div>
                    </div>
                  </div>

                  <div className="absolute bottom-6 left-4 text-lg opacity-50" style={{ transform: 'rotate(-15deg)' }}>
                    {decorStickers[pageIndex % decorStickers.length]}
                  </div>
                  <div className="absolute top-20 right-6 text-sm opacity-40" style={{ transform: 'rotate(10deg)' }}>
                    {decorStickers[(pageIndex + 3) % decorStickers.length]}
                  </div>
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
              {/* Static decorations */}
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

              {/* Animated content */}
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={`right-${cat.id}`}
                  custom={direction}
                  variants={fadeVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.5 }}
                  className="relative z-[5] h-full flex flex-col"
                >
                  {/* Stories header */}
                  <div className="mb-4">
                    <div className="inline-block bg-white/90 px-4 py-2 shadow-md"
                      style={{ transform: 'rotate(1deg)', backgroundImage: 'repeating-linear-gradient(transparent, transparent 19px, #e0e0e0 19px, #e0e0e0 20px)', borderRadius: '2px' }}
                    >
                      <h2 className="text-xl sm:text-2xl font-bold text-gray-800"
                        style={{ fontFamily: "'Comic Sans MS', 'Segoe Print', cursive" }}
                      >Stories</h2>
                    </div>
                  </div>

                  {/* Story note */}
                  <div className="relative bg-white/90 p-4 sm:p-5 shadow-lg mt-2 overflow-y-auto"
                    style={{ transform: 'rotate(0.5deg)', borderRadius: '2px', backgroundImage: 'repeating-linear-gradient(transparent, transparent 27px, #f0e8e0 27px, #f0e8e0 28px)', maxHeight: '340px' }}
                  >
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-12 h-4 opacity-60 z-10"
                      style={{ background: 'linear-gradient(135deg, #f0e68c, #daa520)', borderRadius: '2px' }}
                    />
                    <p className="text-gray-700 text-base sm:text-lg leading-relaxed pt-2"
                      style={{ fontFamily: "'Comic Sans MS', 'Segoe Print', cursive" }}
                    >
                      {cat.storyline || 'This cat found their forever home! A beautiful story of rescue, love, and hope. 🐾'}
                    </p>
                    <div className="mt-6 flex justify-end">
                      <div className="inline-block border-3 border-green-600 text-green-700 px-4 py-2 uppercase font-black text-xs tracking-widest"
                        style={{ transform: 'rotate(-4deg)', borderWidth: '3px', borderRadius: '4px', opacity: 0.8 }}
                      >🎉 Adopted!</div>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-center gap-4 mt-6">
          <button
            onClick={goPrev}
            disabled={pageIndex === 0}
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

          <button
            onClick={goNext}
            disabled={pageIndex === totalPages - 1}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-all disabled:opacity-20 disabled:cursor-not-allowed hover:scale-110"
            style={{ background: '#3d2b1a', color: '#F3D58D' }}
          >
            <ChevronRight size={18} />
          </button>
        </div>

        <p className="sm:hidden text-xs text-center text-[#2E4365]/50 mt-2">
          ← Swipe left or right →
        </p>
      </div>
    </div>
  )
}
