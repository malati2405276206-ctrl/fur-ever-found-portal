// src/components/NavbarWrapper.js
// Conditionally renders Navbar — hides it on /admin
'use client'

import { usePathname } from 'next/navigation'
import Navbar from '@/components/Navbar'

export default function NavbarWrapper() {
  const pathname = usePathname()

  // Don't show navbar on admin pages
  if (pathname?.startsWith('/admin')) return null

  return <Navbar />
}