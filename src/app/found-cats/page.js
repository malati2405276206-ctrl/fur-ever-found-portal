// src/app/found-cats/page.js
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'

export default function FoundCatsPage() {
  const { user } = useAuth()
  const [cats,    setCats]    = useState([])
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')

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

  const filteredCats = cats.filter((cat) => {
    return (
      search === '' ||
      cat.location.toLowerCase().includes(search.toLowerCase()) ||
      cat.description.toLowerCase().includes(search.toLowerCase())
    )
  })

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">

      {/* ── Hero ── */}
      <section className="py-14 px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="text-5xl mb-4">😊</div>
          <h1 className="text-4xl font-extrabold text-gray-900 mb-3">
            Found <span className="text-green-500">Cats</span>
          </h1>
          <p className="text-gray-500 text-lg">
            Someone found these cats. Is one of them yours?
          </p>
          {user && (
            <Link
              href="/report"
              className="inline-block mt-6 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-xl font-semibold transition"
            >
              + Report a Found Cat
            </Link>
          )}
        </div>
      </section>

      {/* ── Search ── */}
      <section className="px-4 pb-8">
        <div className="max-w-5xl mx-auto">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 Search by location or description..."
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-400 transition text-sm bg-white"
          />
        </div>
      </section>

      {/* ── Cards Grid ── */}
      <section className="px-4 pb-16">
        <div className="max-w-5xl mx-auto">

          {/* Loading skeleton */}
          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
                  className="inline-block bg-green-500 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-green-600 transition"
                >
                  Report a found cat →
                </Link>
              )}
            </div>
          )}

          {/* Result count + cards */}
          {!loading && filteredCats.length > 0 && (
            <>
              <p className="text-gray-400 text-sm mb-5">
                <strong className="text-gray-700">{filteredCats.length}</strong> found cat
                {filteredCats.length !== 1 ? 's' : ''} reported
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCats.map((cat) => (
                  <FoundCatCard
                    key={cat.id}
                    cat={cat}
                    currentUserId={user?.id}
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

// ── Found Cat Card ────────────────────────────────────────
function FoundCatCard({ cat, currentUserId }) {
  return (
    <div className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col">

      {/* Image */}
      <div className="relative">
        {cat.image_url ? (
          <img
            src={cat.image_url}
            alt="Found cat"
            className="w-full h-48 object-cover"
          />
        ) : (
          <div className="w-full h-48 bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center">
            <span className="text-6xl">🐱</span>
          </div>
        )}

        {/* Badge */}
        <div className="absolute top-3 left-3 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
          😊 Found
        </div>
      </div>

      {/* Body */}
      <div className="p-5 flex flex-col flex-1">

        {/* Location */}
        <p className="text-sm font-bold text-green-600 mb-2">
          📍 {cat.location}
        </p>

        {/* Description */}
        <p className="text-gray-500 text-sm leading-relaxed line-clamp-3 mb-4">
          {cat.description}
        </p>

        {/* Date */}
        <p className="text-xs text-gray-300 mb-4">
          Found on {new Date(cat.created_at).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric'
          })}
        </p>

        {/* Contact */}
        <div className="mt-auto space-y-2">
          <a
            href={`mailto:${cat.contact_email}?subject=Is this my cat?&body=Hi, I saw your post on Fur Ever Found about a cat you found. I think it might be mine!`}
            className="block w-full text-center bg-green-500 hover:bg-green-600 text-white font-semibold py-2.5 rounded-xl transition text-sm"
          >
            📧 This Might Be Mine!
          </a>

          {cat.contact_phone && (
            <a
              href={`tel:${cat.contact_phone}`}
              className="block w-full text-center border border-green-300 text-green-600 hover:bg-green-50 font-semibold py-2.5 rounded-xl transition text-sm"
            >
              📞 Call {cat.contact_phone}
            </a>
          )}
        </div>
      </div>
    </div>
  )
}