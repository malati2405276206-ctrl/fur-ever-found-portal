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
  const [selectedLocation, setSelectedLocation] = useState('all')
  const [filterStatus, setFilterStatus] = useState('lost')
  const [selectedCat, setSelectedCat] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [deleting, setDeleting] = useState(false)

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

  // Delete report (only owner can do this)
  const handleDelete = async (catId) => {
    setDeleting(true)
    const { error } = await supabase
      .from('lost_cats')
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
  const locations = [
    'all',
    ...new Set(
      cats
        .map((cat) => cat.location)
        .filter(Boolean)
    ),
  ]
  
  const filteredCats = cats.filter((cat) => {
    const matchesStatus = filterStatus === 'all' || cat.status === filterStatus
    const matchesSearch =
      search === '' ||
      cat.name.toLowerCase().includes(search.toLowerCase()) ||
      cat.location.toLowerCase().includes(search.toLowerCase()) ||
      cat.description.toLowerCase().includes(search.toLowerCase())
    const matchesLocation =
      selectedLocation === 'all' ||
      cat.location === selectedLocation
    return matchesStatus && matchesSearch && matchesLocation
  })

  return (
    <div className="min-h-screen" style={{ background: '#EBDDC5' }}>

      {/* ── Page Header ── */}
      <section className="pt-10 pb-4 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 mb-3 px-4 py-1.5 rounded-full bg-white/70 border border-[#2E4365]/30">
            <img src="/icon-emoji/lost-cat.png" alt="" width={22} height={22} />
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#2E4365' }}>Help Them Come Home</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight" style={{ color: '#2E4365' }}>
            Lost Cats
          </h1>
          <p className="text-gray-500 text-sm mt-2 max-w-md mx-auto">
            These cats are missing. Recognise one? Help them find their way home.
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
                placeholder="Search by name, location or description..."
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#2E4365] focus:border-transparent transition text-sm bg-white shadow-sm"
              />
            </div>
            <div className="flex gap-2 shrink-0">
              <Link
                href={user ? "/report" : "/login"}
                className="inline-flex items-center text-white px-5 py-3 rounded-xl font-semibold transition text-sm whitespace-nowrap hover:opacity-90"
                style={{ background: '#2E4365' }}
              >
                + Report Lost
              </Link>
              <Link
                href="/map?type=lost"
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

              {/* Status */}
              <div className="mb-5">
                <p className="text-xs font-semibold text-gray-600 mb-2">Status</p>
                <div className="flex flex-col gap-1">
                  {[
                    { value: 'lost', label: 'Lost' },
                    { value: 'reunited', label: 'Reunited' },
                    { value: 'all', label: 'All' },
                  ].map((f) => (
                    <button
                      key={f.value}
                      onClick={() => setFilterStatus(f.value)}
                      className={`px-3 py-2 rounded-lg text-xs font-semibold text-left transition-all ${
                        filterStatus === f.value
                          ? 'text-white shadow-sm'
                          : 'text-gray-500 hover:bg-gray-50'
                      }`}
                      style={filterStatus === f.value ? { background: '#2E4365' } : {}}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

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
              Are you sure you want to delete the report for <strong>{deleteConfirm.name || 'this cat'}</strong>? This cannot be undone.
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
              <img src="/icon-emoji/cat-face.png" alt="" width={60} height={60} />
            </div>
          )}

          {/* Status badge */}
          <div className={`absolute top-3 left-3 text-xs font-bold px-3 py-1 rounded-full shadow-md ${
            isReunited ? 'bg-green-200 text-green-800' : 'bg-rose-200 text-rose-800'
          }`}>
            {isReunited ? <><img src="/icon-emoji/reunited.png" alt="" width={30} height={30} className="inline-block mr-0" />Reunited</> : <><img src="/icon-emoji/lost-cat.png" alt="" width={30} height={30} className="inline-block mr-0" />Lost</>}
          </div>
        </div>

        {/* Card body with lined paper effect */}
        <div className="recipe-card-body">
          <h3 className="text-lg font-black text-gray-900 uppercase tracking-wide leading-tight mb-1">
            {cat.name || 'Unknown'}
          </h3>
          <div className="flex items-center gap-2 mt-2">
            <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center text-xs">
              <img src="/icon-emoji/paw-shaped location pin.png" alt="" width={60} height={60} />
            </div>
            <span className="text-xs text-gray-500 truncate">{cat.location}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Detail Modal ──────────────────────────────────────────
function CatDetailModal({ cat, type, currentUserId, onClose, onMarkReunited, onDeleteRequest }) {
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
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal — Lost Poster Style */}
      <div
        className="relative max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fffef5',
          border: '3px solid #d4c9a8',
          borderRadius: '6px',
          boxShadow: '0 24px 80px rgba(0,0,0,0.3), inset 0 0 60px rgba(210,190,140,0.1)',
          backgroundImage: 'radial-gradient(ellipse at 20% 80%, rgba(180,150,100,0.06) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(180,150,100,0.06) 0%, transparent 60%)',
        }}
      >
        {/* Tape decorations */}
        <div className="absolute -top-2 left-6 w-14 h-5 bg-yellow-200/70 border border-yellow-300/50 rotate-[-4deg] z-10 shadow-sm" />
        <div className="absolute -top-2 right-6 w-14 h-5 bg-yellow-200/70 border border-yellow-300/50 rotate-[3deg] z-10 shadow-sm" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center text-gray-600 hover:bg-white hover:text-gray-900 transition shadow-md border border-gray-200"
          aria-label="Close"
        >
          ✕
        </button>

        {/* Poster Content */}
        <div className="p-6 pt-8">
          {/* LOST / FOUND Header */}
          <div className="text-center border-b-2 border-dashed border-[#c9b896] pb-3 mb-5">
            <h2
              className="text-4xl tracking-[8px] uppercase"
              style={{
                fontFamily: "'Impact', 'Arial Black', sans-serif",
                color: isReunited ? '#27ae60' : '#c0392b',
                textShadow: '1px 1px 0 rgba(0,0,0,0.1)',
              }}
            >
              {isReunited ? 'FOUND!' : 'LOST'}
            </h2>
          </div>

          {/* Photo — large polaroid */}
          <div className="mx-auto mb-4" style={{ border: '5px solid #fff', boxShadow: '0 3px 12px rgba(0,0,0,0.12)' }}>
            {cat.image_url ? (
              <img
                src={cat.image_url}
                alt={cat.name}
                className={`w-full h-64 object-contain bg-gray-50 ${isReunited ? 'opacity-60 grayscale' : ''}`}
              />
            ) : (
              <div className="w-full h-64 flex items-center justify-center" style={{ background: '#f5f5f0' }}>
                <img src="/icon-emoji/cat-face.png" alt="" width={70} height={70} />
              </div>
            )}
          </div>

          {/* Name */}
          <div className="text-center border-t border-b border-[#d4c9a8] py-2 mb-4">
            <h3 className="text-2xl font-black uppercase tracking-[3px] text-gray-900" style={{ fontFamily: "'Georgia', serif" }}>
              {cat.name || 'Unknown'}
            </h3>
          </div>

          {/* Details */}
          <div className="text-center space-y-2 mb-5">
            <p className="text-sm font-semibold text-gray-700 flex items-center justify-center gap-1.5">
              <img src="/icon-emoji/paw-shaped location pin.png" alt="" width={22} height={22} />
              Last seen: {cat.location}
            </p>
            {cat.description && (
              <p className="text-sm text-gray-600 leading-relaxed px-2">
                {cat.description}
              </p>
            )}
            <p className="text-xs text-gray-400 pt-1">
              Reported {new Date(cat.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          </div>

          {/* Action buttons */}
          <div className="space-y-2 border-t-2 border-dashed border-[#c9b896] pt-4">
            {!isReunited && !isOwner && currentUserId && (
              <button
                onClick={handleMessage}
                className="w-full text-white font-bold py-3 rounded-lg transition text-sm hover:opacity-90 uppercase tracking-wide"
                style={{ background: '#c0392b' }}
              >
                <img src="/icon-emoji/message-chat.png" alt="" width={24} height={24} className="inline-block mr-2" />
                I Spotted This Cat!
              </button>
            )}

            {!isReunited && !currentUserId && (
              <a
                href="/login"
                className="block w-full text-center text-white font-bold py-3 rounded-lg transition text-sm hover:opacity-90 uppercase tracking-wide"
                style={{ background: '#c0392b' }}
              >
                Login to Report a Sighting
              </a>
            )}

            {cat.latitude && cat.longitude && (
              <a
                href={getDirectionsUrl(cat.latitude, cat.longitude)}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center border-2 font-bold py-3 rounded-lg transition text-sm hover:opacity-80 uppercase tracking-wide"
                style={{ borderColor: '#2E4365', color: '#2E4365' }}
              >
                 Get Directions →
              </a>
            )}

            {isOwner && !isReunited && (
              <button
                onClick={() => onMarkReunited(cat.id)}
                className="w-full border-2 border-green-400 text-green-600 hover:bg-green-50 font-bold py-3 rounded-lg transition text-sm uppercase tracking-wide"
              >
                <img src="/icon-emoji/reunited.png" alt="" width={24} height={24} className="inline-block mr-2" />
                Mark as Reunited
              </button>
            )}

            {isOwner && (
              <button
                onClick={() => onDeleteRequest(cat)}
                className="w-full border-2 border-red-300 text-red-500 hover:bg-red-50 font-bold py-3 rounded-lg transition text-sm uppercase tracking-wide"
              >
                🗑️ Delete Report
              </button>
            )}

            {isReunited && (
              <div className="text-center text-green-600 font-bold text-sm py-3 flex items-center justify-center gap-2 uppercase tracking-wide">
                <img src="/icon-emoji/reunited.png" alt="" width={28} height={28} className="inline-block" />
                This cat found their way home!
              </div>
            )}

            {!isOwner && currentUserId && !isReunited && (
              <div className="flex items-center justify-between pt-3 border-t border-[#d4c9a8]">
                <Link
                  href={`/profile/${cat.user_id}`}
                  className="flex items-center gap-2 text-xs text-gray-500 hover:text-[#c0392b] transition"
                >
                  <div className="w-6 h-6 rounded-full bg-red-50 flex items-center justify-center">
                    <img src="/icon-emoji/cat-paw.png" alt="" width={16} height={16} />
                  </div>
                  <span>View reporter</span>
                </Link>
                <button
                  onClick={handleMessage}
                  className="text-xs text-[#c0392b] hover:text-red-700 font-semibold transition flex items-center gap-1"
                >
                  <img src="/icon-emoji/message-chat.png" alt="" width={30} height={30} className="inline-block" /> Message
                </button>
              </div>
            )}

            {!isReunited && (
              <AIMatchButton lostCat={cat} />
            )}
          </div>
        </div>

        {/* Reunited stamp */}
        {isReunited && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-12 border-4 border-green-500 rounded-xl px-6 py-2 pointer-events-none">
            <span className="text-3xl font-black text-green-500 tracking-[6px] uppercase" style={{ fontFamily: "'Impact', sans-serif" }}>
              REUNITED
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
