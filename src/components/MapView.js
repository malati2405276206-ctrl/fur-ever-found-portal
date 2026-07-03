// src/components/MapView.js
'use client'

import { useEffect, useRef } from 'react'
import { getDirectionsUrl } from '@/lib/directions'
import { fetchNearbyHelp } from '@/lib/nearbyPlaces'

export default function MapView({ cats }) {
  const mapRef = useRef(null)
  const instanceRef = useRef(null)
  const markersRef = useRef([])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const initMap = async () => {
      const L = (await import('leaflet')).default

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

      if (cats.length === 0) return

      const colors = { lost: '#ef4444', found: '#22c55e', adoption: '#a855f7' }

      cats.forEach((cat) => {
        if (!cat.latitude || !cat.longitude) return

        const color = colors[cat._type] || '#6b7280'
        const lat = cat.latitude
        const lng = cat.longitude

        const icon = L.divIcon({
          className: '',
          html: `<div style="width:28px;height:28px;background:${color};border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-size:12px;">${cat._type === 'lost' ? '😿' : cat._type === 'found' ? '😊' : '🏠'}</div>`,
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
              : `<div style="width:100%;height:60px;background:#f3f4f6;border-radius:8px;margin-bottom:8px;display:flex;align-items:center;justify-content:center;font-size:24px;">🐱</div>`
            }
            <div style="font-size:11px;font-weight:700;text-transform:uppercase;color:${color};margin-bottom:4px;">
              ${cat._type === 'lost' ? '😿 Lost Cat' : cat._type === 'found' ? '😊 Found Cat' : '🏠 For Adoption'}
            </div>
            <div style="font-weight:700;font-size:15px;color:#111;margin-bottom:2px;">
              ${cat.name || 'Unknown Cat'}
            </div>
            <div style="font-size:12px;color:#6b7280;margin-bottom:6px;">📍 ${cat.location || cat.city || ''}</div>
            <div style="font-size:12px;color:#374151;margin-bottom:10px;line-height:1.4;">
              ${(cat.description || '').slice(0, 100)}${(cat.description || '').length > 100 ? '...' : ''}
            </div>

            <a href="${directionsUrl}" target="_blank" rel="noopener noreferrer" style="display:block;background:${color};color:white;text-align:center;padding:7px 12px;border-radius:8px;font-size:12px;font-weight:600;text-decoration:none;margin-bottom:6px;">
              🧭 Get Directions
            </a>

            <a href="mailto:${cat.contact_email || ''}" style="display:block;border:1px solid ${color};color:${color};text-align:center;padding:6px 12px;border-radius:8px;font-size:12px;font-weight:600;text-decoration:none;margin-bottom:8px;">
              📧 Contact
            </a>

            <button onclick="window.__loadNearbyHelp('${popupId}', ${lat}, ${lng})" style="width:100%;background:#f9fafb;border:1px solid #e5e7eb;color:#374151;padding:6px 12px;border-radius:8px;font-size:11px;font-weight:600;cursor:pointer;">
              📍 Show Nearby Help
            </button>
            <div id="${popupId}" style="margin-top:8px;"></div>
          </div>
        `

        const marker = L.marker([lat, lng], { icon })
          .addTo(instanceRef.current)
          .bindPopup(popupContent, { maxWidth: 240 })

        markersRef.current.push(marker)
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

  return <div ref={mapRef} className="w-full" style={{ height: 'calc(100vh - 180px)', minHeight: '400px' }} />
}