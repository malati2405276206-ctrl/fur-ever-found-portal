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
  const [applications, setApplications] = useState([])
  const [loading,    setLoading]    = useState(true)
  const [actionMsg,  setActionMsg]  = useState('')
  const [activeTab,  setActiveTab]  = useState('listings') // 'listings' | 'applications'

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
      .eq('status', 'available')
      .order('created_at', { ascending: false })
      .limit(10)

    setRecentCats(cats || [])
    setCatCount(count || 0)

    // Fetch adoption applications for this NGO
    const { data: apps } = await supabase
      .from('adoption_applications')
      .select('*')
      .eq('ngo_id', user.id)
      .order('created_at', { ascending: false })

    setApplications(apps || [])
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

  const handleApplicationAction = async (appId, newStatus, catId) => {
    try {
      // 1. Update this application's status
      const { error: appError } = await supabase
        .from('adoption_applications')
        .update({ status: newStatus })
        .eq('id', appId)

      if (appError) {
        console.error('Error updating application:', appError.message)
        setActionMsg('❌ Failed to update application.')
        setTimeout(() => setActionMsg(''), 3000)
        return
      }

      if (newStatus === 'approved' && catId) {
        // 2. Mark the cat as adopted in adoption_cats
        const { error: catError } = await supabase
          .from('adoption_cats')
          .update({
            status: 'adopted',
            adopted_at: new Date().toISOString(),
          })
          .eq('id', catId)

        if (catError) {
          console.error('Error marking cat as adopted:', catError.message)
          setActionMsg('⚠️ Application approved but failed to mark cat as adopted.')
          setTimeout(() => setActionMsg(''), 4000)
        }

        // 3. Reject all other pending applications for the same cat
        const { error: rejectError } = await supabase
          .from('adoption_applications')
          .update({ status: 'rejected' })
          .eq('cat_id', catId)
          .eq('status', 'pending')
          .neq('id', appId)

        if (rejectError) {
          console.error('Error rejecting other applications:', rejectError.message)
        }

        // 4. Update local state — remove adopted cat from listings
        setRecentCats((prev) => prev.filter((cat) => cat.id !== catId))
        setCatCount((prev) => Math.max(0, prev - 1))

        // 5. Update applications state — mark approved one, reject others for same cat
        setApplications((prev) =>
          prev.map((app) => {
            if (app.id === appId) return { ...app, status: 'approved' }
            if (app.cat_id === catId && app.status === 'pending') return { ...app, status: 'rejected' }
            return app
          })
        )

        setActionMsg('🎉 Application approved! Cat marked as adopted and other applicants notified.')
      } else if (newStatus === 'rejected') {
        // Just update this one application in local state
        setApplications((prev) =>
          prev.map((app) => app.id === appId ? { ...app, status: 'rejected' } : app)
        )
        setActionMsg('Application rejected.')
      }

      setTimeout(() => setActionMsg(''), 4000)
    } catch (err) {
      console.error('Unexpected error in handleApplicationAction:', err)
      setActionMsg('❌ Something went wrong. Please try again.')
      setTimeout(() => setActionMsg(''), 3000)
    }
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

        {/* Tab Switcher */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('listings')}
            className="flex-1 py-2.5 rounded-full text-sm font-bold transition text-center"
            style={{
              background: activeTab === 'listings' ? '#2E4365' : 'transparent',
              color: activeTab === 'listings' ? '#F3D58D' : '#2E4365',
              border: activeTab === 'listings' ? 'none' : '1.5px solid #2E4365',
            }}
          >
            🐱 Your Listings ({catCount})
          </button>
          <button
            onClick={() => setActiveTab('applications')}
            className="flex-1 py-2.5 rounded-full text-sm font-bold transition text-center relative"
            style={{
              background: activeTab === 'applications' ? '#2E4365' : 'transparent',
              color: activeTab === 'applications' ? '#F3D58D' : '#2E4365',
              border: activeTab === 'applications' ? 'none' : '1.5px solid #2E4365',
            }}
          >
            📋 Applications ({applications.length})
            {applications.filter((a) => a.status === 'pending').length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {applications.filter((a) => a.status === 'pending').length}
              </span>
            )}
          </button>
        </div>

        {/* Listings Tab */}
        {activeTab === 'listings' && (
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
        )}

        {/* Applications Tab */}
        {activeTab === 'applications' && (
        <div className="organic-card p-5 sm:p-6" style={{ transform: 'none' }}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-base font-bold" style={{ color: '#2E4365' }}>📋 Adoption Applications</h2>
            <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ background: '#d6e3f0', color: '#2E4365' }}>
              {applications.filter((a) => a.status === 'pending').length} pending
            </span>
          </div>

          {applications.length === 0 ? (
            <div className="text-center py-10">
              <div className="text-4xl mb-3">📭</div>
              <p className="text-sm" style={{ color: '#2E4365', opacity: 0.6 }}>No applications yet.</p>
              <p className="text-xs mt-1" style={{ color: '#2E4365', opacity: 0.4 }}>
                When someone applies to adopt one of your cats, it will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {applications.map((app) => (
                <div key={app.id} className="rounded-2xl border p-4" style={{ borderColor: app.status === 'pending' ? '#F3D58D' : '#e5e7eb', background: app.status === 'pending' ? '#fffcf5' : '#ffffff' }}>
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm" style={{ color: '#2E4365' }}>{app.full_name}</p>
                      <p className="text-xs mt-0.5" style={{ color: '#2E4365', opacity: 0.6 }}>
                        For: <strong>{app.cat_name || 'Cat'}</strong>
                      </p>
                    </div>
                    <span
                      className="text-[11px] px-2.5 py-1 rounded-full font-semibold shrink-0 capitalize"
                      style={{
                        background: app.status === 'pending' ? '#FEF3C7' : app.status === 'approved' ? '#D1FAE5' : '#FEE2E2',
                        color: app.status === 'pending' ? '#92400E' : app.status === 'approved' ? '#065F46' : '#991B1B',
                      }}
                    >
                      {app.status}
                    </span>
                  </div>

                  {/* Details grid */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs mb-3" style={{ color: '#2E4365', opacity: 0.75 }}>
                    <p>📞 {app.phone || '—'}</p>
                    <p>📍 {app.city || '—'}</p>
                    <p>🏠 {app.home_type || '—'}</p>
                    <p>💼 {app.occupation || '—'}</p>
                    {app.has_pets && <p>🐾 Has other pets</p>}
                    {app.has_children && <p>👶 Has children</p>}
                  </div>

                  {/* Why adopt */}
                  {app.why_adopt && (
                    <div className="rounded-xl p-3 mb-3 text-xs leading-relaxed" style={{ background: '#f7f3eb', color: '#2E4365' }}>
                      <p className="font-semibold mb-1" style={{ opacity: 0.7 }}>Why they want to adopt:</p>
                      <p className="italic">&ldquo;{app.why_adopt}&rdquo;</p>
                    </div>
                  )}

                  {/* Experience */}
                  {app.experience && (
                    <p className="text-xs mb-3" style={{ color: '#2E4365', opacity: 0.6 }}>
                      <strong>Experience:</strong> {app.experience}
                    </p>
                  )}

                  {/* Submitted date */}
                  <p className="text-[11px] mb-3" style={{ color: '#2E4365', opacity: 0.4 }}>
                    Submitted {new Date(app.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>

                  {/* Action buttons */}
                  {app.status === 'pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApplicationAction(app.id, 'approved', app.cat_id)}
                        className="flex-1 text-xs font-bold py-2.5 rounded-full transition hover:opacity-90"
                        style={{ background: '#2E4365', color: '#F3D58D' }}
                      >
                        ✅ Approve
                      </button>
                      <button
                        onClick={() => handleApplicationAction(app.id, 'rejected', app.cat_id)}
                        className="flex-1 text-xs font-bold py-2.5 rounded-full transition hover:opacity-90 border"
                        style={{ borderColor: '#e5e7eb', color: '#991B1B' }}
                      >
                        ❌ Reject
                      </button>
                      <Link
                        href={`/messages`}
                        className="flex-1 text-xs font-bold py-2.5 rounded-full transition hover:opacity-90 text-center border"
                        style={{ borderColor: '#F3D58D', color: '#2E4365' }}
                      >
                        💬 Chat
                      </Link>
                    </div>
                  )}

                  {app.status === 'approved' && (
                    <div className="flex gap-2">
                      <Link
                        href={`/messages`}
                        className="flex-1 text-xs font-bold py-2.5 rounded-full transition hover:opacity-90 text-center"
                        style={{ background: '#F3D58D', color: '#2E4365' }}
                      >
                        💬 Message Adopter
                      </Link>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        )}

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
