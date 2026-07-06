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

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: ngo } = await supabase
      .from('ngo_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    setNgoProfile(ngo)

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
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#EBDDC5' }}>
        <div className="w-8 h-8 border-4 rounded-full animate-spin" style={{ borderColor: '#F3D58D', borderTopColor: '#2E4365' }} />
      </div>
    )
  }

  return (
    <div className="min-h-screen py-8 px-4" style={{ background: '#EBDDC5' }}>
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="heading-artistic text-2xl sm:text-3xl flex items-center gap-2" style={{ color: '#2E4365' }}>
            <img src="/icon-emoji/house.png" alt="" width={60} height={60} className="inline-block" /> NGO Dashboard
          </h1>
          <p className="text-sm mt-1" style={{ color: '#2E4365', opacity: 0.7 }}>
            Welcome, <strong>{ngoProfile?.org_name || 'Organisation'}</strong>
          </p>

          {ngoProfile && !ngoProfile.verified && (
            <div className="mt-4 rounded-xl px-4 py-3 text-sm font-medium" style={{ background: '#F3D58D', color: '#8A3B08' }}>
              ⏳ Your organisation is <strong>pending verification</strong>. Some features are limited until admin approves.
            </div>
          )}

          {actionMsg && (
            <div className="mt-4 organic-card px-4 py-3 text-sm font-medium" style={{ color: '#2E4365', transform: 'none' }}>
              {actionMsg}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="organic-card p-5 text-center" style={{ transform: 'none' }}>
            <div className="text-3xl font-extrabold" style={{ color: '#2E4365' }}>{catCount}</div>
            <div className="text-xs mt-1" style={{ color: '#2E4365', opacity: 0.6 }}>Cats Listed</div>
          </div>
          <div className="organic-card p-5 text-center" style={{ transform: 'none' }}>
            <div className="text-lg font-bold" style={{ color: '#2E4365' }}>{ngoProfile?.city || '—'}</div>
            <div className="text-xs mt-1" style={{ color: '#2E4365', opacity: 0.6 }}>Operating City</div>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <Link
            href="/ngo-dashboard/add-cat"
            className="rounded-full py-3 text-center text-sm font-bold transition hover:opacity-90"
            style={{ background: '#2E4365', color: '#F3D58D' }}
          >
            + Add Cat
          </Link>
          <Link
            href="/adoption"
            className="rounded-full py-3 text-center text-sm font-bold transition hover:opacity-90 flex items-center justify-center gap-1"
            style={{ background: '#F3D58D', color: '#2E4365' }}
          >
            <img src="/icon-emoji/house.png" alt="" width={30} height={30} className="inline-block" /> Adoption Feed
          </Link>
        </div>

        {/* Recent Listings */}
        <div className="organic-card p-5 sm:p-6" style={{ transform: 'none' }}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-base font-bold" style={{ color: '#2E4365' }}>Your Listings</h2>
            <Link href="/ngo-dashboard/add-cat" className="text-xs font-semibold" style={{ color: '#E59D2C' }}>
              + Add New
            </Link>
          </div>

          {recentCats.length === 0 ? (
            <div className="text-center py-10">
              <div className="mb-3"><img src="/icon-emoji/cat-paw.png" alt="" width={60} height={60} className="inline-block" /></div>
              <p className="text-sm" style={{ color: '#2E4365', opacity: 0.6 }}>No cats listed yet.</p>
              <Link href="/ngo-dashboard/add-cat" className="mt-3 inline-block text-sm font-semibold" style={{ color: '#E59D2C' }}>
                Add your first cat →
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {recentCats.map((cat) => (
                <div key={cat.id} className="flex items-center gap-3 p-3 rounded-xl transition hover:bg-white/50">

                  {cat.image_url ? (
                    <img src={cat.image_url} alt={cat.name} className="w-11 h-11 rounded-xl object-cover shrink-0" />
                  ) : (
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#F3D58D' }}><img src="/icon-emoji/cat-face.png" alt="" width={60} height={60} /></div>
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate" style={{ color: '#2E4365' }}>{cat.name}</p>
                    <p className="text-xs" style={{ color: '#2E4365', opacity: 0.5 }}>{cat.city}</p>
                  </div>

                  <span
                    className="text-xs px-2.5 py-1 rounded-full font-medium shrink-0"
                    style={{
                      background: cat.status === 'available' ? '#d6e3f0' : cat.status === 'adopted' ? '#F3D58D' : '#f0f0f0',
                      color: cat.status === 'available' ? '#2E4365' : cat.status === 'adopted' ? '#8A3B08' : '#666',
                    }}
                  >
                    {cat.status}
                  </span>

                  {cat.status === 'available' && (
                    <button
                      onClick={() => handleMarkAdopted(cat.id)}
                      className="shrink-0 text-xs font-bold px-3 py-1.5 rounded-full transition hover:opacity-80 flex items-center gap-1"
                      style={{ background: '#2E4365', color: '#F3D58D' }}
                    >
                       Adopted
                    </button>
                  )}

                  {cat.status === 'adopted' && (
                    <span className="shrink-0 text-xs font-medium" style={{ color: '#E59D2C' }}>
                       <img src="/icon-emoji/sparkle.png" alt="" width={20} height={20} className="inline-block" /> Story live
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
