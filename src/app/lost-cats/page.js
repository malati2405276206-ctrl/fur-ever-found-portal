// src/app/lost-cats/page.js
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import AIMatchButton from '@/components/AIMatchButton'
import { useChatContext } from '@/context/ChatContext'
import { getDirectionsUrl } from '@/lib/directions'

export default function LostCatsPage() {
  const { user } = useAuth()
  const [cats, setCats] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('lost')
  const [selectedCat, setSelectedCat] = useState(null)

  useEffect(() => {
    fetchCats()
  }, [])

  const fetchCats = async () => {
    setLoading(true)

    const { data, error } = await supabase
      .from('lost_cats')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching lost cats:', error.message)
    } else {
      setCats(data || [])
    }

    setLoading(false)
  }

  // Mark cat as reunited (only owner can do this)
  const handleMarkReunited = async (catId) => {
    const { error } = await supabase
      .from('lost_cats')
      .update({ status: 'reunited' })
      .eq('id', catId)

    if (error) {
      console.error('Error updating status:', error.message)
      return
    }

    setCats((prev) =>
      prev.map((cat) =>
        cat.id === catId ? { ...cat, status: 'reunited' } : cat
      )
    )
    if (selectedCat?.id === catId) {
      setSelectedCat((prev) => ({ ...prev, status: 'reunited' }))
    }
  }

  const filteredCats = cats.filter((cat) => {
    const matchesStatus = filterStatus === 'all' || cat.status === filterStatus
    const matchesSearch =
      search === '' ||
      cat.name.toLowerCase().includes(search.toLowerCase()) ||
      cat.location.toLowerCase().includes(search.toLowerCase()) ||
      cat.description.toLowerCase().includes(search.toLowerCase())
    return matchesStatus && matchesSearch
  })

  return (
    <div className="min-h-screen" style={{ background: '#EBDDC5' }}>

      {/* ── Hero ── */}
      <section className="pt-14 pb-6 px-4">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-5xl sm:text-6xl font-black text-gray-900 mb-3 tracking-tight uppercase">
            LOST CATS
          </h1>
          <p className="text-gray-600 text-base mb-5">
            These cats are missing. Recognise one? Help them find their way home.
          </p>

          {/* Filter pills */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm font-bold text-gray-800">Filter:</span>
            {[
              { value: 'lost', label: 'Lost' },
              { value: 'reunited', label: 'Reunited' },
              { value: 'all', label: 'All' },
            ].map((f) => (
              <button
                key={f.value}
                onClick={() => setFilterStatus(f.value)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium border transition ${
                  filterStatus === f.value
                    ? 'text-white border-transparent'
                    : 'bg-white border-gray-300 hover:border-[#E59D2C]'
                }`}
                style={filterStatus === f.value ? { background: '#2E4365', color: '#fff' } : { color: '#2E4365' }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Search + Actions ── */}
      <section className="px-4 pb-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 Search by name, location or description..."
            className="flex-1 px-4 py-3 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#E59D2C] transition text-sm bg-white"
          />
          <div className="flex gap-2">
            {user && (
              <Link
                href="/report"
                className="inline-flex items-center text-white px-5 py-3 rounded-full font-semibold transition text-sm whitespace-nowrap hover:opacity-90"
                style={{ background: '#2E4365' }}
              >
                + Report Lost
              </Link>
            )}
            <Link
              href="/map?type=lost"
              className="inline-flex items-center border px-5 py-3 rounded-full font-semibold transition text-sm whitespace-nowrap hover:opacity-80"
              style={{ borderColor: '#2E4365', color: '#2E4365' }}
            >
              🗺️ Map
            </Link>
          </div>
        </div>
      </section>

      {/* ── Cards Grid ── */}
      <section className="px-4 pb-16">
        <div className="max-w-5xl mx-auto">

          {/* Loading skeleton */}
          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="recipe-card animate-pulse">
                  <div className="recipe-card-inner">
                    <div className="h-52 bg-gray-200 rounded-xl" />
                    <div className="p-4 space-y-3">
                      <div className="h-5 bg-gray-200 rounded w-2/3" />
                      <div className="h-3 bg-gray-100 rounded w-1/2" />
                    </div>
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
                {search
                  ? `No results for "${search}"`
                  : 'No lost cat reports yet.'}
              </p>
              {user && (
                <Link
                  href="/report"
                  className="mt-4 inline-block text-white px-5 py-2 rounded-full text-sm font-semibold hover:opacity-90 transition"
                  style={{ background: '#2E4365' }}
                >
                  Be the first to report →
                </Link>
              )}
            </div>
          )}

          {/* Result count + cards */}
          {!loading && filteredCats.length > 0 && (
            <>
              <p className="text-gray-500 text-sm mb-6">
                <strong className="text-gray-800">{filteredCats.length}</strong> report
                {filteredCats.length !== 1 ? 's' : ''} found
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                {filteredCats.map((cat) => (
                  <RecipeStyleCard
                    key={cat.id}
                    cat={cat}
                    onClick={() => setSelectedCat(cat)}
                    type="lost"
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* ── Detail Modal ── */}
      {selectedCat && (
        <CatDetailModal
          cat={selectedCat}
          type="lost"
          currentUserId={user?.id}
          onClose={() => setSelectedCat(null)}
          onMarkReunited={handleMarkReunited}
        />
      )}
    </div>
  )
}

// ── Recipe-Style Card ─────────────────────────────────────
function RecipeStyleCard({ cat, onClick, type }) {
  const isReunited = cat.status === 'reunited'
  const colors = type === 'lost'
    ? ['#f87171', '#fb923c', '#fbbf24', '#a78bfa', '#60a5fa']
    : ['#4ade80', '#34d399', '#2dd4bf', '#60a5fa', '#a78bfa']

  // Deterministic color from cat id
  const bgColor = colors[cat.id?.charCodeAt(0) % colors.length] || colors[0]

  return (
    <div
      className="recipe-card group"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      aria-label={`View details for ${cat.name || 'found cat'}`}
    >
      <div className="recipe-card-inner">
        {/* Paperclip decoration */}
        <div className="recipe-card-clip">
          <svg width="24" height="56" viewBox="0 0 24 56" fill="none">
            <path
              d="M12 2C6.5 2 2 6 2 11v30c0 5 4.5 9 10 9s10-4 10-9V11c0-3.5-2.5-6-6-6s-6 2.5-6 6v28c0 1.5 1 3 3 3s3-1.5 3-3V13"
              stroke="#9ca3af"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* Image area with colored background */}
        <div className="recipe-card-image" style={{ backgroundColor: bgColor }}>
          {cat.image_url ? (
            <img
              src={cat.image_url}
              alt={cat.name || 'Lost cat'}
              className={`w-full h-full object-cover ${isReunited ? 'opacity-70 grayscale' : ''}`}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-6xl">🐱</span>
            </div>
          )}

          {/* Status badge */}
          <div className={`absolute top-3 left-3 text-xs font-bold px-3 py-1 rounded-full shadow-md ${
            isReunited ? 'bg-green-200 text-green-800' : 'bg-rose-200 text-rose-800'
          }`}>
            {isReunited ? '🎉 Reunited' : '😿 Lost'}
          </div>
        </div>

        {/* Card body with lined paper effect */}
        <div className="recipe-card-body">
          <h3 className="text-lg font-black text-gray-900 uppercase tracking-wide leading-tight mb-1">
            {cat.name || 'Unknown'}
          </h3>
          <div className="flex items-center gap-2 mt-2">
            <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center text-xs">
              📍
            </div>
            <span className="text-xs text-gray-500 truncate">{cat.location}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Detail Modal ──────────────────────────────────────────
function CatDetailModal({ cat, type, currentUserId, onClose, onMarkReunited }) {
  const { openChat } = useChatContext()
  const isOwner = currentUserId && currentUserId === cat.user_id
  const isReunited = cat.status === 'reunited'

  const handleMessage = () => {
    openChat({
      catType: 'lost',
      catId: cat.id,
      recipientId: cat.user_id,
      catLabel: cat.name,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal content */}
      <div
        className="relative bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/80 flex items-center justify-center text-gray-600 hover:bg-white hover:text-gray-900 transition shadow-sm"
          aria-label="Close"
        >
          ✕
        </button>

        {/* Image */}
        <div className="relative">
          {cat.image_url ? (
            <img
              src={cat.image_url}
              alt={cat.name}
              className={`w-full h-80 object-contain bg-gray-50 rounded-t-3xl ${isReunited ? 'opacity-70 grayscale' : ''}`}
            />
          ) : (
            <div className="w-full h-80 flex items-center justify-center rounded-t-3xl" style={{ background: '#F3D58D' }}>
              <span className="text-7xl">🐱</span>
            </div>
          )}
          <div className={`absolute top-4 left-4 text-sm font-bold px-4 py-1.5 rounded-full ${
            isReunited ? 'bg-green-200 text-green-800' : 'bg-rose-200 text-rose-800'
          }`}>
            {isReunited ? '🎉 Reunited' : '😿 Lost'}
          </div>
        </div>

        {/* Details */}
        <div className="p-6">
          <h2 className="text-2xl font-black text-gray-900 mb-1">{cat.name}</h2>
          <p className="text-sm text-orange-500 font-semibold mb-4">📍 {cat.location}</p>

          <p className="text-gray-600 text-sm leading-relaxed mb-4">{cat.description}</p>

          <p className="text-xs text-gray-400 mb-6">
            Reported {new Date(cat.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>

          {/* Action buttons */}
          <div className="space-y-2">
            {!isReunited && !isOwner && currentUserId && (
              <button
                onClick={handleMessage}
                className="w-full text-white font-semibold py-3 rounded-xl transition text-sm hover:opacity-90"
                style={{ background: '#E59D2C' }}
              >
                💬 I Spotted This Cat!
              </button>
            )}

            {!isReunited && !currentUserId && (
              <a
                href="/login"
                className="block w-full text-center text-white font-semibold py-3 rounded-xl transition text-sm hover:opacity-90"
                style={{ background: '#E59D2C' }}
              >
                Login to Message
              </a>
            )}

            {cat.latitude && cat.longitude && (
              <a
                href={getDirectionsUrl(cat.latitude, cat.longitude)}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center border font-semibold py-3 rounded-xl transition text-sm hover:opacity-80"
                style={{ borderColor: '#2E4365', color: '#2E4365' }}
              >
                🧭 Get Directions
              </a>
            )}

            {isOwner && !isReunited && (
              <button
                onClick={() => onMarkReunited(cat.id)}
                className="w-full border border-green-300 text-green-600 hover:bg-green-50 font-semibold py-3 rounded-xl transition text-sm"
              >
                🎉 Mark as Reunited
              </button>
            )}

            {isReunited && (
              <div className="text-center text-green-600 font-semibold text-sm py-3">
                🎉 This cat found their way home!
              </div>
            )}

            {!isReunited && (
              <AIMatchButton lostCat={cat} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
