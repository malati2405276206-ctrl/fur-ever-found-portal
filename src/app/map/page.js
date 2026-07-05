// src/app/map/page.js
'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import dynamic from 'next/dynamic'
import Link from 'next/link'

// Dynamic import to avoid SSR issues
const MapView = dynamic(() => import('@/components/MapView'), { ssr: false })

export default function MapPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/80 backdrop-blur border border-[var(--gold-light)] flex items-center justify-center shadow-lg">
            <div className="w-8 h-8 border-3 border-[var(--gold)] border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-[var(--police-blue)]/70 text-sm font-medium">Loading map...</p>
        </div>
      </div>
    }>
      <MapPageContent />
    </Suspense>
  )
}

function MapPageContent() {
  const searchParams = useSearchParams()
  const defaultType  = searchParams.get('type') || 'all'

  const [filter,      setFilter]      = useState(defaultType)
  const [lostCats,    setLostCats]    = useState([])
  const [foundCats,   setFoundCats]   = useState([])
  const [loading,     setLoading]     = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [selectedCat, setSelectedCat] = useState(null)

  useEffect(() => {
    fetchAllCats()
  }, [])

  const fetchAllCats = async () => {
    setLoading(true)

    try {
      const [lostRes, foundRes] = await Promise.all([
        supabase
          .from('lost_cats')
          .select('*')
          .not('latitude', 'is', null),

        supabase
          .from('found_cats')
          .select('*')
          .not('latitude', 'is', null),
      ])

      if (lostRes.error) console.error('Lost Cats:', lostRes.error)
      if (foundRes.error) console.error('Found Cats:', foundRes.error)

      setLostCats(lostRes.data || [])
      setFoundCats(foundRes.data || [])
    } catch (err) {
      console.error('Map Fetch Error:', err)
    }

    setLoading(false)
  }

  // Combine cats based on active filter
  const visibleCats = [
    ...(filter === 'all' || filter === 'lost'  ? lostCats.map((c)  => ({ ...c, _type: 'lost'  })) : []),
    ...(filter === 'all' || filter === 'found' ? foundCats.map((c) => ({ ...c, _type: 'found' })) : []),
  ]

  const filters = [
    { value: 'all',   label: 'All Cats',  emoji: '🐾', color: 'bg-[var(--police-blue)] text-white shadow-lg shadow-[var(--police-blue)]/20',  inactive: 'bg-white/80 text-[var(--police-blue)] border border-[var(--gold-light)] hover:border-[var(--gold)] hover:bg-white' },
    { value: 'lost',  label: 'Lost',      emoji: '😿', color: 'bg-red-500 text-white shadow-lg shadow-red-500/20',                            inactive: 'bg-white/80 text-red-600 border border-red-200 hover:border-red-400 hover:bg-red-50' },
    { value: 'found', label: 'Found',     emoji: '😊', color: 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20',                    inactive: 'bg-white/80 text-emerald-600 border border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50' },
  ]

  return (
    <div className="min-h-screen bg-[var(--background)] relative overflow-hidden">

      {/* Decorative background elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-[var(--gold-light)] opacity-20 blur-3xl" />
        <div className="absolute top-1/3 -left-32 w-80 h-80 rounded-full bg-[var(--sky)] opacity-15 blur-3xl" />
        <div className="absolute bottom-20 right-1/4 w-48 h-48 rounded-full bg-[var(--gold)] opacity-10 blur-2xl" />
      </div>

      {/* Header Panel */}
      <div className="relative z-10 bg-white/70 backdrop-blur-md border-b border-[var(--gold-light)]/50 px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            
            {/* Title Section */}
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[var(--gold)] to-[var(--gold-light)] flex items-center justify-center shadow-md">
                <span className="text-xl">🗺️</span>
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-[var(--police-blue)] heading-artistic">
                  Cat Map
                </h1>
                <p className="text-[var(--police-blue)]/60 text-xs sm:text-sm mt-0.5">
                  {loading ? (
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[var(--gold)] animate-pulse" />
                      Loading locations...
                    </span>
                  ) : (
                    `${visibleCats.length} cat${visibleCats.length !== 1 ? 's' : ''} pinned on the map`
                  )}
                </p>
              </div>
            </div>

            {/* Filter Buttons */}
            <div className="flex gap-2 flex-wrap">
              {filters.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setFilter(f.value)}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center gap-1.5 ${
                    filter === f.value ? f.color : f.inactive
                  }`}
                >
                  <span className="text-sm">{f.emoji}</span>
                  {f.label}
                  {filter === f.value && (
                    <span className="ml-1 bg-white/25 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                      {f.value === 'all' ? visibleCats.length : f.value === 'lost' ? lostCats.length : foundCats.length}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Stats Bar & Legend */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-[var(--gold-light)]/30">
            <div className="flex gap-4 text-xs text-[var(--police-blue)]/60 flex-wrap">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-red-500/20" />
                Lost ({lostCats.length})
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" />
                Found ({foundCats.length})
              </span>
            </div>

            {/* Toggle sidebar button (mobile) */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="sm:hidden flex items-center gap-1 text-xs font-medium text-[var(--police-blue)]/70 bg-white/60 px-3 py-1.5 rounded-lg border border-[var(--gold-light)]"
            >
              📋 List
            </button>
          </div>
        </div>
      </div>

      {/* Main Content: Map + Sidebar */}
      <div className="relative z-10 flex flex-col lg:flex-row">

        {/* Map Container */}
        <div className="flex-1 relative">
          {loading ? (
            <div className="h-[calc(100vh-160px)] flex items-center justify-center bg-[var(--cream)]/50">
              <div className="text-center animate-fade-in-up">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/80 backdrop-blur border border-[var(--gold-light)] flex items-center justify-center shadow-lg">
                  <div className="w-8 h-8 border-3 border-[var(--gold)] border-t-transparent rounded-full animate-spin" />
                </div>
                <p className="text-[var(--police-blue)]/70 text-sm font-medium">Fetching cat locations...</p>
                <p className="text-[var(--police-blue)]/40 text-xs mt-1">This may take a moment</p>
              </div>
            </div>
          ) : (
            <div className="relative">
              <MapView cats={visibleCats} selectedCat={selectedCat} />

              {/* Floating refresh button */}
              <button
                onClick={fetchAllCats}
                className="absolute top-4 right-4 z-20 w-10 h-10 bg-white/90 backdrop-blur-sm border border-[var(--gold-light)] rounded-xl shadow-lg flex items-center justify-center text-[var(--police-blue)] hover:bg-white hover:scale-105 transition-all duration-200"
                title="Refresh map"
              >
                🔄
              </button>

              {/* Floating stats badge */}
              <div className="absolute bottom-4 left-4 z-20 bg-white/90 backdrop-blur-sm border border-[var(--gold-light)] rounded-xl shadow-lg px-3 py-2 flex items-center gap-2">
                <span className="text-xs font-semibold text-[var(--police-blue)]">
                  📍 {visibleCats.length} pins
                </span>
                <span className="text-[10px] text-[var(--police-blue)]/50 border-l border-[var(--gold-light)] pl-2">
                  {lostCats.length} lost · {foundCats.length} found
                </span>
              </div>
            </div>
          )}

          {/* No pins message */}
          {!loading && visibleCats.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
              <div className="organic-card p-8 text-center max-w-sm mx-4 pointer-events-auto animate-fade-in-up">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[var(--gold-light)] to-[var(--gold)] flex items-center justify-center">
                  <span className="text-3xl">📍</span>
                </div>
                <h3 className="font-bold text-[var(--police-blue)] text-lg mb-2 heading-artistic">No pins yet</h3>
                <p className="text-[var(--police-blue)]/60 text-sm leading-relaxed">
                  Reports with map locations will appear here. Submit a report and drop a pin to help reunite cats with their families!
                </p>
                <Link
                  href="/report"
                  className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 bg-[var(--gold)] text-white font-semibold text-sm rounded-xl hover:bg-[var(--gold)]/90 transition-all shadow-md hover:shadow-lg"
                >
                  🐱 Report a Cat
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar - Cat List Panel */}
        <div className={`
          lg:w-80 xl:w-96 bg-white/70 backdrop-blur-md border-l border-[var(--gold-light)]/50
          overflow-y-auto transition-all duration-300
          ${sidebarOpen ? 'fixed inset-0 top-auto h-[60vh] z-30 rounded-t-3xl border-t lg:relative lg:h-auto lg:rounded-none lg:border-t-0' : 'hidden lg:block'}
          lg:h-[calc(100vh-160px)]
        `}>
          {/* Sidebar Header */}
          <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm px-4 py-3 border-b border-[var(--gold-light)]/30">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-[var(--police-blue)]">
                Recent Reports
              </h2>
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden w-7 h-7 flex items-center justify-center rounded-full bg-[var(--cream)] text-[var(--police-blue)]/60 text-xs"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Cat List */}
          <div className="p-3 space-y-2">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="animate-pulse bg-white/60 rounded-xl p-3 border border-[var(--gold-light)]/30">
                  <div className="flex gap-3">
                    <div className="w-12 h-12 bg-[var(--gold-light)]/40 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-[var(--gold-light)]/40 rounded w-2/3" />
                      <div className="h-2 bg-[var(--gold-light)]/30 rounded w-1/2" />
                    </div>
                  </div>
                </div>
              ))
            ) : visibleCats.length === 0 ? (
              <div className="text-center py-8 text-[var(--police-blue)]/50 text-sm">
                <span className="text-2xl block mb-2">🐾</span>
                No cats for this filter
              </div>
            ) : (
              visibleCats.slice(0, 20).map((cat, idx) => (
                <div
                  key={`${cat._type}-${cat.id}`}
                  onClick={() => {
                    setSelectedCat(cat)
                    setSidebarOpen(false)
                  }}
                  className={`group rounded-xl p-3 border transition-all duration-200 hover:shadow-md cursor-pointer ${
                    selectedCat && selectedCat.id === cat.id && selectedCat._type === cat._type
                      ? 'bg-white border-[var(--gold)] shadow-md ring-2 ring-[var(--gold)]/30'
                      : 'bg-white/80 hover:bg-white border-[var(--gold-light)]/30 hover:border-[var(--gold)]/50'
                  }`}
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <div className="flex gap-3 items-start">
                    {/* Cat Image/Placeholder */}
                    <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-[var(--cream)] border border-[var(--gold-light)]/50">
                      {cat.image_url ? (
                        <img
                          src={cat.image_url}
                          alt={cat.name || 'Cat'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-lg">
                          {cat._type === 'lost' ? '😿' : '😊'}
                        </div>
                      )}
                    </div>

                    {/* Cat Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-md ${
                          cat._type === 'lost' 
                            ? 'bg-red-100 text-red-600' 
                            : 'bg-emerald-100 text-emerald-600'
                        }`}>
                          {cat._type}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-[var(--police-blue)] truncate">
                        {cat.name || 'Unknown Cat'}
                      </p>
                      <p className="text-xs text-[var(--police-blue)]/50 truncate mt-0.5">
                        📍 {cat.location || cat.city || 'Location unknown'}
                      </p>
                    </div>

                    {/* Locate indicator */}
                    <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs transition-all duration-200 ${
                      selectedCat && selectedCat.id === cat.id && selectedCat._type === cat._type
                        ? 'bg-[var(--gold)] text-white scale-110'
                        : 'bg-[var(--cream)] text-[var(--police-blue)]/40 group-hover:bg-[var(--gold-light)] group-hover:text-[var(--police-blue)]'
                    }`}>
                      📍
                    </div>
                  </div>
                </div>
              ))
            )}

            {!loading && visibleCats.length > 20 && (
              <p className="text-center text-xs text-[var(--police-blue)]/40 py-2">
                + {visibleCats.length - 20} more on the map
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
