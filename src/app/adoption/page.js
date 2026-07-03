// src/app/adoption/page.js
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useChatContext } from '@/context/ChatContext'
import { getDirectionsUrl } from '@/lib/directions'
import Link from 'next/link'

export default function AdoptionPage() {
  const [cats,       setCats]       = useState([])
  const [ngoNames,   setNgoNames]   = useState({}) // { user_id: org_name }
  const [loading,    setLoading]    = useState(true)
  const [filter,     setFilter]     = useState('all')
  const [searchCity, setSearchCity] = useState('')

  useEffect(() => {
    fetchCats()
  }, [])

  const fetchCats = async () => {
    setLoading(true)

    // Step 1: fetch adoption cats
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

    // Step 2: fetch NGO names separately using the ngo_ids
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

      {/* ── Hero ── */}
      <section className="py-14 px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="text-5xl mb-4">🏠</div>
          <h1 className="text-4xl font-extrabold text-gray-900 mb-3">
            Find Your <span className="text-purple-500">Fur Ever</span> Friend
          </h1>
          <p className="text-gray-500 text-lg">
            Every cat here has a rescue story. Give them their forever home.
          </p>
          <Link href="/map?type=adoption" className="inline-block mt-3 border border-purple-300 text-purple-500 hover:bg-purple-50 px-6 py-3 rounded-xl font-semibold transition text-sm">
            🗺️ View on Map
          </Link>
        </div>
      </section>

      {/* Filters */}
        <section className="px-4 sm:px-6 pb-8">
          <div className="max-w-5xl mx-auto flex flex-col gap-3">
            <input
              type="text"
              value={searchCity}
              onChange={(e) => setSearchCity(e.target.value)}
              placeholder="🔍 Search by city..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400 transition text-sm bg-white"
            />
            <div className="flex gap-2 flex-wrap">
              {[
                { value: 'all',    label: 'All'      },
                { value: 'male',   label: '♂ Male'   },
                { value: 'female', label: '♀ Female' },
              ].map((f) => (
                <button
                  key={f.value}
                  onClick={() => setFilter(f.value)}
                  className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-sm font-medium transition ${filter === f.value ? 'bg-purple-500 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:border-purple-300'}`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </section>

      {/* ── Cat Grid ── */}
      <section className="px-4 pb-16">
        <div className="max-w-5xl mx-auto">

          {/* Loading skeleton */}
          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-3xl overflow-hidden border border-gray-100 animate-pulse">
                  <div className="h-52 bg-gray-200" />
                  <div className="p-5 space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                    <div className="h-3 bg-gray-100 rounded w-3/4" />
                    <div className="h-3 bg-gray-100 rounded-xl" />
                  </div>
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

          {/* Cat cards */}
          {!loading && filteredCats.length > 0 && (
            <>
              {/* Result count */}
              <p className="text-gray-400 text-sm mb-5">
                Showing <strong className="text-gray-700">{filteredCats.length}</strong> cat
                {filteredCats.length !== 1 ? 's' : ''} available
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                {filteredCats.map((cat) => (
                  <CatCard key={cat.id} cat={cat} ngoName={ngoNames[cat.ngo_id]} />
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

    </div>
  )
}

// ── Cat Card Component ────────────────────────────────────
function CatCard({ cat, ngoName }) {
  const [showStory, setShowStory] = useState(false)
  const { openChat } = useChatContext()

  const genderEmoji = { male: '♂', female: '♀', unknown: '?' }

  const handleMessage = () => {
    openChat({
      catType: 'adoption',
      catId: cat.id,
      recipientId: cat.ngo_id,
      catLabel: cat.name,
    })
  }

  return (
    <div className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col">

      <div className="relative">
        {cat.image_url ? (
          <img src={cat.image_url} alt={cat.name} className="w-full h-52 object-cover" />
        ) : (
          <div className="w-full h-52 flex items-center justify-center" style={{ background: '#F3D58D' }}>
            <span className="text-6xl">🐱</span>
          </div>
        )}
        <div className="absolute top-3 left-3 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">Available</div>
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-gray-700 text-xs font-bold px-3 py-1 rounded-full">
          {genderEmoji[cat.gender] || '?'} {cat.gender}
        </div>
      </div>

      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-start justify-between mb-1">
          <h3 className="text-xl font-bold text-gray-900">{cat.name}</h3>
          {cat.age && <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full ml-2 shrink-0">{cat.age}</span>}
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
          {cat.breed && <span>🐾 {cat.breed}</span>}
          {cat.breed && <span>·</span>}
          <span>📍 {cat.city}</span>
        </div>

        <p className="text-gray-500 text-sm leading-relaxed line-clamp-2 mb-3">{cat.description}</p>

        {ngoName && (
          <p className="text-xs text-purple-400 font-medium mb-4">🏢 {ngoName}</p>
        )}

        <div className="mt-auto">
          <button onClick={() => setShowStory(!showStory)} className="w-full text-left bg-purple-50 hover:bg-purple-100 rounded-xl px-4 py-3 text-sm text-purple-600 font-medium transition flex items-center justify-between">
            <span>✨ Read rescue story</span>
            <span>{showStory ? '▲' : '▼'}</span>
          </button>

          {showStory && (
            <div className="bg-purple-50 rounded-b-xl px-4 pb-4 -mt-1">
              <p className="text-sm text-gray-600 leading-relaxed italic pt-2 border-t border-purple-100">&ldquo;{cat.storyline}&rdquo;</p>
            </div>
          )}
        </div>

        {cat.latitude && cat.longitude && (
          <a
            href={getDirectionsUrl(cat.latitude, cat.longitude)}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-center border border-gray-200 text-gray-600 hover:bg-gray-50 font-semibold py-2.5 rounded-xl transition text-sm"
          >
            🧭 Get Directions
          </a>
        )}
        <button
          onClick={handleMessage}
          className="mt-2 w-full bg-purple-500 hover:bg-purple-600 text-white font-semibold py-3 rounded-xl transition text-center text-sm"
        >
          🐱 I Want to Adopt
        </button>
      </div>
    </div>
  )
}