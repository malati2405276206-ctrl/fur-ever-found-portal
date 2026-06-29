// src/components/LocationPicker.js
'use client'

import { useEffect, useRef } from 'react'

// We dynamically import Leaflet to avoid SSR issues
// Next.js renders on server first — Leaflet needs the browser
export default function LocationPicker({ lat, lng, onLocationSelect }) {
  const mapRef      = useRef(null)
  const leafletRef  = useRef(null)
  const markerRef   = useRef(null)
  const instanceRef = useRef(null)
  const initializingRef = useRef(false) // Tracking simultaneous initializations

  useEffect(() => {
    // Only run in browser
    if (typeof window === 'undefined') return
    // Don't initialize if already initialized or currently initializing
    if (instanceRef.current || initializingRef.current) return

    initializingRef.current = true

    const initMap = async () => {
      try {
        const L = (await import('leaflet')).default

        // Fix Leaflet's default icon path issue with Next.js
        delete L.Icon.Default.prototype._getIconUrl
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
          iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
          shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        })

        leafletRef.current = L

        // Default center — India
        const defaultLat = lat || 20.5937
        const defaultLng = lng || 78.9629
        const defaultZoom = lat ? 13 : 5

        // Double check map element still exists before drawing
        if (!mapRef.current) return

        // Wipe any left-over hidden Leaflet elements before instantiating
        const container = L.DomUtil.get(mapRef.current);
        if (container !== null) {
          container._leaflet_id = null;
        }

        // Initialize map
        const map = L.map(mapRef.current).setView([defaultLat, defaultLng], defaultZoom)
        instanceRef.current = map

        // Add OpenStreetMap tiles (free, no API key)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19,
        }).addTo(map)

        // If coordinates already exist, show marker
        if (lat && lng) {
          markerRef.current = L.marker([lat, lng]).addTo(map)
        }

        // Click on map → drop/move marker
        map.on('click', (e) => {
          const { lat: clickLat, lng: clickLng } = e.latlng

          // Remove old marker
          if (markerRef.current) {
            markerRef.current.remove()
          }

          // Add new marker
          markerRef.current = L.marker([clickLat, clickLng]).addTo(map)

          // Send coordinates up to parent form
          onLocationSelect(clickLat, clickLng)
        })
      } catch (error) {
        console.error("Leaflet initialization failed", error)
      } finally {
        initializingRef.current = false
      }
    }

    initMap()

    // Cleanup on unmount
    return () => {
      if (instanceRef.current) {
        instanceRef.current.remove()
        instanceRef.current = null;
      }
      initializingRef.current = false;
    }
  }, [lat, lng]) // Include coordinates so it handles state re-renders cleanly

  return (
    <div className="space-y-2">
      {/* Instruction */}
      <p className="text-xs text-gray-500 flex items-center gap-1">
        📍 Click on the map to drop a pin at the exact location
      </p>

      {/* Map container */}
      <div ref={mapRef} className="w-full h-56 sm:h-64 rounded-xl border border-gray-200 z-0" />

      {/* Show selected coordinates */}
      {lat && lng && (
        <p className="text-xs text-green-600 font-medium">
          ✅ Location pinned: {lat.toFixed(5)}, {lng.toFixed(5)}
        </p>
      )}
      {!lat && !lng && (
        <p className="text-xs text-amber-500">
          ⚠️ No pin dropped yet — click the map to set location
        </p>
      )}
    </div>
  )
}