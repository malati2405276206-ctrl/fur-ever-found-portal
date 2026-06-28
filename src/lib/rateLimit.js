// src/lib/rateLimit.js
// Prevents users from spamming form submissions
// Uses localStorage to track submission times client-side
// Server-side rate limiting is handled by Supabase + API route

const LIMITS = {
  report:   { max: 5,  windowMs: 60 * 60 * 1000 },  // 5 reports per hour
  ngoSignup:{ max: 3,  windowMs: 60 * 60 * 1000 },  // 3 attempts per hour
  aiMatch:  { max: 10, windowMs: 60 * 60 * 1000 },  // 10 AI searches per hour
  login:    { max: 10, windowMs: 15 * 60 * 1000 },  // 10 login attempts per 15 min
}

export function checkRateLimit(action) {
  if (typeof window === 'undefined') return { allowed: true }

  const limit  = LIMITS[action]
  if (!limit) return { allowed: true }

  const key       = `fur_ever_rate_${action}`
  const now       = Date.now()
  const stored    = localStorage.getItem(key)
  let timestamps  = []

  try {
    timestamps = stored ? JSON.parse(stored) : []
  } catch {
    timestamps = []
  }

  // Remove timestamps outside the current window
  timestamps = timestamps.filter((t) => now - t < limit.windowMs)

  if (timestamps.length >= limit.max) {
    // Calculate how long until the oldest entry expires
    const oldestTs    = Math.min(...timestamps)
    const resetInMs   = limit.windowMs - (now - oldestTs)
    const resetInMins = Math.ceil(resetInMs / 60000)

    return {
      allowed: false,
      message: `Too many attempts. Please wait ${resetInMins} minute${resetInMins > 1 ? 's' : ''} before trying again.`,
    }
  }

  // Record this attempt
  timestamps.push(now)
  localStorage.setItem(key, JSON.stringify(timestamps))

  return { allowed: true }
}

// Call this after successful submission to clear the rate limit record
export function clearRateLimit(action) {
  if (typeof window === 'undefined') return
  localStorage.removeItem(`fur_ever_rate_${action}`)
}