// src/lib/directions.js
// Generates a Google Maps directions URL — no API key needed
// Opens natively in the Google Maps app on mobile, browser on desktop
// Google Maps handles the user's current location via its own geolocation prompt

export function getDirectionsUrl(lat, lng) {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
}