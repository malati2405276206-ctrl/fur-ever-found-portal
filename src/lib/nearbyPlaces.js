// src/lib/nearbyPlaces.js
// Uses the Overpass API (OpenStreetMap) — free, no key, no billing
// Finds vets, animal shelters, and police stations within a radius of a pin

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter'

// Haversine formula — straight-line distance between two coordinates in meters
function distanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000
  const toRad = (deg) => (deg * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function formatDistance(meters) {
  if (meters < 1000) return `${Math.round(meters)}m`
  return `${(meters / 1000).toFixed(1)}km`
}

const typeConfig = {
  veterinary:      { label: 'Vet Clinic',        icon: '<img src="/icon-emoji/paw-heart.png" width="60" height="60" style="display:inline;vertical-align:middle;" />' },
  animal_shelter:  { label: 'Animal Shelter',    icon: '<img src="/icon-emoji/house.png" width="60" height="60" style="display:inline;vertical-align:middle;" />' },
  police:          { label: 'Police Station',    icon: '<img src="/icon-emoji/direction.png" width="60" height="60" style="display:inline;vertical-align:middle;" />' },
}

export async function fetchNearbyHelp(lat, lng, radiusMeters = 2000) {
  // Overpass QL query — asks for vets, animal shelters, and police within radius
  const query = `
    [out:json][timeout:10];
    (
      node["amenity"="veterinary"](around:${radiusMeters},${lat},${lng});
      node["amenity"="animal_shelter"](around:${radiusMeters},${lat},${lng});
      node["amenity"="police"](around:${radiusMeters},${lat},${lng});
    );
    out body;
  `

  try {
    const response = await fetch(OVERPASS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: query,
    })

    if (!response.ok) throw new Error('Overpass request failed')

    const data = await response.json()

    const results = (data.elements || [])
      .filter((el) => el.tags?.amenity && typeConfig[el.tags.amenity])
      .map((el) => {
        const dist = distanceMeters(lat, lng, el.lat, el.lon)
        return {
          id: el.id,
          name: el.tags.name || typeConfig[el.tags.amenity].label,
          type: el.tags.amenity,
          icon: typeConfig[el.tags.amenity].icon,
          lat: el.lat,
          lng: el.lon,
          distance: dist,
          distanceLabel: formatDistance(dist),
        }
      })
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 5)

    return results
  } catch (err) {
    console.error('Nearby help fetch error:', err)
    return []
  }
}