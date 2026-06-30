// src/components/LogoIntro.js
'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function LogoIntro() {
  const [show, setShow] = useState(false)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    // Only show once per browser session, not on every page navigation
    const seen = sessionStorage.getItem('fef_intro_seen')
    if (!seen) {
      setShow(true)
      sessionStorage.setItem('fef_intro_seen', 'true')
    }
    setChecked(true)
  }, [])

  useEffect(() => {
    if (!show) return
    const timer = setTimeout(() => setShow(false), 2500)
    return () => clearTimeout(timer)
  }, [show])

  // Don't render anything until we've checked sessionStorage
  // (avoids a flash on every page load)
  if (!checked) return null

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center cursor-pointer"
          style={{ background: '#EBDDC5' }}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={() => setShow(false)}
        >
          {/* Paw print SVG with stroke-draw animation */}
          <motion.svg
            width="80"
            height="80"
            viewBox="0 0 100 100"
            initial="hidden"
            animate="visible"
          >
            <motion.path
              d="M50 60c-12 0-22 8-22 18 0 6 5 10 11 10 5 0 7-3 11-3s6 3 11 3c6 0 11-4 11-10 0-10-10-18-22-18z"
              fill="none"
              stroke="#E59D2C"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              variants={{
                hidden: { pathLength: 0, opacity: 0 },
                visible: { pathLength: 1, opacity: 1, transition: { duration: 0.7, ease: 'easeOut' } },
              }}
            />
            <motion.circle cx="30" cy="45" r="6" fill="none" stroke="#E59D2C" strokeWidth="3"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.6 }}
            />
            <motion.circle cx="50" cy="38" r="6" fill="none" stroke="#E59D2C" strokeWidth="3"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.7 }}
            />
            <motion.circle cx="70" cy="45" r="6" fill="none" stroke="#E59D2C" strokeWidth="3"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.8 }}
            />
          </motion.svg>

          {/* Wordmark */}
          <motion.p
            className="mt-4 text-xl font-bold text-gray-800"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 1 }}
          >
            Fur Ever <span style={{ color: '#E59D2C' }}>Found</span>
          </motion.p>

          {/* Skip hint */}
          <motion.p
            className="mt-2 text-xs text-gray-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 1.2 }}
          >
            Tap to skip
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}