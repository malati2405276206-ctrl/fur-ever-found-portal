'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function LogoIntro() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const seen = sessionStorage.getItem('fef_intro_seen')
    if (!seen) {
      sessionStorage.setItem('fef_intro_seen', 'true')
      setShow(true)
    }
  }, [])

  useEffect(() => {
    if (!show) return
    const timer = setTimeout(() => setShow(false), 4200)
    return () => clearTimeout(timer)
  }, [show])

  const createSwirlCharacters = (text) => {
    return text.split('').map((char, index) => {
      const randomX = Math.sin(index) * 80 + (Math.random() - 0.5) * 40;
      const randomY = Math.cos(index) * 80 + (Math.random() - 0.5) * 40;
      const randomRotate = (Math.random() - 0.5) * 180;

      return (
        <motion.span
          key={index}
          className="inline-block"
          initial={{ 
            opacity: 0, 
            x: randomX, 
            y: randomY, 
            rotate: randomRotate,
            scale: 1.8,
            filter: "blur(8px)"
          }}
          animate={{ 
            opacity: 1, 
            x: 0, 
            y: 0, 
            rotate: 0,
            scale: 1,
            filter: "blur(0px)"
          }}
          transition={{
            duration: 1.8,
            delay: 0.3 + (index * 0.04),
            ease: [0.25, 1, 0.5, 1] 
          }}
        >
          {char === ' ' ? '\u00A0' : char}
        </motion.span>
      )
    })
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          // Matched to your exact UI background canvas canvas color (#EBE1CE)
          className="fixed inset-0 z-[100] bg-[#EBE1CE] flex flex-col items-center justify-center cursor-pointer select-none overflow-hidden"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
          onClick={() => setShow(false)}
        >
          {/* --- MATCHED FLUID VORTEX BACKGROUND --- */}
          <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none filter blur-3xl scale-125">
            {/* Slate Navy Layer (#2B3E64) */}
            <motion.svg 
              className="absolute w-[400px] h-[400px]" 
              viewBox="0 0 200 200"
              animate={{ rotate: 360, scale: [1, 1.1, 0.9, 1] }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            >
              <path fill="#2B3E64" d="M45,-63C58,-54,67,-39,73,-23C78,-7,81,11,75,26C69,41,55,54,40,63C24,72,6,77,-12,75C-30,73,-49,64,-61,50C-73,36,-79,18,-78,0C-77,-17,-69,-34,-57,-44C-45,-54,-28,-57,-11,-61C6,-64,22,-69,45,-63Z" transform="translate(100 100)" />
            </motion.svg>

            {/* Dashboard Gold Layer (#F2C977) */}
            <motion.svg 
              className="absolute w-[450px] h-[450px]" 
              viewBox="0 0 200 200"
              animate={{ rotate: -360, scale: [1, 0.85, 1.15, 1] }}
              transition={{ duration: 11, repeat: Infinity, ease: "linear" }}
            >
              <path fill="#F2C977" d="M39.9,-53.2C52.4,-46.1,63.7,-34.5,67.6,-20.5C71.5,-6.6,67.9,9.8,61.4,24.8C54.8,39.8,45.2,53.4,32.2,59.8C19.3,66.2,2.9,65.4,-13,61.2C-28.9,57,-44.3,49.5,-53.8,37.3C-63.3,25.1,-67,8.2,-65,-7.6C-63.1,-23.4,-55.6,-38,-44,-45.3C-32.4,-52.7,-16.2,-52.8,-0.3,-52.3C15.6,-51.8,31.2,-50.7,39.9,-53.2Z" transform="translate(100 100)" />
            </motion.svg>
          </div>

          {/* --- TYPOGRAPHY COMPOSITION --- */}
          <div
            className="flex flex-col items-start leading-[0.82] tracking-tight relative z-10 font-serif font-black"
            style={{ fontSize: 'clamp(3.8rem, 11vw, 7rem)' }} 
          >
            {/* fur - Matched to Slate Navy */}
            <div className="text-[#2B3E64]">
              {createSwirlCharacters("fur")}
            </div>

            {/* ever - Matched to Slate Navy */}
            <div className="text-[#2B3E64]">
              {createSwirlCharacters("ever")}
            </div>

            {/* found - Matched to Dashboard Gold Accent */}
            <div className="text-[#F2C977] relative">
              {createSwirlCharacters("found")}
              
              <motion.span 
                className="absolute bottom-1 -right-3 text-[10px] font-sans font-light text-[#F2C977] opacity-60"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 0.6, scale: 1 }}
                transition={{ delay: 2.2, duration: 0.4 }}
              >
                ®
              </motion.span>
            </div>
          </div>

          {/* Skip Hint */}
          <motion.p 
            className="absolute bottom-8 text-[11px] font-sans uppercase tracking-widest text-[#2B3E64]/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.5, duration: 0.5 }}
          >
            Tap to skip
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}