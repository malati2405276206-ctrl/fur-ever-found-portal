// src/lib/geocode.js
// Nominatim — OpenStreetMap's free geocoding API
// No key, no billing, no quota issues for hackathon scale

export async function searchPlaces(query) {
  if (!query || query.trim().length < 3) return []

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&countrycodes=in`,
      {
        headers: {
          // Nominatim requires a User-Agent header
          'Accept-Language': 'en',
          'User-Agent': 'FurEverFound/1.0',
        },
      }
    )

    if (!response.ok) return []

    const data = await response.json()

    return data.map((place) => ({
      displayName: place.display_name,
      shortName: place.display_name.split(',').slice(0, 3).join(',').trim(),
      lat: parseFloat(place.lat),
      lng: parseFloat(place.lon),
    }))
  } catch (err) {
    console.error('Geocode error:', err)
    return []
  }
}