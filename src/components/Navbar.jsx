// src/components/Navbar.js
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useRole } from '@/hooks/useRole'
import { logout } from '@/lib/auth'

export default function Navbar() {
  const { user, loading: authLoading } = useAuth()
  const { isNGO, loading: roleLoading } = useRole()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    router.push('/')
    router.refresh()
    setMenuOpen(false)
  }

  const isLoading = authLoading || roleLoading

  const navLinks = [
    { href: '/',            label: 'Home'        },
    { href: '/lost-cats',   label: '😿 Lost'     },
    { href: '/found-cats',  label: '😊 Found'    },
    { href: '/adoption',    label: '🏠 Adoption' },
    { href: '/stories',     label: '📖 Stories'  },
    { href: '/map',         label: '🗺️ Map'      },
  ]

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-orange-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="text-xl sm:text-2xl">🐾</span>
          <span className="text-base sm:text-lg font-bold text-gray-800">
            Fur Ever <span className="text-orange-500">Found</span>
          </span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden lg:flex items-center gap-4 xl:gap-6">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="text-gray-600 hover:text-orange-500 font-medium text-sm transition whitespace-nowrap">
              {link.label}
            </Link>
          ))}
        </div>

        {/* Desktop auth buttons */}
        <div className="hidden lg:flex items-center gap-2 xl:gap-3">
          {isLoading ? (
            <div className="w-24 h-9 bg-gray-100 rounded-xl animate-pulse" />
          ) : user ? (
            <>
              {isNGO ? (
                <Link href="/ngo-dashboard" className="bg-purple-500 hover:bg-purple-600 text-white px-3 xl:px-4 py-2 rounded-xl text-sm font-semibold transition whitespace-nowrap">
                  🏢 Dashboard
                </Link>
              ) : (
                <Link href="/report" className="bg-orange-500 hover:bg-orange-600 text-white px-3 xl:px-4 py-2 rounded-xl text-sm font-semibold transition whitespace-nowrap">
                  + Report Cat
                </Link>
              )}
              <Link href="/profile" className="text-gray-500 hover:text-orange-500 text-sm font-medium transition">
                👤 Profile
              </Link>
              <button onClick={handleLogout} className="text-gray-500 hover:text-red-500 text-sm font-medium transition">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-gray-600 hover:text-orange-500 text-sm font-medium transition">
                Login
              </Link>
              <Link href="/signup" className="bg-orange-500 hover:bg-orange-600 text-white px-3 xl:px-4 py-2 rounded-xl text-sm font-semibold transition">
                Sign Up
              </Link>
            </>
          )}
        </div>

        {/* Mobile/Tablet hamburger */}
        <button className="lg:hidden p-2 text-gray-600 hover:text-orange-500 transition" onClick={() => setMenuOpen(!menuOpen)}>
          <span className="text-xl">{menuOpen ? '✕' : '☰'}</span>
        </button>
      </div>

      {/* Mobile/Tablet dropdown */}
      {menuOpen && (
        <div className="lg:hidden bg-white border-t border-orange-100 px-4 sm:px-6 py-4 space-y-1">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} onClick={() => setMenuOpen(false)} className="block text-gray-700 hover:text-orange-500 hover:bg-orange-50 font-medium py-2.5 px-3 rounded-xl text-sm transition">
              {link.label}
            </Link>
          ))}

          <div className="pt-3 mt-3 border-t border-gray-100 space-y-2">
            {isLoading ? (
              <div className="w-full h-10 bg-gray-100 rounded-xl animate-pulse" />
            ) : user ? (
              <>
                {isNGO ? (
                  <Link href="/ngo-dashboard" onClick={() => setMenuOpen(false)} className="block text-center bg-purple-500 hover:bg-purple-600 text-white py-2.5 rounded-xl text-sm font-semibold transition">
                    🏢 NGO Dashboard
                  </Link>
                ) : (
                  <Link href="/report" onClick={() => setMenuOpen(false)} className="block text-center bg-orange-500 hover:bg-orange-600 text-white py-2.5 rounded-xl text-sm font-semibold transition">
                    + Report a Cat
                  </Link>
                )}
                <Link href="/profile" onClick={() => setMenuOpen(false)} className="block text-center border border-gray-200 text-gray-600 hover:bg-gray-50 py-2.5 rounded-xl text-sm font-medium transition">
                  👤 My Profile
                </Link>
                <button onClick={handleLogout} className="block w-full text-center text-red-500 hover:bg-red-50 font-medium text-sm py-2.5 rounded-xl transition">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={() => setMenuOpen(false)} className="block text-center border border-orange-300 text-orange-500 hover:bg-orange-50 py-2.5 rounded-xl text-sm font-medium transition">
                  Login
                </Link>
                <Link href="/signup" onClick={() => setMenuOpen(false)} className="block text-center bg-orange-500 hover:bg-orange-600 text-white py-2.5 rounded-xl text-sm font-semibold transition">
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}