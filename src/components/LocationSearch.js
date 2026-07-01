// src/components/LocationSearch.js
'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { searchPlaces } from '@/lib/geocode'

export default function LocationSearch({ location, lat, lng, onLocationChange }) {
  const [query, setQuery] = useState(location || '')
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [searching, setSearching] = useState(false)
  const debounceRef = useRef(null)
  const mapRef = useRef(null)
  const instanceRef = useRef(null)
  const markerRef = useRef(null)
  const leafletRef = useRef(null)

  // Debounced search — waits 400ms after user stops typing
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (query.length < 3) {
      setSuggestions([])
      return
    }

    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      const results = await searchPlaces(query)
      setSuggestions(results)
      setShowSuggestions(results.length > 0)
      setSearching(false)
    }, 400)

    return () => clearTimeout(debounceRef.current)
  }, [query])

  // Init map
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (instanceRef.current) return

    const initMap = async () => {
      const L = (await import('leaflet')).default
      leafletRef.current = L

      delete L.Icon.Default.prototype._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      const defaultLat = lat || 20.5937
      const defaultLng = lng || 78.9629
      const defaultZoom = lat ? 14 : 5

      const map = L.map(mapRef.current).setView([defaultLat, defaultLng], defaultZoom)
      instanceRef.current = map

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map)

      // If coordinates already exist, show existing pin
      if (lat && lng) {
        markerRef.current = L.marker([lat, lng]).addTo(map)
      }

      // Manual click to override/refine pin position
      map.on('click', (e) => {
        const { lat: clickLat, lng: clickLng } = e.latlng
        dropPin(clickLat, clickLng)
        onLocationChange(query, clickLat, clickLng)
      })
    }

    initMap()

    return () => {
      if (instanceRef.current) {
        instanceRef.current.remove()
        instanceRef.current = null
      }
    }
  }, [])

  const dropPin = useCallback((pinLat, pinLng) => {
    const L = leafletRef.current
    const map = instanceRef.current
    if (!L || !map) return

    if (markerRef.current) markerRef.current.remove()
    markerRef.current = L.marker([pinLat, pinLng]).addTo(map)
    map.setView([pinLat, pinLng], 15)
  }, [])

  const handleSelectSuggestion = (place) => {
    setQuery(place.shortName)
    setShowSuggestions(false)
    setSuggestions([])

    // Drop pin AND fly map to selected location
    dropPin(place.lat, place.lng)

    // Tell the parent form: here's the location text + coordinates
    onLocationChange(place.shortName, place.lat, place.lng)
  }

  const handleInputChange = (e) => {
    const val = e.target.value
    setQuery(val)
    // If user clears/edits the text manually, keep whatever pin exists
    // but update the location text
    onLocationChange(val, lat, lng)
  }

  return (
    <div className="space-y-2">

      {/* Search input */}
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          placeholder="Start typing a location, e.g. Andheri Railway Station"
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-400 transition text-sm pr-10"
        />

        {/* Searching spinner */}
        {searching && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Suggestions dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg z-30 mt-1 overflow-hidden">
            {suggestions.map((place, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSelectSuggestion(place)}
                className="w-full text-left px-4 py-3 hover:bg-orange-50 transition border-b border-gray-50 last:border-0 flex items-start gap-2"
              >
                <span className="text-orange-400 shrink-0 mt-0.5">📍</span>
                <div>
                  <p className="text-sm font-medium text-gray-800">{place.shortName}</p>
                  <p className="text-xs text-gray-400 line-clamp-1">{place.displayName}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Map */}
      <p className="text-xs text-gray-400 flex items-center gap-1">
        🗺️ Select from suggestions above, or click the map to place a pin manually
      </p>

      <div ref={mapRef} className="w-full h-52 rounded-xl border border-gray-200 z-0" />

      {/* Status */}
      {lat && lng ? (
        <p className="text-xs text-green-600 font-medium">✅ Location pinned — {query}</p>
      ) : (
        <p className="text-xs text-amber-500">⚠️ No pin yet — search above or click the map</p>
      )}
    </div>
  )
}