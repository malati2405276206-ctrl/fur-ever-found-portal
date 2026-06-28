// src/app/stories/page.js
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function StoriesPage() {
  const [stories, setStories] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStories()
  }, [])

  const fetchStories = async () => {
    setLoading(true)

    const { data, error } = await supabase
      .from('adoption_cats')
      .select(`
        *,
        ngo_profiles (
          org_name,
          city
        )
      `)
      .eq('status', 'adopted')
      .order('adopted_at', { ascending: false })

    if (error) {
      console.error('Error fetching stories:', error.message)
    } else {
      setStories(data || [])
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#fdf6ec] via-[#fef9f3] to-white">

      {/* ── Hero ── */}
      <section className="py-16 px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="text-5xl mb-4">📖</div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4 leading-tight">
            Every Cat Has a
            <span className="text-amber-500"> Story</span>
          </h1>
          <p className="text-gray-500 text-lg leading-relaxed">
            These are the rescue journeys that found their happy ending.
            Each story is a reminder of what love and care can do.
          </p>

          {/* Decorative divider */}
          <div className="flex items-center justify-center gap-3 mt-8">
            <div className="h-px w-16 bg-amber-200" />
            <span className="text-amber-400 text-xl">🐾</span>
            <div className="h-px w-16 bg-amber-200" />
          </div>
        </div>
      </section>

      {/* ── Stories ── */}
      <section className="px-4 pb-20">
        <div className="max-w-3xl mx-auto">

          {/* Loading */}
          {loading && (
            <div className="space-y-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-3xl p-8 animate-pulse
                                        border border-amber-100">
                  <div className="flex gap-6">
                    <div className="w-32 h-32 rounded-2xl bg-gray-200 shrink-0" />
                    <div className="flex-1 space-y-3">
                      <div className="h-5 bg-gray-200 rounded w-1/3" />
                      <div className="h-3 bg-gray-100 rounded w-1/4" />
                      <div className="h-3 bg-gray-100 rounded w-full" />
                      <div className="h-3 bg-gray-100 rounded w-5/6" />
                      <div className="h-3 bg-gray-100 rounded w-4/6" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && stories.length === 0 && (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">🌱</div>
              <h3 className="text-xl font-bold text-gray-700 mb-2">
                No stories yet
              </h3>
              <p className="text-gray-400 text-sm">
                Success stories appear here when NGOs mark cats as adopted.
                The first story is just around the corner!
              </p>
            </div>
          )}

          {/* Story cards */}
          {!loading && stories.length > 0 && (
            <div className="space-y-10">
              {stories.map((cat, index) => (
                <StoryCard key={cat.id} cat={cat} index={index} />
              ))}
            </div>
          )}

        </div>
      </section>

    </div>
  )
}

// ── Story Card ────────────────────────────────────────────
function StoryCard({ cat, index }) {
  const [expanded, setExpanded] = useState(false)

  // Alternate card accent colors for visual variety
  const accents = [
    { bg: 'from-amber-50 to-orange-50',   border: 'border-amber-200',  tag: 'bg-amber-100 text-amber-700',  quote: 'text-amber-400' },
    { bg: 'from-purple-50 to-indigo-50',  border: 'border-purple-200', tag: 'bg-purple-100 text-purple-700', quote: 'text-purple-400' },
    { bg: 'from-green-50 to-emerald-50',  border: 'border-green-200',  tag: 'bg-green-100 text-green-700',   quote: 'text-green-400' },
    { bg: 'from-pink-50 to-rose-50',      border: 'border-pink-200',   tag: 'bg-pink-100 text-pink-700',     quote: 'text-pink-400' },
    { bg: 'from-sky-50 to-blue-50',       border: 'border-sky-200',    tag: 'bg-sky-100 text-sky-700',       quote: 'text-sky-400' },
  ]

  const accent = accents[index % accents.length]

  // How long ago was this cat adopted?
  const timeAgo = (dateStr) => {
    if (!dateStr) return ''
    const diff = Date.now() - new Date(dateStr).getTime()
    const days  = Math.floor(diff / (1000 * 60 * 60 * 24))
    if (days === 0) return 'Today'
    if (days === 1) return 'Yesterday'
    if (days < 30)  return `${days} days ago`
    const months = Math.floor(days / 30)
    if (months === 1) return '1 month ago'
    if (months < 12)  return `${months} months ago`
    return `${Math.floor(months / 12)} year${Math.floor(months / 12) > 1 ? 's' : ''} ago`
  }

  // Truncate storyline for preview
  const previewLength = 200
  const isLong        = cat.storyline?.length > previewLength
  const previewText   = isLong && !expanded
    ? cat.storyline.slice(0, previewLength) + '...'
    : cat.storyline

  return (
    <div className={`bg-gradient-to-br ${accent.bg} rounded-3xl border
                     ${accent.border} p-8 transition-all duration-300`}>

      {/* Top row: image + header info */}
      <div className="flex flex-col sm:flex-row gap-6 mb-6">

        {/* Cat image */}
        <div className="shrink-0">
          {cat.image_url ? (
            <img
              src={cat.image_url}
              alt={cat.name}
              className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl object-cover shadow-md border-2 border-white"
            />
          ) : (
            <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl bg-white/60 flex items-center justify-center shadow-md border-2 border-white">
              <span className="text-5xl">🐱</span>
            </div>
          )}
        </div>

        {/* Header info */}
        <div className="flex-1">

          {/* Adopted badge */}
          <span className={`inline-block text-xs font-bold px-3 py-1
                            rounded-full mb-3 ${accent.tag}`}>
            🎉 Successfully Adopted
          </span>

          {/* Cat name */}
          <h2 className="text-2xl font-extrabold text-gray-900 mb-1">
            {cat.name}
          </h2>

          {/* Meta info */}
          <div className="flex flex-wrap gap-3 text-xs text-gray-500">
            {cat.breed && (
              <span className="flex items-center gap-1">
                🐾 {cat.breed}
              </span>
            )}
            {cat.age && (
              <span className="flex items-center gap-1">
                🎂 {cat.age}
              </span>
            )}
            {cat.gender !== 'unknown' && (
              <span className="flex items-center gap-1">
                {cat.gender === 'male' ? '♂' : '♀'} {cat.gender}
              </span>
            )}
            <span className="flex items-center gap-1">
              📍 {cat.city}
            </span>
          </div>

          {/* NGO name + time */}
          <div className="mt-3 flex flex-wrap gap-2 items-center">
            {cat.ngo_profiles?.org_name && (
              <span className="text-xs font-medium text-gray-600 bg-white/70
                               px-3 py-1 rounded-full">
                🏢 {cat.ngo_profiles.org_name}
              </span>
            )}
            {cat.adopted_at && (
              <span className="text-xs text-gray-400">
                · Adopted {timeAgo(cat.adopted_at)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-white/60 mb-6" />

      {/* Storyline */}
      <div>
        <p className={`text-xs font-bold uppercase tracking-widest mb-3 ${accent.quote}`}>
          ✨ Rescue Story
        </p>

        {/* Big opening quote mark */}
        <div className={`text-5xl font-serif leading-none mb-2 ${accent.quote} opacity-40`}>
          &ldquo;
        </div>

        <p className="text-gray-700 text-base leading-relaxed italic pl-4 border-l-2 border-white/80">
          {previewText}
        </p>

        {/* Closing quote */}
        <div className={`text-5xl font-serif leading-none mt-1 text-right
                         ${accent.quote} opacity-40`}>
          &rdquo;
        </div>

        {/* Read more toggle */}
        {isLong && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-3 text-sm font-semibold text-gray-500 hover:text-gray-700 transition underline underline-offset-2"
          >
            {expanded ? 'Show less ▲' : 'Read full story ▼'}
          </button>
        )}
      </div>

    </div>
  )
}