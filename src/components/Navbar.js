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
import AuthToggle from '@/components/AuthToggle'

export default function Navbar() {
  const { user, loading: authLoading } = useAuth()
  const { isNGO, loading: roleLoading } = useRole()
  const router = useRouter()
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState(null)

  const isLoading = authLoading || roleLoading

  // Add shadow once user scrolls past 10px
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Fetch user avatar
  useEffect(() => {
    if (!user) { setAvatarUrl(null); return }
    const fetchAvatar = async () => {
      const { supabase } = await import('@/lib/supabase')
      const { data } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', user.id)
        .maybeSingle()
      if (data?.avatar_url) setAvatarUrl(data.avatar_url)
    }
    fetchAvatar()
  }, [user])

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
        background: '#2E4365',
        borderColor: '#2E4365',
      }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0 group">
          <motion.img
            src="/icon-emoji/cat-paw.png"
            alt="paw"
            width={50}
            height={50}
            className="inline-block"
            whileHover={{ rotate: 15, scale: 1.1 }}
            transition={{ type: 'spring', stiffness: 300 }}
          />
          <span className="text-base sm:text-lg font-bold whitespace-nowrap transition-opacity duration-200 group-hover:opacity-80" style={{ color: '#F3D58D' }}>
            Fur Ever <span style={{ color: '#F3D58D' }}>Found</span>
          </span>
        </Link>

        {/* Primary nav links — desktop only */}
        <div className="hidden lg:flex items-center gap-1 relative">
          {primaryLinks.map((link) => {
            const Icon = link.icon
            const active = isActive(link.href)
            return (
              <Link key={link.href} href={link.href} className="relative px-3 py-2 text-sm font-medium flex items-center gap-1.5 group">
                <motion.span
                  className="flex items-center gap-1.5 px-2 py-1 rounded-lg transition-colors duration-200"
                  style={{
                    color: '#F3D58D',
                    background: active ? 'rgba(243, 213, 141, 0.15)' : 'transparent',
                  }}
                  whileHover={{ scale: 1.08, background: 'rgba(243, 213, 141, 0.15)' }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Icon size={15} strokeWidth={2.2} />
                  {link.label}
                </motion.span>
                {active && (
                  <motion.div
                    layoutId="navbar-active-underline"
                    className="absolute left-2 right-2 -bottom-0.5 h-0.5 rounded-full"
                    style={{ background: '#F3D58D' }}
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </Link>
            )
          })}

          {/* Divider */}
          <div className="w-px h-5 mx-2" style={{ background: 'rgba(243, 213, 141, 0.3)' }} />

          {/* Secondary icon-only links */}
          {secondaryLinks.map((link) => {
            const Icon = link.icon
            const active = isActive(link.href)
            return (
              <motion.div
                key={link.href}
                whileHover={{ scale: 1.15, rotate: 5 }}
                whileTap={{ scale: 0.9 }}
              >
                <Link
                  href={link.href}
                  title={link.label}
                  className="p-2 rounded-lg block transition-colors duration-200"
                  style={{
                    color: '#F3D58D',
                    background: active ? 'rgba(243, 213, 141, 0.15)' : 'transparent',
                  }}
                >
                  <Icon size={17} strokeWidth={2.2} />
                </Link>
              </motion.div>
            )
          })}
        </div>

        {/* Right side: auth */}
        <div className="hidden lg:flex items-center gap-2 xl:gap-3 shrink-0">
          {isLoading ? (
            <div className="w-24 h-9 rounded-xl animate-pulse" style={{ background: 'rgba(243, 213, 141, 0.2)' }} />
          ) : user ? (
            <>
              <NotificationBell userId={user.id} />

              <motion.div whileHover={{ scale: 1.15, rotate: -5 }} whileTap={{ scale: 0.9 }}>
                <Link href="/messages" title="Messages" className="p-2 rounded-lg block transition-colors duration-200 hover:bg-[rgba(243,213,141,0.15)]" style={{ color: '#F3D58D' }}>
                  <MessageCircle size={17} strokeWidth={2.2} />
                </Link>
              </motion.div>

              <div className="w-px h-5" style={{ background: 'rgba(243, 213, 141, 0.3)' }} />

              {isNGO ? (
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link
                    href="/ngo-dashboard"
                    className="px-3 xl:px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-1.5 whitespace-nowrap transition-shadow duration-200 hover:shadow-lg hover:shadow-[rgba(243,213,141,0.3)]"
                    style={{ background: '#F3D58D', color: '#2E4365' }}
                  >
                    <Building2 size={15} /> Dashboard
                  </Link>
                </motion.div>
              ) : (
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link
                    href="/report"
                    className="px-3 xl:px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-1.5 whitespace-nowrap transition-shadow duration-200 hover:shadow-lg hover:shadow-[rgba(243,213,141,0.3)]"
                    style={{ background: '#F3D58D', color: '#2E4365' }}
                  >
                    <PlusCircle size={15} /> Report
                  </Link>
                </motion.div>
              )}

              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Link href="/profile" title="Profile" className="p-1.5 rounded-full block transition-colors duration-200 hover:bg-[rgba(243,213,141,0.15)] overflow-hidden" style={{ color: '#F3D58D' }}>
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Profile" className="w-8 h-8 rounded-full object-cover border-2" style={{ borderColor: '#F3D58D' }} />
                  ) : (
                    <User size={17} strokeWidth={2.2} />
                  )}
                </Link>
              </motion.div>

              <motion.button
                onClick={handleLogout}
                title="Logout"
                className="p-2 rounded-lg transition-colors duration-200 text-red-400 hover:text-red-500 hover:bg-red-50/10"
                whileHover={{ scale: 1.1, rotate: -10 }}
                whileTap={{ scale: 0.9 }}
              >
                <LogOut size={17} strokeWidth={2.2} />
              </motion.button>
            </>
          ) : (
            <AuthToggle />
          )}
        </div>

        {/* Mobile hamburger */}
        <button className="lg:hidden p-2 transition hover:opacity-80" style={{ color: '#F3D58D' }} onClick={() => setMenuOpen(!menuOpen)}>
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
            style={{ background: '#2E4365', borderColor: 'rgba(243, 213, 141, 0.2)' }}
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
                      background: active ? 'rgba(243, 213, 141, 0.15)' : 'transparent',
                      color: active ? '#F3D58D' : '#F3D58D',
                    }}
                  >
                    <Icon size={16} strokeWidth={2.2} /> {link.label}
                  </Link>
                )
              })}

              <div className="pt-3 mt-3 border-t space-y-2" style={{ borderColor: 'rgba(243, 213, 141, 0.2)' }}>
                {isLoading ? (
                  <div className="w-full h-10 rounded-xl animate-pulse" style={{ background: 'rgba(243, 213, 141, 0.2)' }} />
                ) : user ? (
                  <>
                    {isNGO ? (
                      <Link href="/ngo-dashboard" onClick={() => setMenuOpen(false)} className="flex items-center justify-center gap-2 text-white py-2.5 rounded-full text-sm font-semibold transition" style={{ background: '#F3D58D', color: '#2E4365' }}>
                        <Building2 size={15} /> NGO Dashboard
                      </Link>
                    ) : (
                      <Link href="/report" onClick={() => setMenuOpen(false)} className="flex items-center justify-center gap-2 text-white py-2.5 rounded-full text-sm font-semibold transition" style={{ background: '#F3D58D', color: '#2E4365' }}>
                        <PlusCircle size={15} /> Report a Cat
                      </Link>
                    )}
                    <Link href="/profile" onClick={() => setMenuOpen(false)} className="flex items-center justify-center gap-2 border py-2.5 rounded-full text-sm font-medium transition" style={{ borderColor: 'rgba(243, 213, 141, 0.3)', color: '#F3D58D' }}>
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="Profile" className="w-5 h-5 rounded-full object-cover" />
                      ) : (
                        <User size={15} />
                      )}
                      My Profile
                    </Link>
                    <Link href="/notifications" onClick={() => setMenuOpen(false)} className="flex items-center justify-center gap-2 border py-2.5 rounded-full text-sm font-medium transition" style={{ borderColor: 'rgba(243, 213, 141, 0.3)', color: '#F3D58D' }}>
                      <Bell size={15} /> Notifications
                    </Link>
                    <Link href="/messages" onClick={() => setMenuOpen(false)} className="flex items-center justify-center gap-2 border py-2.5 rounded-full text-sm font-medium transition" style={{ borderColor: 'rgba(243, 213, 141, 0.3)', color: '#F3D58D' }}>
                      <MessageCircle size={15} /> Messages
                    </Link>
                    <button onClick={handleLogout} className="flex items-center justify-center gap-2 w-full text-red-500 hover:bg-red-50 font-medium text-sm py-2.5 rounded-full transition">
                      <LogOut size={15} /> Logout
                    </button>
                  </>
                ) : (
                  <div className="flex justify-center">
                    <AuthToggle />
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}
