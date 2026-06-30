// src/app/map/page.js
'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import dynamic from 'next/dynamic'
import Link from 'next/link'

// Dynamic import to avoid SSR issues
const MapView = dynamic(() => import('@/components/MapView'), { ssr: false })

export default function MapPage() {
  const searchParams = useSearchParams()
  const defaultType  = searchParams.get('type') || 'all'

  const [filter,      setFilter]      = useState(defaultType)
  const [lostCats,    setLostCats]    = useState([])
  const [foundCats,   setFoundCats]   = useState([])
  const [adoptCats,   setAdoptCats]   = useState([])
  const [loading,     setLoading]     = useState(true)

  useEffect(() => {
    fetchAllCats()
  }, [])

  const fetchAllCats = async () => {
    setLoading(true)

    const [lostRes, foundRes, adoptRes] = await Promise.all([
      supabase.from('lost_cats').select('*').not('latitude', 'is', null),
      supabase.from('found_cats').select('*').not('latitude', 'is', null),
      supabase.from('adoption_cats').select('*, ngo_profiles(org_name)').not('latitude', 'is', null).eq('status', 'available'),
    ])

    setLostCats(lostRes.data  || [])
    setFoundCats(foundRes.data || [])
    setAdoptCats(adoptRes.data || [])
    setLoading(false)
  }

  // Combine cats based on active filter
  const visibleCats = [
    ...(filter === 'all' || filter === 'lost'     ? lostCats.map((c)  => ({ ...c, _type: 'lost'     })) : []),
    ...(filter === 'all' || filter === 'found'    ? foundCats.map((c) => ({ ...c, _type: 'found'    })) : []),
    ...(filter === 'all' || filter === 'adoption' ? adoptCats.map((c) => ({ ...c, _type: 'adoption' })) : []),
  ]

  const filters = [
    { value: 'all',      label: 'All Cats',  color: 'bg-gray-700 text-white',    inactive: 'bg-white text-gray-600 border border-gray-200' },
    { value: 'lost',     label: '😿 Lost',   color: 'bg-red-500 text-white',     inactive: 'bg-white text-gray-600 border border-gray-200' },
    { value: 'found',    label: '😊 Found',  color: 'bg-green-500 text-white',   inactive: 'bg-white text-gray-600 border border-gray-200' },
    { value: 'adoption', label: '🏠 Adopt',  color: 'bg-purple-500 text-white',  inactive: 'bg-white text-gray-600 border border-gray-200' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 sm:px-6 py-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">🗺️ Cat Map</h1>
              <p className="text-gray-400 text-sm mt-0.5">
                {loading ? 'Loading...' : `${visibleCats.length} cat${visibleCats.length !== 1 ? 's' : ''} on the map`}
              </p>
            </div>

            {/* Filter buttons */}
            <div className="flex gap-2 flex-wrap">
              {filters.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setFilter(f.value)}
                  className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition ${filter === f.value ? f.color : f.inactive}`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="flex gap-4 mt-3 text-xs text-gray-500 flex-wrap">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500 inline-block" /> Lost</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-500 inline-block" /> Found</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-purple-500 inline-block" /> Adoption</span>
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="relative">
        {loading ? (
          <div className="h-[calc(100vh-140px)] flex items-center justify-center bg-gray-100">
            <div className="text-center">
              <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-gray-500 text-sm">Loading map...</p>
            </div>
          </div>
        ) : (
          <MapView cats={visibleCats} />
        )}

        {/* No pins message */}
        {!loading && visibleCats.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-white rounded-2xl shadow-lg p-6 text-center max-w-sm mx-4">
              <div className="text-4xl mb-3">📍</div>
              <h3 className="font-bold text-gray-800 mb-1">No pins yet</h3>
              <p className="text-gray-400 text-sm">
                Reports with map locations will appear here. Submit a report and drop a pin!
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}