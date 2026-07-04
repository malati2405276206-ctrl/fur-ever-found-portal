// src/app/ngo-dashboard/page.js
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useRole } from '@/hooks/useRole'
import ProtectedRoute from '@/components/ProtectedRoute'

function DashboardContent() {
  const [ngoProfile, setNgoProfile] = useState(null)
  const [catCount,   setCatCount]   = useState(0)
  const [recentCats, setRecentCats] = useState([])
  const [loading,    setLoading]    = useState(true)
  const [actionMsg,  setActionMsg]  = useState('')

  // ── Fetch all dashboard data ──────────────────────────
  // Defined at component level so all functions can call it
  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // NGO profile
    const { data: ngo } = await supabase
      .from('ngo_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    setNgoProfile(ngo)

    // Adoption cats
    const { data: cats, count } = await supabase
      .from('adoption_cats')
      .select('*', { count: 'exact' })
      .eq('ngo_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)

    setRecentCats(cats || [])
    setCatCount(count || 0)
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  // ── Mark as Adopted ───────────────────────────────────
  // Defined at component level — accessible by the button onClick
  const handleMarkAdopted = async (catId) => {
    const { error } = await supabase
      .from('adoption_cats')
      .update({
        status:     'adopted',
        adopted_at: new Date().toISOString(),
      })
      .eq('id', catId)

    if (error) {
      console.error('Error marking as adopted:', error.message)
      setActionMsg('❌ Failed to update. Check console.')
      setTimeout(() => setActionMsg(''), 3000)
      return
    }

    // Update local state instantly — no refetch needed
    setRecentCats((prev) =>
      prev.map((cat) =>
        cat.id === catId
          ? { ...cat, status: 'adopted', adopted_at: new Date().toISOString() }
          : cat
      )
    )

    setActionMsg('🎉 Cat marked as adopted! Story will appear on the Stories page.')
    setTimeout(() => setActionMsg(''), 4000)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-10 px-4">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">🏢 NGO Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">
            Welcome, <strong>{ngoProfile?.org_name || 'Organisation'}</strong>
          </p>

          {ngoProfile && !ngoProfile.verified && (
            <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700">
              ⏳ Your organisation is <strong>pending verification</strong>. Some features are limited until admin approves your account.
            </div>
          )}

          {/* Action message toast */}
          {actionMsg && (
            <div className="mt-4 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700">
              {actionMsg}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="text-3xl mb-1">🐱</div>
            <div className="text-3xl font-extrabold text-gray-900">{catCount}</div>
            <div className="text-gray-500 text-sm">Cats Listed for Adoption</div>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="text-3xl mb-1">📍</div>
            <div className="text-lg font-semibold text-gray-700">{ngoProfile?.city || '—'}</div>
            <div className="text-gray-500 text-sm">Operating City</div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 sm:mb-8">
          <Link
            href="/ngo-dashboard/add-cat"
            className="bg-purple-500 hover:bg-purple-600 text-white rounded-2xl p-5 text-center font-semibold transition min-h-[80px] flex flex-col items-center justify-center"
          >
            <div className="text-2xl mb-1">➕</div>
            Add Adoption Cat
          </Link>
          <Link
            href="/adoption"
            className="bg-amber-500 hover:bg-amber-600 text-white rounded-2xl p-5 text-center font-semibold transition min-h-[80px] flex flex-col items-center justify-center"
          >
            <div className="text-2xl mb-1">🏠</div>
            View Adoption Feed
          </Link>
        </div>

        {/* Recent listings */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-lg font-bold text-gray-800">Your Recent Listings</h2>
            <Link href="/ngo-dashboard/add-cat" className="text-sm text-purple-500 hover:underline font-medium">
              + Add New
            </Link>
          </div>

          {recentCats.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <div className="text-4xl mb-3">🐾</div>
              <p className="text-sm">No cats listed yet.</p>
              <Link href="/ngo-dashboard/add-cat" className="mt-3 inline-block text-purple-500 font-medium text-sm hover:underline">
                Add your first cat →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentCats.map((cat) => (
                <div key={cat.id} className="flex items-center gap-3 sm:gap-4 p-3 rounded-xl hover:bg-gray-50 transition">

                  {/* Cat image */}
                  {cat.image_url ? (
                    <img src={cat.image_url} alt={cat.name} className="w-12 h-12 rounded-xl object-cover shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center text-xl shrink-0">🐱</div>
                  )}

                  {/* Cat info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 text-sm truncate">{cat.name}</p>
                    <p className="text-gray-400 text-xs">{cat.city}</p>
                  </div>

                  {/* Status badge */}
                  <span className={`text-xs px-2 sm:px-3 py-1 rounded-full font-medium shrink-0 ${
                    cat.status === 'available'
                      ? 'bg-green-100 text-green-600'
                      : cat.status === 'adopted'
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-gray-100 text-gray-500'
                  }`}>
                    {cat.status}
                  </span>

                  {/* Mark as Adopted button — only for available cats */}
                  {cat.status === 'available' && (
                    <button
                      onClick={() => handleMarkAdopted(cat.id)}
                      className="shrink-0 text-xs bg-purple-500 hover:bg-purple-600 active:bg-purple-700 text-white px-2 sm:px-3 py-1.5 rounded-lg transition font-medium"
                    >
                      🎉 Adopted
                    </button>
                  )}

                  {/* Adopted confirmation */}
                  {cat.status === 'adopted' && (
                    <span className="shrink-0 text-xs text-blue-500 font-medium">
                      ✅ Story live
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

export default function NGODashboardPage() {
  return (
    <ProtectedRoute requiredRole="ngo">
      <DashboardContent />
    </ProtectedRoute>
  )
}