// src/app/adoption/page.js
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useChatContext } from '@/context/ChatContext'
import { getDirectionsUrl } from '@/lib/directions'
import Link from 'next/link'

export default function AdoptionPage() {
  const [cats,       setCats]       = useState([])
  const [ngoNames,   setNgoNames]   = useState({})
  const [loading,    setLoading]    = useState(true)
  const [filter,     setFilter]     = useState('all')
  const [searchCity, setSearchCity] = useState('')
  const [selectedCat, setSelectedCat] = useState(null)

  useEffect(() => {
    fetchCats()
  }, [])

  const fetchCats = async () => {
    setLoading(true)

    const { data, error } = await supabase
      .from('adoption_cats')
      .select('*')
      .neq('status', 'deleted')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching cats:', error.message)
      setLoading(false)
      return
    }

    setCats(data || [])

    if (data && data.length > 0) {
      const ngoIds = [...new Set(data.map((c) => c.ngo_id))]

      const { data: ngoData } = await supabase
        .from('ngo_profiles')
        .select('user_id, org_name')
        .in('user_id', ngoIds)

      if (ngoData) {
        const nameMap = {}
        ngoData.forEach((n) => { nameMap[n.user_id] = n.org_name })
        setNgoNames(nameMap)
      }
    }

    setLoading(false)
  }

  const filteredCats = cats.filter((cat) => {
    const matchesGender = filter === 'all' || cat.gender === filter
    const matchesCity   = searchCity === '' || cat.city.toLowerCase().includes(searchCity.toLowerCase())
    return matchesGender && matchesCity
  })

  return (
    <div className="min-h-screen" style={{ background: '#EBDDC5' }}>

      {/* ── Header Section ── */}
      <section className="pt-10 pb-6 px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
            Find Your <span className="text-purple-500">Fur Ever</span> Friend
          </h1>
          <p className="text-gray-500 text-sm">
            Every cat here has a rescue story. Give them their forever home.
          </p>
        </div>
      </section>

      {/* ── Filter Pills ── */}
      <section className="px-4 pb-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 flex-wrap justify-center mb-4">
            {[
              { value: 'all',    label: '🐱 All',     },
              { value: 'male',   label: '♂ Male'   },
              { value: 'female', label: '♀ Female' },
            ].map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 ${
                  filter === f.value
                    ? 'bg-pink-400 text-white shadow-lg shadow-pink-200'
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-pink-300 hover:shadow-sm'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={searchCity}
            onChange={(e) => setSearchCity(e.target.value)}
            placeholder="🔍 Search by city..."
            className="w-full max-w-md mx-auto block px-4 py-2.5 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-300 transition text-sm bg-white"
          />
        </div>
      </section>

      {/* ── View on Map Link ── */}
      <div className="text-center mb-6">
        <Link href="/map?type=adoption" className="inline-block border border-purple-300 text-purple-500 hover:bg-purple-50 px-5 py-2 rounded-full font-semibold transition text-sm">
          🗺️ View on Map
        </Link>
      </div>

      {/* ── Cat Grid ── */}
      <section className="px-4 pb-16">
        <div className="max-w-6xl mx-auto">

          {/* Loading skeleton */}
          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="animate-pulse bg-white p-3 pb-5 rounded-sm shadow-md">
                  <div className="aspect-[4/3] bg-gray-200 mb-3" />
                  <div className="h-4 bg-gray-200 rounded w-2/3 mb-2" />
                  <div className="h-3 bg-gray-100 rounded w-1/2 mb-1" />
                  <div className="h-3 bg-gray-100 rounded w-3/4" />
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && filteredCats.length === 0 && (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">🐾</div>
              <h3 className="text-xl font-bold text-gray-700 mb-2">
                No cats found
              </h3>
              <p className="text-gray-400 text-sm">
                {searchCity
                  ? `No cats available in "${searchCity}" right now.`
                  : 'No cats available for adoption right now. Check back soon!'}
              </p>
            </div>
          )}

          {/* Cat cards grid */}
          {!loading && filteredCats.length > 0 && (
            <>
              <p className="text-gray-400 text-sm mb-5 text-center">
                Showing <strong className="text-gray-700">{filteredCats.length}</strong> cat
                {filteredCats.length !== 1 ? 's' : ''} available
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
                {filteredCats.map((cat) => (
                  <AdoptionCard
                    key={cat.id}
                    cat={cat}
                    ngoName={ngoNames[cat.ngo_id]}
                    onClick={() => setSelectedCat(cat)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* ── NGO CTA ── */}
      <section className="px-4 pb-16">
        <div className="max-w-2xl mx-auto rounded-3xl p-8 text-center text-white" style={{ background: '#2E4365' }}>
          <div className="text-4xl mb-3">🏢</div>
          <h2 className="text-2xl font-bold mb-2">Are you a rescue organisation?</h2>
          <p className="text-purple-100 text-sm mb-6">
            Register your NGO to list cats for adoption and share their rescue stories.
          </p>
          <Link
            href="/ngo-signup"
            className="inline-block bg-white text-purple-600 hover:bg-purple-50 px-6 py-3 rounded-xl font-bold transition"
          >
            Register Your NGO →
          </Link>
        </div>
      </section>

      {/* ── Detail Modal ── */}
      {selectedCat && (
        <CatDetailModal
          cat={selectedCat}
          ngoName={ngoNames[selectedCat.ngo_id]}
          onClose={() => setSelectedCat(null)}
        />
      )}
    </div>
  )
}

// ── Adoption Card (Polaroid Style) ────────────────────────────────────
function AdoptionCard({ cat, ngoName, onClick }) {
  const genderEmoji = { male: '♂', female: '♀', unknown: '?' }
  const { openChat } = useChatContext()

  const handleAdopt = (e) => {
    e.stopPropagation()
    openChat({
      catType: 'adoption',
      catId: cat.id,
      recipientId: cat.ngo_id,
      catLabel: cat.name,
    })
  }

  return (
    <div
      onClick={onClick}
      className="group cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:scale-[1.01]"
    >
      <div className="bg-white p-3 pb-5 rounded-sm shadow-md group-hover:shadow-xl transition-shadow duration-300"
           style={{ boxShadow: '2px 3px 12px rgba(0,0,0,0.1), 0 1px 4px rgba(0,0,0,0.06)' }}>
        {/* Photo area */}
        <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
          {cat.image_url ? (
            <img
              src={cat.image_url}
              alt={cat.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-pink-50">
              <span className="text-5xl">🐱</span>
            </div>
          )}
          {/* Status badge */}
          <div className="absolute top-2 left-2 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
            Available
          </div>
          {/* Gender badge */}
          {cat.gender && cat.gender !== 'unknown' && (
            <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm text-[10px] font-semibold px-2 py-0.5 rounded-full text-gray-700 shadow-sm">
              {genderEmoji[cat.gender]} {cat.gender}
            </div>
          )}
        </div>

        {/* Polaroid caption area */}
        <div className="pt-3 space-y-1.5" style={{ fontFamily: "'Georgia', serif" }}>
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="text-base font-bold text-gray-900 truncate">{cat.name}</h3>
            {cat.age && <span className="text-xs text-gray-400 whitespace-nowrap italic">{cat.age}</span>}
          </div>
          {cat.breed && (
            <p className="text-xs text-gray-500 truncate">🐾 {cat.breed}</p>
          )}
          <p className="text-xs text-gray-400 truncate">📍 {cat.city}</p>
          {cat.description && (
            <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed italic">{cat.description}</p>
          )}
          {ngoName && (
            <p className="text-[11px] text-purple-400 font-medium truncate">🏢 {ngoName}</p>
          )}

          {/* Adopt button */}
          <button
            onClick={handleAdopt}
            className="w-full mt-2 py-2 rounded-lg font-semibold text-xs transition-all duration-200 text-white shadow-sm hover:shadow-md"
            style={{ fontFamily: "sans-serif", background: '#e8837c', }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#d9706a'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#e8837c'}
          >
            🐱 I Want to Adopt
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Cat Detail (Full Screen Overlay) ────────────────────────────
function CatDetailModal({ cat, ngoName, onClose }) {
  const { openChat } = useChatContext()

  const handleMessage = () => {
    openChat({
      catType: 'adoption',
      catId: cat.id,
      recipientId: cat.ngo_id,
      catLabel: cat.name,
    })
  }

  // Close on escape key
  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleEsc)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = ''
    }
  }, [onClose])

  const genderEmoji = { male: '♂', female: '♀', unknown: '?' }

  return (
    <div className="fixed inset-0 z-50 bg-white overflow-y-auto animate-fade-in">
      {/* Top navigation bar */}
      <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <button
          onClick={onClose}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition font-medium text-sm"
        >
          <span className="text-lg">←</span> Back to all cats
        </button>
        <button className="w-9 h-9 bg-pink-50 rounded-full flex items-center justify-center hover:bg-pink-100 transition">
          <span className="text-pink-400 text-lg">♡</span>
        </button>
      </div>

      {/* Content: Two-column layout on desktop */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">

          {/* Left: Large image */}
          <div className="relative rounded-2xl overflow-hidden bg-pink-50 aspect-[4/3] lg:aspect-auto lg:min-h-[500px]">
            {cat.image_url ? (
              <img
                src={cat.image_url}
                alt={cat.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-9xl">🐱</span>
              </div>
            )}
            {/* NGO badge on image */}
            {ngoName && (
              <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-black/40 backdrop-blur-sm rounded-full px-4 py-2">
                <span className="text-white text-sm font-medium">🏢 {ngoName}</span>
              </div>
            )}
          </div>

          {/* Right: Details */}
          <div className="flex flex-col justify-center">
            {/* Name */}
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              {cat.name}
            </h1>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-6">
              {cat.age && (
                <span className="px-4 py-1.5 rounded-full text-sm font-medium bg-blue-50 text-blue-600 border border-blue-100">
                  {cat.age}
                </span>
              )}
              {cat.gender && cat.gender !== 'unknown' && (
                <span className="px-4 py-1.5 rounded-full text-sm font-medium bg-pink-50 text-pink-600 border border-pink-100">
                  {genderEmoji[cat.gender]} {cat.gender}
                </span>
              )}
              {cat.breed && (
                <span className="px-4 py-1.5 rounded-full text-sm font-medium bg-green-50 text-green-600 border border-green-100">
                  � {cat.breed}
                </span>
              )}
              {cat.city && (
                <span className="px-4 py-1.5 rounded-full text-sm font-medium bg-yellow-50 text-yellow-700 border border-yellow-100">
                  � {cat.city}
                </span>
              )}
            </div>

            {/* Description */}
            {cat.description && (
              <p className="text-gray-600 text-base leading-relaxed mb-6">
                {cat.description}
              </p>
            )}

            {/* Rescue story */}
            {cat.storyline && (
              <div className="bg-purple-50 rounded-xl p-5 mb-6">
                <p className="text-sm font-semibold text-purple-500 mb-2">✨ Rescue Story</p>
                <p className="text-gray-600 italic leading-relaxed">
                  &ldquo;{cat.storyline}&rdquo;
                </p>
              </div>
            )}

            {/* Updated date */}
            {cat.created_at && (
              <p className="text-sm text-gray-400 mb-6">
                Listed {new Date(cat.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
              </p>
            )}

            {/* Actions */}
            <div className="space-y-3">
              <button
                onClick={handleMessage}
                className="w-full py-4 rounded-2xl font-semibold text-base transition-all duration-200 bg-pink-400 hover:bg-pink-500 text-white shadow-lg shadow-pink-200 hover:shadow-pink-300"
              >
                🐱 I Want to Adopt
              </button>

              {cat.latitude && cat.longitude && (
                <a
                  href={getDirectionsUrl(cat.latitude, cat.longitude)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center py-3.5 rounded-2xl font-semibold text-sm border border-gray-200 text-gray-600 hover:bg-gray-50 transition"
                >
                  🧭 Get Directions
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
