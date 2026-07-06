// src/components/MapView.js
'use client'

import { useEffect, useRef } from 'react'
import { getDirectionsUrl } from '@/lib/directions'
import { fetchNearbyHelp } from '@/lib/nearbyPlaces'

export default function MapView({ cats, selectedCat }) {
  const mapRef = useRef(null)
  const instanceRef = useRef(null)
  const markersRef = useRef([])
  const markerMapRef = useRef({})
  const leafletRef = useRef(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const initMap = async () => {
      const L = (await import('leaflet')).default
      leafletRef.current = L

      delete L.Icon.Default.prototype._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      if (!instanceRef.current) {
        instanceRef.current = L.map(mapRef.current).setView([20.5937, 78.9629], 5)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19,
        }).addTo(instanceRef.current)
      }

      markersRef.current.forEach((m) => m.remove())
      markersRef.current = []
      markerMapRef.current = {}

      if (cats.length === 0) return

      const colors = { lost: '#ef4444', found: '#22c55e', adoption: '#a855f7' }

      cats.forEach((cat) => {
        if (!cat.latitude || !cat.longitude) return

        const color = colors[cat._type] || '#6b7280'
        const lat = cat.latitude
        const lng = cat.longitude

        const icon = L.divIcon({
          className: 'custom-map-pin',
          html: `<div style="width:28px;height:28px;background:${color};border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;overflow:hidden;"><img src="${cat._type === 'lost' ? '/icon-emoji/lost-cat.png' : cat._type === 'found' ? '/icon-emoji/found-cat.png' : '/icon-emoji/house.png'}" style="width:14px;height:14px;object-fit:contain;" /></div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        })

        // Unique id for this popup's nearby-help container
        const popupId = `nearby-${cat._type}-${cat.id}`
        const directionsUrl = getDirectionsUrl(lat, lng)

        const popupContent = `
          <div style="min-width: 220px; font-family: sans-serif;">
            ${cat.image_url
              ? `<img src="${cat.image_url}" style="width:100%;height:100px;object-fit:cover;border-radius:8px;margin-bottom:8px;" />`
              : `<div style="width:100%;height:60px;background:#f3f4f6;border-radius:8px;margin-bottom:8px;display:flex;align-items:center;justify-content:center;"><img src="/icon-emoji/cat-face.png" width="60" height="60" /></div>`
            }
            <div style="font-size:11px;font-weight:700;text-transform:uppercase;color:${color};margin-bottom:4px;">
              ${cat._type === 'lost' ? '<img src="/icon-emoji/lost-cat.png" width="60" height="60" style="display:inline;vertical-align:middle;margin-right:3px;" />Lost Cat' : cat._type === 'found' ? '<img src="/icon-emoji/found-cat.png" width="60" height="60" style="display:inline;vertical-align:middle;margin-right:3px;" />Found Cat' : '<img src="/icon-emoji/house.png" width="60" height="60" style="display:inline;vertical-align:middle;margin-right:3px;" />For Adoption'}
            </div>
            <div style="font-weight:700;font-size:15px;color:#111;margin-bottom:2px;">
              ${cat.name || 'Unknown Cat'}
            </div>
            <div style="font-size:12px;color:#6b7280;margin-bottom:6px;"><img src="/icon-emoji/paw-shaped location pin.png" width="60" height="60" style="display:inline;vertical-align:middle;margin-right:2px;" />${cat.location || cat.city || ''}</div>
            <div style="font-size:12px;color:#374151;margin-bottom:10px;line-height:1.4;">
              ${(cat.description || '').slice(0, 100)}${(cat.description || '').length > 100 ? '...' : ''}
            </div>

            <a href="${directionsUrl}" target="_blank" rel="noopener noreferrer" style="display:block;background:${color};color:white;text-align:center;padding:7px 12px;border-radius:8px;font-size:12px;font-weight:600;text-decoration:none;margin-bottom:6px;">
              <img src="/icon-emoji/direction.png" width="60" height="60" style="display:inline;vertical-align:middle;margin-right:3px;" />Get Directions
            </a>

            <a href="mailto:${cat.contact_email || ''}" style="display:block;border:1px solid ${color};color:${color};text-align:center;padding:6px 12px;border-radius:8px;font-size:12px;font-weight:600;text-decoration:none;margin-bottom:8px;">
              Contact
            </a>

            <button onclick="window.__loadNearbyHelp('${popupId}', ${lat}, ${lng})" style="width:100%;background:#f9fafb;border:1px solid #e5e7eb;color:#374151;padding:6px 12px;border-radius:8px;font-size:11px;font-weight:600;cursor:pointer;">
              <img src="/icon-emoji/paw-shaped location pin.png" width="60" height="60" style="display:inline;vertical-align:middle;margin-right:2px;" />Show Nearby Help
            </button>
            <div id="${popupId}" style="margin-top:8px;"></div>
          </div>
        `

        const marker = L.marker([lat, lng], { icon })
          .addTo(instanceRef.current)
          .bindPopup(popupContent, { maxWidth: 240 })

        markersRef.current.push(marker)
        markerMapRef.current[`${cat._type}-${cat.id}`] = marker
      })

      // Global function the popup button calls (Leaflet popups are raw HTML,
      // so we attach this to window for the inline onclick to reach it)
      window.__loadNearbyHelp = async (containerId, lat, lng) => {
        const container = document.getElementById(containerId)
        if (!container) return

        container.innerHTML = `<div style="text-align:center;padding:8px;font-size:11px;color:#9ca3af;">Searching nearby...</div>`

        const places = await fetchNearbyHelp(lat, lng)

        if (places.length === 0) {
          container.innerHTML = `<div style="text-align:center;padding:8px;font-size:11px;color:#9ca3af;">No nearby help points found within 2km.</div>`
          return
        }

        container.innerHTML = places
          .map(
            (p) => `
            <a href="${getDirectionsUrl(p.lat, p.lng)}" target="_blank" rel="noopener noreferrer" style="display:flex;align-items:center;justify-content:space-between;padding:6px 8px;border-radius:6px;text-decoration:none;background:#f9fafb;margin-bottom:4px;">
              <span style="font-size:11px;color:#374151;">${p.icon} ${p.name}</span>
              <span style="font-size:10px;color:#9ca3af;">${p.distanceLabel}</span>
            </a>
          `
          )
          .join('')
      }

      if (markersRef.current.length > 0) {
        const group = L.featureGroup(markersRef.current)
        instanceRef.current.fitBounds(group.getBounds().pad(0.1))
      }
    }

    initMap()
  }, [cats])

  // Fly to selected cat, highlight its marker, and open popup
  useEffect(() => {
    if (!selectedCat || !instanceRef.current || !leafletRef.current) return

    const L = leafletRef.current
    const key = `${selectedCat._type}-${selectedCat.id}`
    const marker = markerMapRef.current[key]

    if (marker) {
      // Remove any previous highlight circle
      if (window.__highlightCircle) {
        window.__highlightCircle.remove()
        window.__highlightCircle = null
      }

      const colors = { lost: '#ef4444', found: '#22c55e', adoption: '#a855f7' }
      const color = colors[selectedCat._type] || '#6b7280'

      // Swap icon to a bigger, pulsing version
      const bigIcon = L.divIcon({
        className: 'custom-map-pin',
        html: `<div style="width:42px;height:42px;background:${color};border:4px solid white;border-radius:50%;box-shadow:0 0 0 6px ${color}44, 0 4px 16px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;overflow:hidden;animation:pulse-marker 1.5s ease-in-out infinite;transition:all 0.3s ease;"><img src="${selectedCat._type === 'lost' ? '/icon-emoji/lost-cat.png' : selectedCat._type === 'found' ? '/icon-emoji/found-cat.png' : '/icon-emoji/house.png'}" style="width:20px;height:20px;object-fit:contain;" /></div>`,
        iconSize: [42, 42],
        iconAnchor: [21, 21],
      })
      marker.setIcon(bigIcon)

      // Add a pulsing ring circle on the map around the marker
      window.__highlightCircle = L.circleMarker(
        [selectedCat.latitude, selectedCat.longitude],
        {
          radius: 28,
          color: color,
          weight: 3,
          opacity: 0.7,
          fillColor: color,
          fillOpacity: 0.12,
          className: 'highlight-pulse-ring',
        }
      ).addTo(instanceRef.current)

      // Fly to location
      instanceRef.current.flyTo(
        [selectedCat.latitude, selectedCat.longitude],
        15,
        { duration: 1.2 }
      )

      // Open popup after fly
      setTimeout(() => {
        marker.openPopup()
      }, 1300)

      // Reset marker back to normal size after 6 seconds
      const resetTimeout = setTimeout(() => {
        const normalIcon = L.divIcon({
          className: 'custom-map-pin',
          html: `<div style="width:28px;height:28px;background:${color};border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;overflow:hidden;"><img src="${selectedCat._type === 'lost' ? '/icon-emoji/lost-cat.png' : selectedCat._type === 'found' ? '/icon-emoji/found-cat.png' : '/icon-emoji/house.png'}" style="width:14px;height:14px;object-fit:contain;" /></div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        })
        marker.setIcon(normalIcon)

        if (window.__highlightCircle) {
          window.__highlightCircle.remove()
          window.__highlightCircle = null
        }
      }, 6000)

      return () => clearTimeout(resetTimeout)
    }
  }, [selectedCat])

return <div ref={mapRef} className="w-full" style={{ height: 'calc(100vh - 180px)', minHeight: '400px' }} />
}