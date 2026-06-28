// src/lib/sanitize.js
// Cleans user input before saving to database
// Prevents XSS attacks and removes malicious content

// Basic string sanitizer
// Removes HTML tags, trims whitespace, limits length
export function sanitizeText(value, maxLength = 500) {
  if (!value || typeof value !== 'string') return ''
  return value
    .trim()
    .replace(/<[^>]*>/g, '')        // strip HTML tags
    .replace(/javascript:/gi, '')   // strip javascript: protocol
    .replace(/on\w+=/gi, '')        // strip event handlers like onclick=
    .slice(0, maxLength)            // enforce max length
}

// Sanitize email
export function sanitizeEmail(value) {
  if (!value || typeof value !== 'string') return ''
  return value.trim().toLowerCase().slice(0, 254)
}

// Sanitize phone number — only allow digits, +, -, spaces
export function sanitizePhone(value) {
  if (!value || typeof value !== 'string') return ''
  return value.replace(/[^\d\s\+\-\(\)]/g, '').trim().slice(0, 20)
}

// Sanitize URL
export function sanitizeUrl(value) {
  if (!value || typeof value !== 'string') return ''
  const trimmed = value.trim()
  // Only allow http and https protocols
  if (trimmed && !trimmed.match(/^https?:\/\//i)) return ''
  return trimmed.slice(0, 500)
}

// Sanitize a whole form object at once
// Pass an object of { fieldName: { value, type, maxLength } }
export function sanitizeForm(fields) {
  const result = {}
  for (const [key, config] of Object.entries(fields)) {
    const { value, type = 'text', maxLength } = config
    switch (type) {
      case 'email':  result[key] = sanitizeEmail(value);              break
      case 'phone':  result[key] = sanitizePhone(value);              break
      case 'url':    result[key] = sanitizeUrl(value);                break
      default:       result[key] = sanitizeText(value, maxLength);    break
    }
  }
  return result
}