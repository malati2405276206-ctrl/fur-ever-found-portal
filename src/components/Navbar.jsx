'use client'

import Link from 'next/link'

export default function Navbar() {
  return (
    <nav className="flex items-center justify-between p-4 border-b">
      <h1 className="text-2xl font-bold text-orange-500">
        PawFinder
      </h1>

      <div className="flex gap-4">
        <Link href="/">Home</Link>
        <Link href="/lost-cats">Lost Cats</Link>
        <Link href="/found-cats">Found Cats</Link>
        <Link href="/login">Login</Link>
      </div>
    </nav>
  )
}