// src/components/Navbar.js
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Home, Search, Heart, MapPin, BookOpen, Bell, User, LogOut, Menu, X, Building2, PlusCircle, MessageCircle } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useRole } from '@/hooks/useRole'
import { logout } from '@/lib/auth'
import NotificationBell from '@/components/NotificationBell'

export default function Navbar() {
  const { user, loading: authLoading } = useAuth()
  const { isNGO, loading: roleLoading } = useRole()
  const router = useRouter()
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  const isLoading = authLoading || roleLoading

  // Add shadow once user scrolls past 10px
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleLogout = async () => {
    await logout()
    router.push('/')
    router.refresh()
    setMenuOpen(false)
  }

  // Primary text links
  const primaryLinks = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/lost-cats', label: 'Lost', icon: Search },
    { href: '/found-cats', label: 'Found', icon: Heart },
    { href: '/adoption', label: 'Adoption', icon: Building2 },
  ]

  // Secondary icon-only links
  const secondaryLinks = [
    { href: '/map', label: 'Map', icon: MapPin },
    { href: '/stories', label: 'Stories', icon: BookOpen },
  ]

  const isActive = (href) => pathname === href

  return (
    <nav
      className={`sticky top-0 z-50 backdrop-blur-md border-b transition-shadow duration-300 ${scrolled ? 'shadow-md' : 'shadow-none'}`}
      style={{
        background: 'rgba(253, 252, 247, 0.92)',
        borderColor: 'var(--sage-200)',
      }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="text-xl sm:text-2xl">🐾</span>
          <span className="text-base sm:text-lg font-bold whitespace-nowrap" style={{ color: 'var(--sage-800)' }}>
            Fur Ever <span style={{ color: 'var(--sage-500)' }}>Found</span>
          </span>
        </Link>

        {/* Primary nav links — desktop only */}
        <div className="hidden lg:flex items-center gap-1 relative">
          {primaryLinks.map((link) => {
            const Icon = link.icon
            const active = isActive(link.href)
            return (
              <Link key={link.href} href={link.href} className="relative px-3 py-2 text-sm font-medium transition flex items-center gap-1.5">
                <span className={`flex items-center gap-1.5 transition-colors`} style={{ color: active ? 'var(--sage-600)' : 'var(--sage-700)' }}>
                  <Icon size={15} strokeWidth={2.2} />
                  {link.label}
                </span>
                {active && (
                  <motion.div
                    layoutId="navbar-active-underline"
                    className="absolute left-2 right-2 -bottom-0.5 h-0.5 rounded-full"
                    style={{ background: 'var(--sage-500)' }}
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </Link>
            )
          })}

          {/* Divider */}
          <div className="w-px h-5 mx-2" style={{ background: 'var(--sage-200)' }} />

          {/* Secondary icon-only links */}
          {secondaryLinks.map((link) => {
            const Icon = link.icon
            const active = isActive(link.href)
            return (
              <Link
                key={link.href}
                href={link.href}
                title={link.label}
                className="p-2 rounded-lg transition"
                style={{
                  color: active ? 'var(--sage-600)' : 'var(--sage-400)',
                  background: active ? 'var(--sage-100)' : 'transparent',
                }}
              >
                <Icon size={17} strokeWidth={2.2} />
              </Link>
            )
          })}
        </div>

        {/* Right side: auth */}
        <div className="hidden lg:flex items-center gap-2 xl:gap-3 shrink-0">
          {isLoading ? (
            <div className="w-24 h-9 rounded-xl animate-pulse" style={{ background: 'var(--sage-100)' }} />
          ) : user ? (
            <>
              <NotificationBell userId={user.id} />

              <Link href="/messages" title="Messages" className="p-2 rounded-lg transition hover:opacity-80" style={{ color: 'var(--sage-500)' }}>
                <MessageCircle size={17} strokeWidth={2.2} />
              </Link>

              <div className="w-px h-5" style={{ background: 'var(--sage-200)' }} />

              {isNGO ? (
                <Link
                  href="/ngo-dashboard"
                  className="px-3 xl:px-4 py-2 rounded-full text-sm font-semibold transition flex items-center gap-1.5 whitespace-nowrap text-white hover:opacity-90"
                  style={{ background: 'var(--sage-600)' }}
                >
                  <Building2 size={15} /> Dashboard
                </Link>
              ) : (
                <Link
                  href="/report"
                  className="px-3 xl:px-4 py-2 rounded-full text-sm font-semibold transition flex items-center gap-1.5 whitespace-nowrap text-white hover:opacity-90"
                  style={{ background: 'var(--sage-500)' }}
                >
                  <PlusCircle size={15} /> Report
                </Link>
              )}

              <Link href="/profile" title="Profile" className="p-2 rounded-lg transition hover:opacity-80" style={{ color: 'var(--sage-500)' }}>
                <User size={17} strokeWidth={2.2} />
              </Link>

              <button onClick={handleLogout} title="Logout" className="p-2 rounded-lg transition text-red-400 hover:text-red-500 hover:bg-red-50">
                <LogOut size={17} strokeWidth={2.2} />
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm font-medium transition px-2 hover:opacity-80" style={{ color: 'var(--sage-700)' }}>
                Login
              </Link>
              <Link
                href="/signup"
                className="px-4 py-2 rounded-full text-sm font-semibold transition text-white hover:opacity-90"
                style={{ background: 'var(--sage-500)' }}
              >
                Sign Up
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button className="lg:hidden p-2 transition hover:opacity-80" style={{ color: 'var(--sage-700)' }} onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile dropdown */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden border-t overflow-hidden"
            style={{ background: 'var(--cream)', borderColor: 'var(--sage-200)' }}
          >
            <div className="px-4 sm:px-6 py-4 space-y-1">
              {[...primaryLinks, ...secondaryLinks].map((link) => {
                const Icon = link.icon
                const active = isActive(link.href)
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 font-medium py-2.5 px-3 rounded-xl text-sm transition"
                    style={{
                      background: active ? 'var(--sage-100)' : 'transparent',
                      color: active ? 'var(--sage-600)' : 'var(--sage-700)',
                    }}
                  >
                    <Icon size={16} strokeWidth={2.2} /> {link.label}
                  </Link>
                )
              })}

              <div className="pt-3 mt-3 border-t space-y-2" style={{ borderColor: 'var(--sage-200)' }}>
                {isLoading ? (
                  <div className="w-full h-10 rounded-xl animate-pulse" style={{ background: 'var(--sage-100)' }} />
                ) : user ? (
                  <>
                    {isNGO ? (
                      <Link href="/ngo-dashboard" onClick={() => setMenuOpen(false)} className="flex items-center justify-center gap-2 text-white py-2.5 rounded-full text-sm font-semibold transition" style={{ background: 'var(--sage-600)' }}>
                        <Building2 size={15} /> NGO Dashboard
                      </Link>
                    ) : (
                      <Link href="/report" onClick={() => setMenuOpen(false)} className="flex items-center justify-center gap-2 text-white py-2.5 rounded-full text-sm font-semibold transition" style={{ background: 'var(--sage-500)' }}>
                        <PlusCircle size={15} /> Report a Cat
                      </Link>
                    )}
                    <Link href="/profile" onClick={() => setMenuOpen(false)} className="flex items-center justify-center gap-2 border py-2.5 rounded-full text-sm font-medium transition" style={{ borderColor: 'var(--sage-200)', color: 'var(--sage-700)' }}>
                      <User size={15} /> My Profile
                    </Link>
                    <Link href="/notifications" onClick={() => setMenuOpen(false)} className="flex items-center justify-center gap-2 border py-2.5 rounded-full text-sm font-medium transition" style={{ borderColor: 'var(--sage-200)', color: 'var(--sage-700)' }}>
                      <Bell size={15} /> Notifications
                    </Link>
                    <Link href="/messages" onClick={() => setMenuOpen(false)} className="flex items-center justify-center gap-2 border py-2.5 rounded-full text-sm font-medium transition" style={{ borderColor: 'var(--sage-200)', color: 'var(--sage-700)' }}>
                      <MessageCircle size={15} /> Messages
                    </Link>
                    <button onClick={handleLogout} className="flex items-center justify-center gap-2 w-full text-red-500 hover:bg-red-50 font-medium text-sm py-2.5 rounded-full transition">
                      <LogOut size={15} /> Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link href="/login" onClick={() => setMenuOpen(false)} className="block text-center border py-2.5 rounded-full text-sm font-medium transition" style={{ borderColor: 'var(--sage-300)', color: 'var(--sage-600)' }}>
                      Login
                    </Link>
                    <Link href="/signup" onClick={() => setMenuOpen(false)} className="block text-center text-white py-2.5 rounded-full text-sm font-semibold transition" style={{ background: 'var(--sage-500)' }}>
                      Sign Up
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}
