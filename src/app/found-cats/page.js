// src/app/found-cats/page.js
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { useChatContext } from '@/context/ChatContext'
import { getDirectionsUrl } from '@/lib/directions'

export default function FoundCatsPage() {
  const { user } = useAuth()
  const [cats, setCats] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedLocation, setSelectedLocation] = useState('all')
  const [selectedCat, setSelectedCat] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchCats()
  }, [])

  const fetchCats = async () => {
    setLoading(true)

    const { data, error } = await supabase
      .from('found_cats')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching found cats:', error.message)
    } else {
      setCats(data || [])
    }

    setLoading(false)
  }

  // Delete report (only owner can do this)
  const handleDelete = async (catId) => {
    setDeleting(true)
    const { error } = await supabase
      .from('found_cats')
      .delete()
      .eq('id', catId)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error deleting report:', error.message)
      setDeleting(false)
      return
    }

    setCats((prev) => prev.filter((cat) => cat.id !== catId))
    setSelectedCat(null)
    setDeleteConfirm(null)
    setDeleting(false)
  }

  const locations = [
    'all',
    ...new Set(
      cats
        .map((cat) => cat.location)
        .filter(Boolean)
    ),
  ]

  const filteredCats = cats.filter((cat) => {
    const matchesSearch =
      search === '' ||
      cat.location.toLowerCase().includes(search.toLowerCase()) ||
      cat.description.toLowerCase().includes(search.toLowerCase())

    const matchesLocation =
      selectedLocation === 'all' ||
      cat.location === selectedLocation

    return matchesSearch && matchesLocation
  })

  return (
    <div className="min-h-screen" style={{ background: '#EBDDC5' }}>

      {/* ── Page Header ── */}
      <section className="pt-10 pb-4 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 mb-3 px-4 py-1.5 rounded-full bg-white/70 border border-[#2E4365]/30">
            <img src="/icon-emoji/found-cat.png" alt="" width={22} height={22} />
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#2E4365' }}>Spotted & Safe</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight" style={{ color: '#2E4365' }}>
            Found Cats
          </h1>
          <p className="text-gray-500 text-sm mt-2 max-w-md mx-auto">
            Someone found these cats. Is one of them yours? Click a card for details.
          </p>
        </div>
      </section>

      {/* ── Search Bar + Actions ── */}
      <section className="px-4 pb-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2">
                <img src="/icon-emoji/search-icon.png" alt="" width={28} height={28} />
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by location or description..."
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#2E4365] focus:border-transparent transition text-sm bg-white shadow-sm"
              />
            </div>
            <div className="flex gap-2 shrink-0">
              <Link
                href={user ? "/report" : "/login"}
                className="inline-flex items-center text-white px-5 py-3 rounded-xl font-semibold transition text-sm whitespace-nowrap hover:opacity-90"
                style={{ background: '#2E4365' }}
              >
                + Report Found
              </Link>
              <Link
                href="/map?type=found"
                className="inline-flex items-center border px-4 py-3 rounded-xl font-semibold transition text-sm whitespace-nowrap hover:opacity-80"
                style={{ borderColor: '#2E4365', color: '#2E4365' }}
              >
                <img src="/icon-emoji/map.png" alt="" width={18} height={18} className="inline-block mr-1.5" /> Map
              </Link>
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

              {/* Location */}
              <div>
                <p className="text-xs font-semibold text-gray-600 mb-2">Location</p>
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
                      {location === 'all' ? 'All Locations' : location}
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
              <div className="mb-4"><img src="/icon-emoji/cat-paw.png" alt="" width={60} height={60} className="inline-block" /></div>
              <h3 className="text-xl font-bold text-gray-700 mb-2">
                No found cats reported yet
              </h3>
              <p className="text-gray-400 text-sm mb-4">
                {search
                  ? `No results for "${search}"`
                  : 'Nobody has reported a found cat yet.'}
              </p>
              {user && (
                <Link
                  href="/report"
                  className="inline-block text-white px-5 py-2 rounded-full text-sm font-semibold hover:opacity-90 transition"
                  style={{ background: '#2E4365' }}
                >
                  Report a found cat →
                </Link>
              )}
            </div>
          )}

          {/* Result count + cards */}
          {!loading && filteredCats.length > 0 && (
            <>
              <p className="text-gray-500 text-sm mb-6">
                <strong className="text-gray-800">{filteredCats.length}</strong> found cat
                {filteredCats.length !== 1 ? 's' : ''} reported
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                {filteredCats.map((cat) => (
                  <RecipeStyleCard
                    key={cat.id}
                    cat={cat}
                    onClick={() => setSelectedCat(cat)}
                    type="found"
                  />
                ))}
              </div>
            </>
          )}
          </div>
        </div>
      </section>

      {/* ── Detail Modal ── */}
      {selectedCat && (
        <CatDetailModal
          cat={selectedCat}
          currentUserId={user?.id}
          onClose={() => setSelectedCat(null)}
          onDeleteRequest={(cat) => setDeleteConfirm(cat)}
        />
      )}

      {/* ── Delete Confirmation Modal ── */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !deleting && setDeleteConfirm(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center">
            <div className="text-5xl mb-4">🗑️</div>
            <h3 className="text-xl font-bold mb-2" style={{ color: '#2E4365' }}>Delete Report?</h3>
            <p className="text-sm text-gray-500 mb-6">
              Are you sure you want to delete this found cat report near <strong>{deleteConfirm.location || 'unknown location'}</strong>? This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={deleting}
                className="flex-1 py-3 rounded-full font-semibold text-sm transition border-2 hover:opacity-80"
                style={{ borderColor: '#2E4365', color: '#2E4365' }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm.id)}
                disabled={deleting}
                className="flex-1 py-3 rounded-full font-semibold text-sm transition hover:scale-[1.02] disabled:opacity-50"
                style={{ background: '#dc2626', color: 'white' }}
              >
                {deleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Recipe-Style Card ─────────────────────────────────────
function RecipeStyleCard({ cat, onClick, type }) {
  const colors = type === 'found'
    ? ['#4ade80', '#34d399', '#2dd4bf', '#60a5fa', '#a78bfa']
    : ['#f87171', '#fb923c', '#fbbf24', '#a78bfa', '#60a5fa']

  // Deterministic color from cat id
  const bgColor = colors[cat.id?.charCodeAt(0) % colors.length] || colors[0]

  return (
    <div
      className="recipe-card group"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      aria-label={`View details for cat found near ${cat.location}`}
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
              alt="Found cat"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <img src="/icon-emoji/cat-face.png" alt="" width={60} height={60} />
            </div>
          )}

          {/* Status badge */}
          <div className="absolute top-3 left-1 bg-green-200 text-green-800 text-xs font-bold px-3 py-1 rounded-full shadow-md">
            <img src="/icon-emoji/found-cat.png" alt="" width={30} height={30} className="inline-block mr-1" />Found
          </div>
        </div>

        {/* Card body with lined paper effect */}
        <div className="recipe-card-body">
          <h3 className="text-lg font-black text-gray-900 uppercase tracking-wide leading-tight mb-1">
            {cat.location || 'Unknown Location'}
          </h3>
          <div className="flex items-center gap-2 mt-2">
            <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-xs">
              📅
            </div>
            <span className="text-xs text-gray-500">
              {new Date(cat.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Detail Modal — Announcement/Poster Style ──────────────────────────────────────────
function CatDetailModal({ cat, currentUserId, onClose, onDeleteRequest }) {
  const { openChat } = useChatContext()
  const isOwner = currentUserId && currentUserId === cat.user_id

  const handleMessage = () => {
    openChat({
      catType: 'found',
      catId: cat.id,
      recipientId: cat.user_id,
      catLabel: `a cat found near ${cat.location}`,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Modal — Announcement Card */}
      <div
        className="relative max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl rounded-lg"
        onClick={(e) => e.stopPropagation()}
        style={{ background: '#2E4365' }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/40 transition"
          aria-label="Close"
        >
          ✕
        </button>

        {/* Image section — dark frame */}
        <div className="relative p-3 pb-0">
          <div className="rounded-md overflow-hidden">
            {cat.image_url ? (
              <img
                src={cat.image_url}
                alt="Found cat"
                className="w-full max-h-[60vh] object-contain"
                style={{ background: '#1a2d45' }}
              />
            ) : (
              <div className="w-full h-64 sm:h-72 flex items-center justify-center" style={{ background: '#1a2d45' }}>
                <img src="/icon-emoji/cat-face.png" alt="" width={70} height={70} />
              </div>
            )}
          </div>
        </div>

        {/* Scalloped / torn edge divider */}
        <div className="found-poster-scallop" />

        {/* White content area */}
        <div className="bg-white rounded-b-lg px-6 pt-5 pb-6">
          {/* Tag + Date row */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-green-600">
              Found Cat
            </span>
            <span className="text-xs text-gray-400 font-medium">
              {new Date(cat.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
            </span>
          </div>

          {/* Location as title */}
          <h2 className="text-2xl font-black text-gray-900 leading-tight mb-3">
            {cat.location || 'Unknown Location'}
          </h2>

          {/* Description */}
          {cat.description && (
            <p className="text-sm text-gray-500 leading-relaxed mb-5">
              {cat.description}
            </p>
          )}

          {/* Action buttons */}
          <div className="space-y-3 pt-3 border-t border-gray-100">
            {!isOwner && currentUserId && (
              <button
                onClick={handleMessage}
                className="w-full flex items-center justify-center gap-2 font-bold py-3 rounded-xl transition text-sm hover:opacity-90 text-white"
                style={{ background: '#2E4365' }}
              >
                <span className="border-white flex items-center justify-center text-xs"></span>
                This Might Be Mine!
              </button>
            )}

            {!currentUserId && (
              <a
                href="/login"
                className="flex items-center justify-center gap-2 w-full text-center font-bold py-3 rounded-xl transition text-sm hover:opacity-90 text-white"
                style={{ background: '#2E4365' }}
              >
                <span className="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-xs">→</span>
                Login to Claim
              </a>
            )}

            {cat.latitude && cat.longitude && (
              <a
                href={getDirectionsUrl(cat.latitude, cat.longitude)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full text-center border-2 font-bold py-3 rounded-xl transition text-sm hover:bg-gray-50"
                style={{ borderColor: '#2E4365', color: '#2E4365' }}
              >
                <span className=" flex items-center justify-center text-xs"></span>
                Get Directions →
              </a>
            )}

            {cat.contact_phone && (
              <a
                href={`tel:${cat.contact_phone}`}
                className="flex items-center justify-center gap-2 w-full text-center border-2 font-bold py-3 rounded-xl transition text-sm hover:bg-gray-50"
                style={{ borderColor: '#E59D2C', color: '#E59D2C' }}
              >
                <img src="/icon-emoji/phone-call-icon.png" alt="" width={16} height={16} className="inline-block" /> Call {cat.contact_phone}
              </a>
            )}

            {!isOwner && currentUserId && (
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <Link
                  href={`/profile/${cat.user_id}`}
                  className="flex items-center gap-2 text-xs text-gray-400 hover:text-green-500 transition"
                >
                  <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                    <img src="/icon-emoji/cat-paw.png" alt="" width={16} height={16} />
                  </div>
                  <span>View reporter</span>
                </Link>
                <button
                  onClick={handleMessage}
                  className="text-xs text-[#2E4365] hover:text-blue-800 font-semibold transition flex items-center gap-1"
                >
                  <img src="/icon-emoji/message-chat.png" alt="" width={20} height={20} className="inline-block" /> Message
                </button>
              </div>
            )}

            {isOwner && (
              <button
                onClick={() => onDeleteRequest(cat)}
                className="w-full border-2 border-red-300 text-red-500 hover:bg-red-50 font-bold py-3 rounded-xl transition text-sm uppercase tracking-wide"
              >
                🗑️ Delete Report
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
