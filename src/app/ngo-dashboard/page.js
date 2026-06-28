// src/app/ngo-dashboard/page.js
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useRole } from '@/hooks/useRole'
import ProtectedRoute from '@/components/ProtectedRoute'

function DashboardContent() {
  const [ngoProfile,  setNgoProfile]  = useState(null)
  const [catCount,    setCatCount]    = useState(0)
  const [recentCats,  setRecentCats]  = useState([])
  const [loading,     setLoading]     = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // NGO profile info
      const { data: ngo } = await supabase
        .from('ngo_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      setNgoProfile(ngo)

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
          return
        }

        // Update local state instantly
        setRecentCats((prev) =>
          prev.map((cat) =>
            cat.id === catId
              ? { ...cat, status: 'adopted', adopted_at: new Date().toISOString() }
              : cat
          )
        )
      }

      // Their adoption cat listings
      const { data: cats, count } = await supabase
        .from('adoption_cats')
        .select('*', { count: 'exact' })
        .eq('ngo_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5)

      setRecentCats(cats || [])
      setCatCount(count || 0)
      setLoading(false)
    }

    load()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">🏢 NGO Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">
            Welcome, <strong>{ngoProfile?.org_name || 'Organisation'}</strong>
          </p>

          {/* Pending verification banner */}
          {ngoProfile && !ngoProfile.verified && (
            <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700">
              ⏳ Your organisation is <strong>pending verification</strong>.
              Some features are limited until admin approves your account.
            </div>
          )}
        </div>

        {/* Stat card */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="text-3xl mb-1">🐱</div>
            <div className="text-3xl font-extrabold text-gray-900">{catCount}</div>
            <div className="text-gray-500 text-sm">Cats Listed for Adoption</div>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between">
            <div className="text-3xl mb-1">📍</div>
            <div className="text-lg font-semibold text-gray-700">
              {ngoProfile?.city || '—'}
            </div>
            <div className="text-gray-500 text-sm">Operating City</div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <Link
            href="/ngo-dashboard/add-cat"
            className="bg-purple-500 hover:bg-purple-600 text-white rounded-2xl p-5 text-center font-semibold transition"
          >
            <div className="text-2xl mb-1">➕</div>
            Add Adoption Cat
          </Link>
          <Link
            href="/adoption"
            className="bg-orange-500 hover:bg-orange-600 text-white rounded-2xl p-5 text-center font-semibold transition"
          >
            <div className="text-2xl mb-1">🏠</div>
            View Adoption Feed
          </Link>
        </div>

        {/* Recent listings */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-lg font-bold text-gray-800">Your Recent Listings</h2>
            <Link
              href="/ngo-dashboard/add-cat"
              className="text-sm text-purple-500 hover:underline font-medium"
            >
              + Add New
            </Link>
          </div>

          {recentCats.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <div className="text-4xl mb-3">🐾</div>
              <p className="text-sm">No cats listed yet.</p>
              <Link
                href="/ngo-dashboard/add-cat"
                className="mt-3 inline-block text-purple-500 font-medium text-sm hover:underline"
              >
                Add your first cat →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              // Replace the cat row inside recentCats.map() with this:
              {recentCats.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition"
                >
                  {cat.image_url ? (
                    <img src={cat.image_url} alt={cat.name}
                      className="w-12 h-12 rounded-xl object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center text-xl">
                      🐱
                    </div>
                  )}

                  <div className="flex-1">
                    <p className="font-semibold text-gray-800 text-sm">{cat.name}</p>
                    <p className="text-gray-400 text-xs">{cat.city}</p>
                  </div>

                  {/* Status badge */}
                  <span className={
                    cat.status === 'available'
                      ? 'text-xs px-3 py-1 rounded-full font-medium bg-green-100 text-green-600'
                      : cat.status === 'adopted'
                      ? 'text-xs px-3 py-1 rounded-full font-medium bg-blue-100 text-blue-600'
                      : 'text-xs px-3 py-1 rounded-full font-medium bg-gray-100 text-gray-500'
                  }>
                    {cat.status}
                  </span>

                  {/* Mark as Adopted button */}
                  {cat.status === 'available' && (
                    <button
                      onClick={() => handleMarkAdopted(cat.id)}
                      className="text-xs bg-purple-500 hover:bg-purple-600 text-white px-3 py-1.5 rounded-lg transition font-medium"
                    >
                      🎉 Adopted
                    </button>
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