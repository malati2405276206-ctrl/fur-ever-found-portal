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

  const navLinks = [
    { href: '/',            label: 'Home'        },
    { href: '/lost-cats',   label: '😿 Lost'     },
    { href: '/found-cats',  label: '😊 Found'    },
    { href: '/adoption',    label: '🏠 Adoption' },
  ]

  // Wait for BOTH auth AND role to finish loading
  // before showing any auth buttons
  const isLoading = authLoading || roleLoading

  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-orange-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">🐾</span>
          <span className="text-lg font-bold text-gray-800">
            Fur Ever <span className="text-orange-500">Found</span>
          </span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-gray-600 hover:text-orange-500 font-medium text-sm transition"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Desktop auth buttons — only ONE block renders */}
        <div className="hidden md:flex items-center gap-3">
          {isLoading ? (
            // Show placeholder while loading
            <div className="w-24 h-9 bg-gray-100 rounded-xl animate-pulse" />
          ) : user ? (
            // Logged in — show ONE set of buttons
            <>
              {isNGO ? (
                <Link
                  href="/ngo-dashboard"
                  className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-xl text-sm font-semibold transition"
                >
                  🏢 Dashboard
                </Link>
              ) : (
                <Link
                  href="/report"
                  className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-semibold transition"
                >
                  + Report Cat
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="text-gray-500 hover:text-red-500 text-sm font-medium transition"
              >
                Logout
              </button>
            </>
          ) : (
            // Not logged in
            <>
              <Link
                href="/login"
                className="text-gray-600 hover:text-orange-500 text-sm font-medium transition"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-semibold transition"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden text-2xl"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-orange-100 px-4 py-4 space-y-3">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="block text-gray-700 hover:text-orange-500 font-medium py-1 text-sm"
            >
              {link.label}
            </Link>
          ))}

          <div className="pt-3 border-t border-gray-100 space-y-2">
            {isLoading ? (
              <div className="w-full h-9 bg-gray-100 rounded-xl animate-pulse" />
            ) : user ? (
              <>
                {isNGO ? (
                  <Link
                    href="/ngo-dashboard"
                    onClick={() => setMenuOpen(false)}
                    className="block text-center bg-purple-500 text-white py-2 rounded-xl text-sm font-semibold"
                  >
                    🏢 NGO Dashboard
                  </Link>
                ) : (
                  <Link
                    href="/report"
                    onClick={() => setMenuOpen(false)}
                    className="block text-center bg-orange-500 text-white py-2 rounded-xl text-sm font-semibold"
                  >
                    + Report a Cat
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="block w-full text-center text-red-500 font-medium text-sm py-1"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className="block text-center border border-orange-300 text-orange-500 py-2 rounded-xl text-sm"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setMenuOpen(false)}
                  className="block text-center bg-orange-500 text-white py-2 rounded-xl text-sm font-semibold"
                >
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