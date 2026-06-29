// src/components/MapView.js
'use client'

import { useEffect, useRef } from 'react'

export default function MapView({ cats }) {
  const mapRef      = useRef(null)
  const instanceRef = useRef(null)
  const markersRef  = useRef([])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const initMap = async () => {
      const L = (await import('leaflet')).default

      // Fix icon paths
      delete L.Icon.Default.prototype._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      // Initialize map centered on India
      if (!instanceRef.current) {
        instanceRef.current = L.map(mapRef.current).setView([20.5937, 78.9629], 5)

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19,
        }).addTo(instanceRef.current)
      }

      // Clear existing markers
      markersRef.current.forEach((m) => m.remove())
      markersRef.current = []

      if (cats.length === 0) return

      // Color per type
      const colors = {
        lost:     '#ef4444',  // red
        found:    '#22c55e',  // green
        adoption: '#a855f7',  // purple
      }

      // Add a marker for each cat
      cats.forEach((cat) => {
        if (!cat.latitude || !cat.longitude) return

        const color = colors[cat._type] || '#6b7280'

        // Custom colored circle marker
        const icon = L.divIcon({
          className: '',
          html: `<div style="
            width: 28px;
            height: 28px;
            background: ${color};
            border: 3px solid white;
            border-radius: 50%;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
          ">${cat._type === 'lost' ? '😿' : cat._type === 'found' ? '😊' : '🏠'}</div>`,
          iconSize:   [28, 28],
          iconAnchor: [14, 14],
        })

        // Build popup content
        const popupContent = `
          <div style="min-width: 200px; font-family: sans-serif;">
            ${cat.image_url
              ? `<img src="${cat.image_url}" style="width:100%; height:100px; object-fit:cover; border-radius:8px; margin-bottom:8px;" />`
              : `<div style="width:100%; height:60px; background:#f3f4f6; border-radius:8px; margin-bottom:8px; display:flex; align-items:center; justify-content:center; font-size:24px;">🐱</div>`
            }
            <div style="font-size:11px; font-weight:700; text-transform:uppercase; color:${color}; margin-bottom:4px;">
              ${cat._type === 'lost' ? '😿 Lost Cat' : cat._type === 'found' ? '😊 Found Cat' : '🏠 For Adoption'}
            </div>
            <div style="font-weight:700; font-size:15px; color:#111; margin-bottom:2px;">
              ${cat.name || 'Unknown Cat'}
            </div>
            <div style="font-size:12px; color:#6b7280; margin-bottom:6px;">
              📍 ${cat.location || cat.city || ''}
            </div>
            <div style="font-size:12px; color:#374151; margin-bottom:8px; line-height:1.4;">
              ${(cat.description || '').slice(0, 100)}${(cat.description || '').length > 100 ? '...' : ''}
            </div>
            <a href="mailto:${cat.contact_email || ''}" style="
              display:block;
              background:${color};
              color:white;
              text-align:center;
              padding:6px 12px;
              border-radius:8px;
              font-size:12px;
              font-weight:600;
              text-decoration:none;
            ">📧 Contact</a>
          </div>
        `

        const marker = L.marker([cat.latitude, cat.longitude], { icon })
          .addTo(instanceRef.current)
          .bindPopup(popupContent, { maxWidth: 220 })

        markersRef.current.push(marker)
      })

      // Auto-fit map to show all markers
      if (markersRef.current.length > 0) {
        const group = L.featureGroup(markersRef.current)
        instanceRef.current.fitBounds(group.getBounds().pad(0.1))
      }
    }

    initMap()
  }, [cats])

  return (
    <div ref={mapRef} className="w-full" style={{ height: 'calc(100vh - 140px)' }} />
  )
}