// src/lib/geocode.js
// Nominatim — OpenStreetMap's free geocoding API
// No key, no billing, no quota issues for hackathon scale

export async function searchPlaces(query) {
  if (!query || query.trim().length < 3) return []

  try {
    // Try two searches in parallel:
    // 1. Structured search biased to India
    // 2. Free-text search with "India" appended for better local results
    const [res1, res2] = await Promise.all([
      fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=4&countrycodes=in&addressdetails=1`,
        { headers: { 'Accept-Language': 'en', 'User-Agent': 'FurEverFound/1.0' } }
      ),
      fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query + ' India')}&format=json&limit=3&addressdetails=1`,
        { headers: { 'Accept-Language': 'en', 'User-Agent': 'FurEverFound/1.0' } }
      )
    ])

    const [data1, data2] = await Promise.all([res1.json(), res2.json()])

    // Merge, deduplicate by place_id
    const combined = [...data1, ...data2]
    const seen = new Set()
    const unique = combined.filter((place) => {
      if (seen.has(place.place_id)) return false
      seen.add(place.place_id)
      return true
    })

    return unique.slice(0, 5).map((place) => ({
      displayName: place.display_name,
      shortName:   place.display_name.split(',').slice(0, 3).join(',').trim(),
      lat:         parseFloat(place.lat),
      lng:         parseFloat(place.lon),
    }))

  } catch (err) {
    console.error('Geocode error:', err)
    return []
  }
}