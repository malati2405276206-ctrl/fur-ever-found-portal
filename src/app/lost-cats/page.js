// src/app/lost-cats/page.js
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import AIMatchButton from '@/components/AIMatchButton'
import { useChatContext } from '@/context/ChatContext'

export default function LostCatsPage() {
  const { user } = useAuth()
  const [cats,       setCats]       = useState([])
  const [loading,    setLoading]    = useState(true)
  const [search,     setSearch]     = useState('')
  const [filterStatus, setFilterStatus] = useState('lost')

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

    // Update local state so UI reflects instantly
    setCats((prev) =>
      prev.map((cat) =>
        cat.id === catId ? { ...cat, status: 'reunited' } : cat
      )
    )
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
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">

      {/* ── Hero ── */}
      <section className="py-14 px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="text-5xl mb-4">😿</div>
          <h1 className="text-4xl font-extrabold text-gray-900 mb-3">
            Lost <span className="text-orange-500">Cats</span>
          </h1>
          <p className="text-gray-500 text-lg">
            These cats are missing. Recognise one? Contact their family immediately.
          </p>
          {user && (
            <Link
              href="/report"
              className="inline-block mt-6 bg-orange-500 hover:bg-orange-600
                         text-white px-6 py-3 rounded-xl font-semibold transition"
            >
              + Report a Lost Cat
            </Link>
          )}
          <Link href="/map?type=lost" className="inline-block mt-3 border border-orange-300 text-orange-500 hover:bg-orange-50 px-6 py-3 rounded-xl font-semibold transition text-sm">
            🗺️ View on Map
          </Link>
        </div>
      </section>

      {/* ── Filters ── */}
      <section className="px-4 sm:px-6 pb-8">
        <div className="max-w-5xl mx-auto flex flex-col gap-3">

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 Search by name, location or description..."
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-400 transition text-sm bg-white"
          />

          <div className="flex gap-2 flex-wrap">
            {[
              { value: 'lost', label: '😿 Lost' },
              { value: 'reunited', label: '🎉 Reunited' },
              { value: 'all', label: 'All' },
            ].map((f) => (
              <button
                key={f.value}
                onClick={() => setFilterStatus(f.value)}
                className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-sm font-medium transition ${filterStatus === f.value ? 'bg-orange-500 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:border-orange-300'}`}
              >
                {f.label}
              </button>
            ))}
          </div>

        </div>
      </section>

      {/* ── Cards Grid ── */}
      <section className="px-4 pb-16">
        <div className="max-w-5xl mx-auto">

          {/* Loading skeleton */}
          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white rounded-3xl overflow-hidden border border-gray-100 animate-pulse">
                  <div className="h-48 bg-gray-200" />
                  <div className="p-5 space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                    <div className="h-3 bg-gray-100 rounded w-3/4" />
                    <div className="h-3 bg-gray-100 rounded w-full" />
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
                  className="mt-4 inline-block bg-orange-500 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-orange-600 transition"
                >
                  Be the first to report →
                </Link>
              )}
            </div>
          )}

          {/* Result count + cards */}
          {!loading && filteredCats.length > 0 && (
            <>
              <p className="text-gray-400 text-sm mb-5">
                <strong className="text-gray-700">{filteredCats.length}</strong> report
                {filteredCats.length !== 1 ? 's' : ''} found
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCats.map((cat) => (
                  <LostCatCard
                    key={cat.id}
                    cat={cat}
                    currentUserId={user?.id}
                    onMarkReunited={handleMarkReunited}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  )
}

// ── Lost Cat Card ─────────────────────────────────────────
function LostCatCard({ cat, currentUserId, onMarkReunited }) {
  const { openChat } = useChatContext()
  const isOwner    = currentUserId && currentUserId === cat.user_id
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
    <div className={`bg-white rounded-3xl overflow-hidden border shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col ${isReunited ? 'border-green-200' : 'border-gray-100'}`}>

      <div className="relative">
        {cat.image_url ? (
          <img src={cat.image_url} alt={cat.name} className={`w-full h-48 object-cover ${isReunited ? 'opacity-70 grayscale' : ''}`} />
        ) : (
          <div className="w-full h-48 bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center">
            <span className="text-6xl">🐱</span>
          </div>
        )}
        <div className={`absolute top-3 left-3 text-white text-xs font-bold px-3 py-1 rounded-full ${isReunited ? 'bg-green-500' : 'bg-red-500'}`}>
          {isReunited ? '🎉 Reunited' : '😿 Lost'}
        </div>
      </div>

      <div className="p-5 flex flex-col flex-1">
        <h3 className="text-xl font-bold text-gray-900 mb-1">{cat.name}</h3>
        <p className="text-xs text-orange-500 font-medium mb-2">📍 {cat.location}</p>
        <p className="text-gray-500 text-sm leading-relaxed line-clamp-3 mb-4">{cat.description}</p>
        <p className="text-xs text-gray-300 mb-4">
          Reported {new Date(cat.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
        </p>

        <div className="mt-auto space-y-2">
          {!isReunited && !isOwner && currentUserId && (
            <button onClick={handleMessage} className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2.5 rounded-xl transition text-sm">
              💬 I Spotted This Cat!
            </button>
          )}

          {!isReunited && !currentUserId && (
            <a href="/login" className="block w-full text-center bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2.5 rounded-xl transition text-sm">
              Login to Message
            </a>
          )}

          {isOwner && !isReunited && (
            <button onClick={() => onMarkReunited(cat.id)} className="w-full border border-green-300 text-green-600 hover:bg-green-50 font-semibold py-2.5 rounded-xl transition text-sm">
              🎉 Mark as Reunited
            </button>
          )}

          {isReunited && (
            <div className="text-center text-green-600 font-semibold text-sm py-2">
              🎉 This cat found their way home!
            </div>
          )}

          {!isReunited && (
            <AIMatchButton lostCat={cat} />
          )}
        </div>
      </div>
    </div>
  )
}