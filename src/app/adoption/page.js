// src/app/adoption/page.js
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useChatContext } from '@/context/ChatContext'
import { getDirectionsUrl } from '@/lib/directions'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { useRole } from '@/hooks/useRole'
import { useRouter } from 'next/navigation'

export default function AdoptionPage() {
  const [cats,       setCats]       = useState([])
  const [ngoNames,   setNgoNames]   = useState({})
  const [loading,    setLoading]    = useState(true)
  const [filter,     setFilter]     = useState('all')
  const [searchCity, setSearchCity] = useState('')
  const [selectedLocation, setSelectedLocation] = useState('all')
  const [selectedCat, setSelectedCat] = useState(null)
  const { user } = useAuth()
  const { isNGO } = useRole()
  const router = useRouter()

  useEffect(() => {
    fetchCats()
  }, [])

  const fetchCats = async () => {
    setLoading(true)

    const { data, error } = await supabase
      .from('adoption_cats')
      .select('*')
      .eq('status', 'available')
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

  const locations = [
    'all',
    ...new Set(
      cats
        .map((cat) => cat.city)
        .filter(Boolean)
    ),
  ]

  const filteredCats = cats.filter((cat) => {
    const matchesGender =
      filter === 'all' || cat.gender === filter

    const matchesSearch =
      searchCity === '' ||
      cat.city?.toLowerCase().includes(searchCity.toLowerCase())

    const matchesLocation =
      selectedLocation === 'all' ||
      cat.city === selectedLocation

    return matchesGender && matchesSearch && matchesLocation
  })

  return (
    <div className="min-h-screen" style={{ background: '#EBDDC5' }}>

      {/* ── Hero Header Section ── */}
      <section className="relative pt-14 pb-10 px-4 overflow-hidden">
        {/* Decorative floating paws */}
        <div className="absolute top-6 left-8 text-4xl opacity-15 animate-float-slow select-none" aria-hidden="true"><img src="/icon-emoji/cat-paw.png" alt="" width={30} height={30} /></div>
        <div className="absolute top-12 right-12 text-3xl opacity-10 animate-float select-none" aria-hidden="true"><img src="/icon-emoji/cat-paw.png" alt="" width={30} height={30} /></div>
        <div className="absolute bottom-4 left-1/4 text-2xl opacity-10 animate-float select-none" style={{ animationDelay: '1s' }} aria-hidden="true"><img src="/icon-emoji/cat-paw.png" alt="" width={30} height={30} /></div>

        <div className="max-w-3xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-4 animate-fade-in-up" style={{ background: '#2E4365', color: '#F3D58D' }}>
            <img src="/icon-emoji/house.png" alt="" width={30} height={30} className="inline-block" /> Adopt, Don&apos;t Shop
          </div>
          <h1 className="heading-artistic text-4xl md:text-5xl mb-3 animate-fade-in-up" style={{ color: '#2E4365', animationDelay: '0.1s' }}>
            Find Your <span style={{ color: '#E59D2C' }}>Fur-Ever</span> Friend
          </h1>
          <p className="text-base md:text-lg max-w-lg mx-auto animate-fade-in-up" style={{ color: '#2E4365', opacity: 0.7, animationDelay: '0.2s' }}>
            Every cat here has a rescue story. Give them their forever home.
          </p>
        </div>
      </section>

      {/* ── Search & Filters Section ── */}
      <section className="px-4 pb-8">
        <div className="max-w-4xl mx-auto">
          {/* Search bar */}
          <div className="relative max-w-xl mx-auto mb-6 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <svg className="w-5 h-5" style={{ color: '#E59D2C' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={searchCity}
              onChange={(e) => setSearchCity(e.target.value)}
              placeholder="Search by city..."
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl border-2 focus:outline-none transition-all duration-200 text-sm font-medium shadow-sm"
              style={{
                background: '#ffffff',
                borderColor: searchCity ? '#E59D2C' : '#e5e7eb',
                color: '#2E4365',
              }}
              onFocus={(e) => e.target.style.borderColor = '#E59D2C'}
              onBlur={(e) => { if (!searchCity) e.target.style.borderColor = '#e5e7eb' }}
            />
            {searchCity && (
              <button
                onClick={() => setSearchCity('')}
                className="absolute inset-y-0 right-4 flex items-center text-gray-400 hover:text-gray-600 transition"
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          {/* Gender filter pills */}
          <div className="flex items-center gap-3 flex-wrap justify-center mb-5 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            {[
              { value: 'all',    label: 'All Cats',  icon: '/icon-emoji/cat-face.png' },
              { value: 'male',   label: 'Male',      icon: null },
              { value: 'female', label: 'Female',    icon: null },
            ].map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className="px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 border-2 flex items-center gap-1.5"
                style={
                  filter === f.value
                    ? { background: '#2E4365', color: '#F3D58D', borderColor: '#2E4365', boxShadow: '0 4px 12px rgba(46,67,101,0.25)' }
                    : { background: '#ffffff', color: '#2E4365', borderColor: '#e5e7eb' }
                }
                onMouseEnter={(e) => {
                  if (filter !== f.value) e.currentTarget.style.borderColor = '#E59D2C'
                }}
                onMouseLeave={(e) => {
                  if (filter !== f.value) e.currentTarget.style.borderColor = '#e5e7eb'
                }}
              >
                {f.icon && <img src={f.icon} alt="" width={16} height={16} className="inline-block" />}{f.label}
              </button>
            ))}
          </div>

          {/* City location pills */}
          <div className="flex gap-2 overflow-x-auto pb-2 justify-center flex-wrap animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
            {locations.map((location) => (
              <button
                key={location}
                onClick={() => setSelectedLocation(location)}
                className="px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 border"
                style={
                  selectedLocation === location
                    ? { background: '#E59D2C', color: '#ffffff', borderColor: '#E59D2C', boxShadow: '0 2px 8px rgba(229,157,44,0.3)' }
                    : { background: '#ffffff', color: '#2E4365', borderColor: '#e5e7eb' }
                }
                onMouseEnter={(e) => {
                  if (selectedLocation !== location) {
                    e.currentTarget.style.borderColor = '#F3D58D'
                    e.currentTarget.style.background = '#FFF8E7'
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedLocation !== location) {
                    e.currentTarget.style.borderColor = '#e5e7eb'
                    e.currentTarget.style.background = '#ffffff'
                  }
                }}
              >
                {location === 'all'
                  ? '🌍 All Cities'
                  : location}
              </button>
            ))}
          </div>

          {/* View on Map button */}
          <div className="text-center mt-6 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
            <Link
              href="/map?type=adoption"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full font-semibold transition-all duration-200 text-sm border-2"
              style={{ borderColor: '#2E4365', color: '#2E4365' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#2E4365'; e.currentTarget.style.color = '#F3D58D' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#2E4365' }}
            >
              <img src="/icon-emoji/map.png" alt="" width={30} height={30} className="inline-block" /> View on Map
            </Link>
          </div>
        </div>
      </section>

      {/* ── Cat Grid ── */}
      <section className="px-4 pb-16">
        <div className="max-w-6xl mx-auto">

          {/* Loading skeleton */}
          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="animate-pulse bg-white p-3 pb-5 rounded-2xl shadow-sm" style={{ border: '1px solid #F3D58D' }}>
                  <div className="aspect-[4/3] bg-gray-200 rounded-xl mb-3" />
                  <div className="h-4 bg-gray-200 rounded-full w-2/3 mb-2" />
                  <div className="h-3 bg-gray-100 rounded-full w-1/2 mb-1" />
                  <div className="h-3 bg-gray-100 rounded-full w-3/4" />
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && filteredCats.length === 0 && (
            <div className="text-center py-20 animate-fade-in-up">
              <div className="w-20 h-20 mx-auto mb-5 rounded-full flex items-center justify-center" style={{ background: '#FFF8E7' }}>
                <img src="/icon-emoji/cat-paw.png" alt="" width={30} height={30} />
              </div>
              <h3 className="text-xl font-bold mb-2 heading-artistic" style={{ color: '#2E4365' }}>
                No cats found
              </h3>
              <p className="text-sm max-w-sm mx-auto" style={{ color: '#2E4365', opacity: 0.6 }}>
                {searchCity
                  ? `No cats available in "${searchCity}" right now. Try a different city.`
                  : 'No cats available for adoption right now. Check back soon!'}
              </p>
              {searchCity && (
                <button
                  onClick={() => { setSearchCity(''); setSelectedLocation('all') }}
                  className="mt-4 px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200"
                  style={{ background: '#2E4365', color: '#F3D58D' }}
                >
                  Clear Filters
                </button>
              )}
            </div>
          )}

          {/* Cat cards grid */}
          {!loading && filteredCats.length > 0 && (
            <>
              <div className="flex items-center justify-center gap-2 mb-6">
                <div className="h-px flex-1 max-w-[60px]" style={{ background: '#E59D2C', opacity: 0.3 }} />
                <p className="text-sm font-medium" style={{ color: '#2E4365', opacity: 0.7 }}>
                  Showing <strong style={{ color: '#2E4365', opacity: 1 }}>{filteredCats.length}</strong> cat{filteredCats.length !== 1 ? 's' : ''} available
                </p>
                <div className="h-px flex-1 max-w-[60px]" style={{ background: '#E59D2C', opacity: 0.3 }} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
                {filteredCats.map((cat) => (
                    <AdoptionCard
                      key={cat.id}
                      cat={cat}
                      ngoName={ngoNames[cat.ngo_id]}
                      currentUserId={user?.id}
                      isNGO={isNGO}
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
        <div className="max-w-2xl mx-auto rounded-3xl p-10 text-center text-white relative overflow-hidden" style={{ background: '#2E4365' }}>
          {/* Decorative background elements */}
          <div className="absolute top-4 right-6 text-5xl opacity-10 select-none" aria-hidden="true"><img src="/icon-emoji/cat-face.png" alt="" width={60} height={60} /></div>
          <div className="absolute bottom-4 left-6 text-4xl opacity-10 select-none" aria-hidden="true"><img src="/icon-emoji/cat-paw.png" alt="" width={30} height={30} /></div>

          <div className="relative z-10">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: 'rgba(243,213,141,0.2)' }}>
              <img src="/icon-emoji/house.png" alt="" width={30} height={30} />
            </div>
            <h2 className="text-2xl font-bold mb-2 heading-artistic">Are you a rescue organisation?</h2>
            <p className="text-sm mb-6" style={{ color: '#F3D58D', opacity: 0.9 }}>
              Register your NGO to list cats for adoption and share their rescue stories.
            </p>
            <Link
              href="/ngo-signup"
              className="inline-flex items-center gap-2 px-7 py-3 rounded-full font-bold transition-all duration-200 text-sm hover:scale-105"
              style={{ background: '#F3D58D', color: '#2E4365' }}
            >
              Register Your NGO <span>→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Detail Modal ── */}
      {selectedCat && (
        <CatDetailModal
          cat={selectedCat}
          ngoName={ngoNames[selectedCat.ngo_id]}
          currentUserId={user?.id}
          isNGO={isNGO}
          onClose={() => setSelectedCat(null)}
        />
      )}
    </div>
  )
}

// ── Adoption Card (Polaroid Style) ────────────────────────────────────
function AdoptionCard({ cat, ngoName, currentUserId, isNGO, onClick, }) 
{
  const genderEmoji = { male: '♂', female: '♀', unknown: '?' }
  const router = useRouter()
  const isOwnCat = currentUserId === cat.ngo_id

  const handleAdopt = (e) => {
    e.stopPropagation()

    if (!currentUserId) {
      router.push('/login')
      return
    }

    router.push(`/adoption/${cat.id}/apply`)
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
              <img src="/icon-emoji/cat-face.png" alt="" width={60} height={60} />
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
            <p className="text-xs text-gray-500 truncate flex items-center gap-1"><img src="/icon-emoji/cat-paw.png" alt="" width={30} height={30} className="inline-block" /> {cat.breed}</p>
          )}
          <p className="text-xs text-gray-400 truncate flex items-center gap-1"><img src="/icon-emoji/paw-shaped location pin.png" alt="" width={30} height={30} className="inline-block" /> {cat.city}</p>
          {cat.description && (
            <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed italic">{cat.description}</p>
          )}
          {ngoName && (
            <p className="text-[11px] text-purple-400 font-medium truncate flex items-center gap-1"><img src="/icon-emoji/house.png" alt="" width={30} height={30} className="inline-block" /> {ngoName}</p>
          )}

          <div className="mt-2 space-y-2">
            {isOwnCat ? (
              <Link
                href="/ngo-dashboard"
                onClick={(e) => e.stopPropagation()}
                className="block w-full text-center py-2 rounded-lg font-semibold text-xs bg-purple-100 hover:bg-purple-200 text-purple-700 transition"
              >
                ✏️ Manage in Dashboard
              </Link>
            ) : !isNGO ? (
              <button
                onClick={handleAdopt}
                className="w-full py-2 rounded-lg font-semibold text-xs transition-all duration-200 text-white shadow-sm hover:shadow-md flex items-center justify-center gap-1"
                style={{ fontFamily: 'sans-serif', background: '#e8837c' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#d9706a')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#e8837c')}
              >
                <img src="/icon-emoji/house.png" alt="" width={30} height={30} className="inline-block" /> I Want to Adopt
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Cat Detail (Full Screen Overlay) ────────────────────────────
function CatDetailModal({ cat, ngoName, currentUserId, isNGO, onClose }) 
{
  const { openChat } = useChatContext()
  const isOwnCat = currentUserId === cat.ngo_id
  const router = useRouter()

  const handleMessage = () => {
    if (!currentUserId) {
      router.push('/login')
      return
    }

    router.push(`/adoption/${cat.id}/apply`)
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

  const handleDelete = async () => {
    const confirmed = window.confirm(
      `Delete ${cat.name}'s adoption listing?`
    )

    if (!confirmed) return

    const { error } = await supabase
      .from('adoption_cats')
      .update({ status: 'deleted' })
      .eq('id', cat.id)

    if (error) {
      console.error(error)
      alert(error.message)
      return
    }

    window.location.reload()
  }

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
                <img src="/icon-emoji/cat-face.png" alt="" width={60} height={60} />
              </div>
            )}
            {/* NGO badge on image */}
            {ngoName && (
              <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-black/40 backdrop-blur-sm rounded-full px-4 py-2">
                <span className="text-white text-sm font-medium flex items-center gap-1"><img src="/icon-emoji/house.png" alt="" width={30} height={30} className="inline-block" /> {ngoName}</span>
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
                <span className="px-4 py-1.5 rounded-full text-sm font-medium bg-green-50 text-green-600 border border-green-100 flex items-center gap-1">
                  <img src="/icon-emoji/cat-paw.png" alt="" width={30} height={30} className="inline-block" /> {cat.breed}
                </span>
              )}
              {cat.city && (
                <span className="px-4 py-1.5 rounded-full text-sm font-medium bg-yellow-50 text-yellow-700 border border-yellow-100 flex items-center gap-1">
                  <img src="/icon-emoji/paw-shaped location pin.png" alt="" width={30} height={30} className="inline-block" /> {cat.city}
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
                <p className="text-sm font-semibold text-purple-500 mb-2 flex items-center gap-1"><img src="/icon-emoji/sparkle.png" alt="" width={30} height={30} className="inline-block" /> Rescue Story</p>
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
              {isOwnCat ? (
                  <div className="space-y-2">
                    <Link
                      href="/ngo-dashboard"
                      onClick={(e) => e.stopPropagation()}
                      className="block w-full text-center py-2 rounded-lg font-semibold text-xs bg-purple-100 hover:bg-purple-200 text-purple-700 transition"
                    >
                      ✏️ Manage in Dashboard
                    </Link>

                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete()
                      }}
                      className="w-full py-2 rounded-lg font-semibold text-xs bg-red-100 hover:bg-red-200 text-red-600 transition"
                    >
                      🗑 Delete Listing
                    </button>
                  </div>
                ) : !isNGO ? (
                <button
                  onClick={handleMessage}
                  className="w-full py-4 rounded-2xl font-semibold text-base transition-all duration-200 bg-pink-400 hover:bg-pink-500 text-white shadow-lg shadow-pink-200 hover:shadow-pink-300 flex items-center justify-center gap-2"
                >
                  <img src="/icon-emoji/cat-face.png" alt="" width={30} height={30} className="inline-block" /> I Want to Adopt
                </button>
              ) : null}

              {cat.latitude && cat.longitude && (
                <a
                  href={getDirectionsUrl(cat.latitude, cat.longitude)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center py-3.5 rounded-2xl font-semibold text-sm border border-gray-200 text-gray-600 hover:bg-gray-50 transition flex items-center justify-center gap-1"
                >
                  <img src="/icon-emoji/direction.png" alt="" width={30} height={30} className="inline-block" /> Get Directions
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
