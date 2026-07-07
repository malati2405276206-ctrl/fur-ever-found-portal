// src/app/adoption/page.js
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useChatContext } from '@/context/ChatContext'
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

      {/* ── Page Header ── */}
      <section className="pt-10 pb-4 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 mb-3 px-4 py-1.5 rounded-full bg-white/70 border border-[#2E4365]/30">
            <img src="/icon-emoji/house.png" alt="" width={22} height={22} />
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#2E4365' }}>Adopt, Don&apos;t Shop</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight" style={{ color: '#2E4365' }}>
            Find Your <span style={{ color: '#E59D2C' }}>Fur-Ever</span> Friend
          </h1>
          <p className="text-gray-500 text-sm mt-2 max-w-md mx-auto">
            Every cat here has a rescue story. Give them their forever home.
          </p>
        </div>
      </section>

      {/* ── Search Bar + Actions ── */}
      <section className="px-4 pb-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2">
                <img src="/icon-emoji/search-icon.png" alt="" width={18} height={18} />
              </span>
              <input
                type="text"
                value={searchCity}
                onChange={(e) => setSearchCity(e.target.value)}
                placeholder="Search by city..."
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#2E4365] focus:border-transparent transition text-sm bg-white shadow-sm"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Main Content: Sidebar Filters + Cards ── */}
      <section className="px-4 pb-16">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-6">

          {/* Filter Sidebar */}
          <aside className="w-full lg:w-56 shrink-0">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 lg:sticky lg:top-4">
              <h3 className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-3">Filters</h3>

              {/* Gender */}
              <div className="mb-5">
                <p className="text-xs font-semibold text-gray-600 mb-2">Gender</p>
                <div className="flex flex-col gap-1">
                  {[
                    { value: 'all', label: 'All Cats' },
                    { value: 'male', label: 'Male' },
                    { value: 'female', label: 'Female' },
                  ].map((f) => (
                    <button
                      key={f.value}
                      onClick={() => setFilter(f.value)}
                      className={`px-3 py-2 rounded-lg text-xs font-semibold text-left transition-all ${
                        filter === f.value
                          ? 'text-white shadow-sm'
                          : 'text-gray-500 hover:bg-gray-50'
                      }`}
                      style={filter === f.value ? { background: '#2E4365' } : {}}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* City / Location */}
              <div>
                <p className="text-xs font-semibold text-gray-600 mb-2">City</p>
                <div className="flex flex-col gap-1 max-h-48 overflow-y-auto">
                  {locations.map((location) => (
                    <button
                      key={location}
                      onClick={() => setSelectedLocation(location)}
                      className={`px-3 py-2 rounded-lg text-xs font-medium text-left transition-all ${
                        selectedLocation === location
                          ? 'text-white shadow-sm'
                          : 'text-gray-500 hover:bg-gray-50'
                      }`}
                      style={
                        selectedLocation === location
                          ? { background: '#2E4365' }
                          : {}
                      }
                    >
                      {location === 'all' ? 'All Cities' : location}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Cards Area */}
          <div className="flex-1 min-w-0">

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
            <div className="text-center py-20">
              <div className="w-20 h-20 mx-auto mb-5 rounded-full flex items-center justify-center" style={{ background: '#FFF8E7' }}>
                <img src="/icon-emoji/cat-paw.png" alt="" width={30} height={30} />
              </div>
              <h3 className="text-xl font-bold mb-2" style={{ color: '#2E4365' }}>
                No cats found
              </h3>
              <p className="text-sm max-w-sm mx-auto text-gray-500">
                {searchCity
                  ? `No cats available in "${searchCity}" right now. Try a different city.`
                  : 'No cats available for adoption right now. Check back soon!'}
              </p>
              {searchCity && (
                <button
                  onClick={() => { setSearchCity(''); setSelectedLocation('all') }}
                  className="mt-4 px-5 py-2 rounded-full text-sm font-semibold transition-all text-white"
                  style={{ background: '#2E4365' }}
                >
                  Clear Filters
                </button>
              )}
            </div>
          )}

          {/* Cat cards grid */}
          {!loading && filteredCats.length > 0 && (
            <>
              <p className="text-gray-500 text-sm mb-6">
                <strong className="text-gray-800">{filteredCats.length}</strong> cat{filteredCats.length !== 1 ? 's' : ''} available
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
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
                 Manage in Dashboard
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
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
