// src/hooks/useFormPersist.js
'use client'

import { useState, useEffect } from 'react'

// Usage in any form:
// const [value, setValue] = useFormPersist('unique-key', 'default')
//
// Works exactly like useState BUT:
// → saves to localStorage on every change
// → restores from localStorage on remount/tab switch
// → clears from localStorage when you call clearPersistedForm()

export function useFormPersist(key, defaultValue) {
  const storageKey = `fur_ever_found_form_${key}`

  const [value, setValue] = useState(() => {
    // Try to load saved value from localStorage on first render
    if (typeof window === 'undefined') return defaultValue
    try {
      const saved = localStorage.getItem(storageKey)
      return saved !== null ? JSON.parse(saved) : defaultValue
    } catch {
      return defaultValue
    }
  })

  // Save to localStorage whenever value changes
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem(storageKey, JSON.stringify(value))
    } catch {
      // localStorage full or unavailable — fail silently
    }
  }, [value, storageKey])

  return [value, setValue]
}

// Call this after successful form submission to wipe saved data
export function clearPersistedForm(keys) {
  if (typeof window === 'undefined') return
  keys.forEach((key) => {
    localStorage.removeItem(`fur_ever_found_form_${key}`)
  })
}