// src/components/AuthToggle.js
'use client'

import { usePathname, useRouter } from 'next/navigation'

/**
 * Pill-shaped Login/Sign Up toggle for the Navbar.
 * Automatically highlights the active tab based on current route.
 * Navigates to /login or /signup on click.
 */
export default function AuthToggle() {
  const pathname = usePathname()
  const router = useRouter()

  // Determine active tab from URL
  const activeTab = pathname === '/signup' ? 'signup' : 'login'

  const handleSwitch = (tab) => {
    if (tab === 'login') router.push('/login')
    if (tab === 'signup') router.push('/signup')
  }

  return (
    <div className="relative inline-flex items-center rounded-full p-1" style={{ backgroundColor: '#2D4059', border: '1px solid rgba(229, 186, 115, 0.3)' }}>
      {/* Sliding highlight */}
      <div
        className="absolute top-1 bottom-1 rounded-full transition-all duration-300 ease-out pointer-events-none"
        style={{
          backgroundColor: '#E5BA73',
          width: 'calc(50% - 4px)',
          left: activeTab === 'login' ? '4px' : 'calc(50%)',
        }}
      />

      {/* Login tab */}
      <button
        type="button"
        onClick={() => handleSwitch('login')}
        className="relative z-10 px-5 py-1.5 rounded-full text-sm font-semibold transition-colors duration-300 ease-out"
        style={{
          color: activeTab === 'login' ? '#2D4059' : '#E5BA73',
        }}
        onMouseEnter={(e) => {
          if (activeTab !== 'login') e.currentTarget.style.color = '#f3d9aa'
        }}
        onMouseLeave={(e) => {
          if (activeTab !== 'login') e.currentTarget.style.color = '#E5BA73'
        }}
      >
        Login
      </button>

      {/* Sign Up tab */}
      <button
        type="button"
        onClick={() => handleSwitch('signup')}
        className="relative z-10 px-5 py-1.5 rounded-full text-sm font-semibold transition-colors duration-300 ease-out"
        style={{
          color: activeTab === 'signup' ? '#2D4059' : '#E5BA73',
        }}
        onMouseEnter={(e) => {
          if (activeTab !== 'signup') e.currentTarget.style.color = '#f3d9aa'
        }}
        onMouseLeave={(e) => {
          if (activeTab !== 'signup') e.currentTarget.style.color = '#E5BA73'
        }}
      >
        Sign Up
      </button>
    </div>
  )
}
