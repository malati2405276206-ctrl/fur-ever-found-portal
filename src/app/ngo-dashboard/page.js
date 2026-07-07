// src/app/ngo-dashboard/page.js
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import ProtectedRoute from '@/components/ProtectedRoute'
import { Trash2 } from 'lucide-react'

function DashboardContent() {
  const [ngoProfile, setNgoProfile] = useState(null)
  const [catCount,   setCatCount]   = useState(0)
  const [recentCats, setRecentCats] = useState([])
  const [applications, setApplications] = useState([])
  const [loading,    setLoading]    = useState(true)
  const [actionMsg,  setActionMsg]  = useState('')
  const [activeTab,  setActiveTab]  = useState('listings') // 'listings' | 'applications'
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [deleting, setDeleting] = useState(false)

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

  // Real-time subscription: auto-hide verification banner when admin approves
  useEffect(() => {
    if (!ngoProfile?.user_id) return

    const channel = supabase
      .channel(`ngo_verification_${ngoProfile.user_id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'ngo_profiles',
          filter: `user_id=eq.${ngoProfile.user_id}`,
        },
        (payload) => {
          // Update local ngoProfile when admin changes verified status
          setNgoProfile((prev) => ({ ...prev, ...payload.new }))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [ngoProfile?.user_id])

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

  const handleDeleteListing = async (catId, catName) => {
    setDeleting(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setDeleting(false); return }

    // Try direct delete first
    const { data: deletedRows, error } = await supabase
      .from('adoption_cats')
      .delete()
      .eq('id', catId)
      .eq('ngo_id', user.id)
      .select()

    if (error) {
      console.error('Error deleting listing:', error.message)
      // If delete is blocked by RLS, fall back to marking as deleted
      const { error: updateError } = await supabase
        .from('adoption_cats')
        .update({ status: 'deleted' })
        .eq('id', catId)
        .eq('ngo_id', user.id)

      if (updateError) {
        setActionMsg('❌ Failed to delete. Please try again.')
        setTimeout(() => setActionMsg(''), 3000)
        setDeleting(false)
        setDeleteConfirm(null)
        return
      }
    }

    // If delete returned 0 rows (RLS silently blocked), try update fallback
    if (!error && (!deletedRows || deletedRows.length === 0)) {
      const { error: updateError } = await supabase
        .from('adoption_cats')
        .update({ status: 'deleted' })
        .eq('id', catId)
        .eq('ngo_id', user.id)

      if (updateError) {
        setActionMsg('❌ Failed to delete. Please try again.')
        setTimeout(() => setActionMsg(''), 3000)
        setDeleting(false)
        setDeleteConfirm(null)
        return
      }
    }

    setRecentCats((prev) => prev.filter((cat) => cat.id !== catId))
    setCatCount((prev) => Math.max(0, prev - 1))
    setDeleteConfirm(null)
    setDeleting(false)
    setActionMsg(`"${catName}" listing deleted.`)
    setTimeout(() => setActionMsg(''), 3000)
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

        // 5. Remove all applications for this cat from the UI (cat is now adopted)
        setApplications((prev) => prev.filter((app) => app.cat_id !== catId))

        setActionMsg('🎉 Application approved! Cat marked as adopted and other applicants notified.')
      } else if (newStatus === 'rejected') {
        // Remove rejected application from UI
        setApplications((prev) => prev.filter((app) => app.id !== appId))
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
      <div className="min-h-screen flex flex-col items-center justify-center gap-3" style={{ background: '#EBDDC5' }}>
        <img src="/icon-emoji/cat-paw.png" alt="" width={48} height={48} className="animate-float" />
        <div className="w-8 h-8 border-4 rounded-full animate-spin" style={{ borderColor: '#F3D58D', borderTopColor: '#2E4365' }} />
        <p className="text-sm font-medium" style={{ color: '#2E4365', opacity: 0.6 }}>Loading dashboard...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-6 px-4 sm:py-10 sm:px-6" style={{ background: '#EBDDC5' }}>
      <div className="max-w-6xl mx-auto">

        {/* Header Section */}
        <div className="organic-card p-6 sm:p-8 mb-6" style={{ transform: 'none', background: 'linear-gradient(135deg, #2E4365 0%, #3a5278 100%)' }}>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center shrink-0" style={{ background: 'rgba(243, 213, 141, 0.15)' }}>
              <img src="/icon-emoji/house.png" alt="" width={44} height={44} />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="heading-artistic text-xl sm:text-2xl truncate" style={{ color: '#F3D58D' }}>
                {ngoProfile?.org_name || 'Organisation'}
              </h1>
              <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.6)' }}>
                NGO Dashboard
              </p>
            </div>
          </div>

          {ngoProfile && !ngoProfile.verified && (
            <div className="mt-4 rounded-xl px-4 py-3 text-sm font-medium flex items-center gap-2" style={{ background: 'rgba(243, 213, 141, 0.15)', color: '#F3D58D' }}>
              <span className="text-lg">⏳</span>
              <span>Your organisation is <strong>pending verification</strong>. Some features are limited until admin approves.</span>
            </div>
          )}
        </div>

        {/* Action Message Toast */}
        {actionMsg && (
          <div className="mb-4 organic-card px-5 py-3.5 text-sm font-medium animate-slide-up flex items-center gap-2" style={{ color: '#2E4365', transform: 'none', borderLeft: '4px solid #E59D2C' }}>
            {actionMsg}
          </div>
        )}

        {/* Two-column layout: Stats sidebar left, main content right */}
        <div className="flex flex-col lg:flex-row gap-5 lg:gap-6">

          {/* Left sidebar — stats stacked vertically */}
          <div className="flex flex-row lg:flex-col gap-3 lg:w-52 shrink-0">
            <div className="organic-card p-5 text-center flex-1 lg:flex-none" style={{ transform: 'none' }}>
              <div className="text-2xl sm:text-3xl font-extrabold" style={{ color: '#2E4365' }}>{catCount}</div>
              <div className="text-[11px] sm:text-xs mt-1 font-medium" style={{ color: '#2E4365', opacity: 0.5 }}>Cats Listed</div>
            </div>
            <div className="organic-card p-5 text-center flex-1 lg:flex-none" style={{ transform: 'none' }}>
              <div className="text-2xl sm:text-3xl font-extrabold" style={{ color: '#E59D2C' }}>
                {applications.filter((a) => a.status === 'pending').length}
              </div>
              <div className="text-[11px] sm:text-xs mt-1 font-medium" style={{ color: '#2E4365', opacity: 0.5 }}>Pending Apps</div>
            </div>
            <div className="organic-card p-5 text-center flex-1 lg:flex-none" style={{ transform: 'none' }}>
              <div className="text-sm sm:text-base font-bold truncate" style={{ color: '#2E4365' }}>{ngoProfile?.city || '—'}</div>
              <div className="text-[11px] sm:text-xs mt-1 font-medium" style={{ color: '#2E4365', opacity: 0.5 }}>City</div>
            </div>
          </div>

          {/* Right main content */}
          <div className="flex-1 min-w-0">

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6">
          <Link
            href="/ngo-dashboard/add-cat"
            className="organic-card flex items-center justify-center gap-2 py-4 text-center text-sm font-bold transition hover:opacity-90"
            style={{ transform: 'none', background: '#2E4365', color: '#F3D58D', border: 'none' }}
          >
            <span className="text-lg">+</span> Add New Cat
          </Link>
          <Link
            href="/adoption"
            className="organic-card flex items-center justify-center gap-2 py-4 text-center text-sm font-bold transition hover:opacity-90"
            style={{ transform: 'none', background: '#F3D58D', color: '#2E4365', border: '1.5px solid #E59D2C' }}
          >
            <img src="/icon-emoji/paw-heart.png" alt="" width={22} height={22} className="inline-block" /> Adoption Feed
          </Link>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-1 mb-5 p-1 rounded-2xl" style={{ background: 'rgba(46, 67, 101, 0.08)' }}>
          <button
            onClick={() => setActiveTab('listings')}
            className="flex-1 py-3 rounded-xl text-sm font-bold transition-all duration-200 text-center"
            style={{
              background: activeTab === 'listings' ? '#ffffff' : 'transparent',
              color: '#2E4365',
              boxShadow: activeTab === 'listings' ? '0 2px 8px rgba(46, 67, 101, 0.1)' : 'none',
            }}
          >
             Listings ({catCount})
          </button>
          <button
            onClick={() => setActiveTab('applications')}
            className="flex-1 py-3 rounded-xl text-sm font-bold transition-all duration-200 text-center relative"
            style={{
              background: activeTab === 'applications' ? '#ffffff' : 'transparent',
              color: '#2E4365',
              boxShadow: activeTab === 'applications' ? '0 2px 8px rgba(46, 67, 101, 0.1)' : 'none',
            }}
          >
             Applications ({applications.length})
            {applications.filter((a) => a.status === 'pending').length > 0 && (
              <span className="absolute -top-1 -right-1 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center" style={{ background: '#c0392b' }}>
                {applications.filter((a) => a.status === 'pending').length}
              </span>
            )}
          </button>
        </div>

        {/* Listings Tab */}
        {activeTab === 'listings' && (
        <div className="organic-card p-5 sm:p-7" style={{ transform: 'none' }}>
          <div className="flex justify-between items-center mb-5">
            <h2 className="heading-artistic text-lg" style={{ color: '#2E4365' }}>Your Cats</h2>
            <Link href="/ngo-dashboard/add-cat" className="text-xs font-bold px-3 py-1.5 rounded-full transition hover:opacity-80" style={{ background: '#F3D58D', color: '#2E4365' }}>
              + Add New
            </Link>
          </div>

          {recentCats.length === 0 ? (
            <div className="text-center py-14">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: '#f7f3eb' }}>
                <img src="/icon-emoji/cat-paw.png" alt="" width={44} height={44} />
              </div>
              <p className="text-sm font-medium" style={{ color: '#2E4365', opacity: 0.7 }}>No cats listed yet</p>
              <p className="text-xs mt-1 mb-4" style={{ color: '#2E4365', opacity: 0.4 }}>Start adding cats available for adoption</p>
              <Link href="/ngo-dashboard/add-cat" className="inline-block text-sm font-bold px-5 py-2.5 rounded-full transition hover:opacity-80" style={{ background: '#2E4365', color: '#F3D58D' }}>
                Add your first cat →
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {recentCats.map((cat) => (
                <div key={cat.id} className="flex items-center gap-3 p-3 sm:p-4 rounded-2xl transition hover:shadow-sm" style={{ background: 'rgba(247, 243, 235, 0.5)' }}>

                  {cat.image_url ? (
                    <img src={cat.image_url} alt={cat.name} className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl object-cover shrink-0 shadow-sm" />
                  ) : (
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#F3D58D' }}><img src="/icon-emoji/cat-face.png" alt="" width={32} height={32} /></div>
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate" style={{ color: '#2E4365' }}>{cat.name}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#2E4365', opacity: 0.5 }}>📍 {cat.city}</p>
                  </div>

                  <span
                    className="text-[11px] px-3 py-1.5 rounded-full font-semibold shrink-0 capitalize"
                    style={{
                      background: cat.status === 'available' ? '#d6e3f0' : cat.status === 'adopted' ? '#D1FAE5' : '#f0f0f0',
                      color: cat.status === 'available' ? '#2E4365' : cat.status === 'adopted' ? '#065F46' : '#666',
                    }}
                  >
                    {cat.status}
                  </span>

                  {cat.status === 'available' && (
                    <button
                      onClick={() => handleMarkAdopted(cat.id)}
                      className="shrink-0 text-xs font-bold px-3.5 py-2 rounded-full transition hover:opacity-80"
                      style={{ background: '#2E4365', color: '#F3D58D' }}
                    >
                      ✓ Adopted
                    </button>
                  )}

                  {cat.status === 'adopted' && (
                    <span className="shrink-0 text-xs font-medium flex items-center gap-1" style={{ color: '#065F46' }}>
                      <img src="/icon-emoji/sparkle.png" alt="" width={16} height={16} className="inline-block" /> Story live
                    </span>
                  )}

                  <button
                    onClick={() => setDeleteConfirm({ id: cat.id, name: cat.name, type: 'adoption' })}
                    className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition hover:scale-110"
                    style={{ background: '#fef2f2' }}
                    title="Delete listing"
                  >
                    <Trash2 size={14} className="text-red-500" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        )}

        {/* Applications Tab */}
        {activeTab === 'applications' && (
        <div className="organic-card p-5 sm:p-7" style={{ transform: 'none' }}>
          <div className="flex justify-between items-center mb-5">
            <h2 className="heading-artistic text-lg" style={{ color: '#2E4365' }}>Adoption Applications</h2>
            <span className="text-xs font-bold px-3 py-1.5 rounded-full" style={{ background: applications.filter((a) => a.status === 'pending').length > 0 ? '#FEF3C7' : '#d6e3f0', color: applications.filter((a) => a.status === 'pending').length > 0 ? '#92400E' : '#2E4365' }}>
              {applications.filter((a) => a.status === 'pending').length} pending
            </span>
          </div>

          {applications.length === 0 ? (
            <div className="text-center py-14">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: '#f7f3eb' }}>
                <span className="text-3xl">📭</span>
              </div>
              <p className="text-sm font-medium" style={{ color: '#2E4365', opacity: 0.7 }}>No applications yet</p>
              <p className="text-xs mt-1" style={{ color: '#2E4365', opacity: 0.4 }}>
                When someone applies to adopt one of your cats, it will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {applications.map((app) => (
                <div
                  key={app.id}
                  className="rounded-2xl border overflow-hidden transition-all duration-200"
                  style={{
                    borderColor: app.status === 'pending' ? '#F3D58D' : '#e5e7eb',
                    background: app.status === 'pending' ? '#fffcf5' : '#ffffff',
                    boxShadow: app.status === 'pending' ? '0 2px 12px rgba(229, 157, 44, 0.08)' : 'none',
                  }}
                >
                  {/* Status bar at top */}
                  <div className="h-1" style={{ background: app.status === 'pending' ? '#F3D58D' : app.status === 'approved' ? '#34D399' : '#FCA5A5' }} />

                  <div className="p-4 sm:p-5">
                    {/* Header row */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-sm font-bold" style={{ background: '#d6e3f0', color: '#2E4365' }}>
                          {app.full_name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-sm truncate" style={{ color: '#2E4365' }}>{app.full_name}</p>
                          <p className="text-xs mt-0.5" style={{ color: '#2E4365', opacity: 0.6 }}>
                            For: <strong>{app.cat_name || 'Cat'}</strong>
                          </p>
                        </div>
                      </div>
                      <span
                        className="text-[11px] px-3 py-1.5 rounded-full font-bold shrink-0 capitalize"
                        style={{
                          background: app.status === 'pending' ? '#FEF3C7' : app.status === 'approved' ? '#D1FAE5' : '#FEE2E2',
                          color: app.status === 'pending' ? '#92400E' : app.status === 'approved' ? '#065F46' : '#991B1B',
                        }}
                      >
                        {app.status}
                      </span>
                    </div>

                    {/* Details grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
                      <div className="rounded-xl p-2.5 text-xs" style={{ background: '#f7f3eb' }}>
                        <span style={{ opacity: 0.5 }}>Phone</span>
                        <p className="font-medium mt-0.5" style={{ color: '#2E4365' }}>{app.phone || '—'}</p>
                      </div>
                      <div className="rounded-xl p-2.5 text-xs" style={{ background: '#f7f3eb' }}>
                        <span style={{ opacity: 0.5 }}>City</span>
                        <p className="font-medium mt-0.5" style={{ color: '#2E4365' }}>{app.city || '—'}</p>
                      </div>
                      <div className="rounded-xl p-2.5 text-xs" style={{ background: '#f7f3eb' }}>
                        <span style={{ opacity: 0.5 }}>Home</span>
                        <p className="font-medium mt-0.5" style={{ color: '#2E4365' }}>{app.home_type || '—'}</p>
                      </div>
                      <div className="rounded-xl p-2.5 text-xs" style={{ background: '#f7f3eb' }}>
                        <span style={{ opacity: 0.5 }}>Occupation</span>
                        <p className="font-medium mt-0.5" style={{ color: '#2E4365' }}>{app.occupation || '—'}</p>
                      </div>
                      {app.has_pets && (
                        <div className="rounded-xl p-2.5 text-xs flex items-center gap-1.5" style={{ background: '#f7f3eb' }}>
                          <span>🐾</span> <span className="font-medium" style={{ color: '#2E4365' }}>Has other pets</span>
                        </div>
                      )}
                      {app.has_children && (
                        <div className="rounded-xl p-2.5 text-xs flex items-center gap-1.5" style={{ background: '#f7f3eb' }}>
                          <span>👶</span> <span className="font-medium" style={{ color: '#2E4365' }}>Has children</span>
                        </div>
                      )}
                    </div>

                    {/* Why adopt */}
                    {app.why_adopt && (
                      <div className="rounded-xl p-4 mb-4 text-xs leading-relaxed" style={{ background: '#f7f3eb', borderLeft: '3px solid #F3D58D' }}>
                        <p className="font-bold mb-1.5 text-[11px] uppercase tracking-wide" style={{ color: '#2E4365', opacity: 0.5 }}>Why they want to adopt</p>
                        <p className="italic" style={{ color: '#2E4365' }}>&ldquo;{app.why_adopt}&rdquo;</p>
                      </div>
                    )}

                    {/* Experience */}
                    {app.experience && (
                      <p className="text-xs mb-3 px-1" style={{ color: '#2E4365', opacity: 0.7 }}>
                        <strong>Experience:</strong> {app.experience}
                      </p>
                    )}

                    {/* Footer: date + actions */}
                    <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid rgba(46, 67, 101, 0.06)' }}>
                      <p className="text-[11px]" style={{ color: '#2E4365', opacity: 0.4 }}>
                        {new Date(app.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>

                      {/* Action buttons */}
                      {app.status === 'pending' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApplicationAction(app.id, 'approved', app.cat_id)}
                            className="text-xs font-bold px-4 py-2 rounded-full transition hover:opacity-90"
                            style={{ background: '#2E4365', color: '#F3D58D' }}
                          >
                            ✅ Approve
                          </button>
                          <button
                            onClick={() => handleApplicationAction(app.id, 'rejected', app.cat_id)}
                            className="text-xs font-bold px-4 py-2 rounded-full transition hover:opacity-90 border"
                            style={{ borderColor: '#FCA5A5', color: '#991B1B', background: '#FEF2F2' }}
                          >
                            ✕ Reject
                          </button>
                          <Link
                            href={`/messages`}
                            className="text-xs font-bold px-4 py-2 rounded-full transition hover:opacity-90 text-center border"
                            style={{ borderColor: '#d6e3f0', color: '#2E4365' }}
                          >
                            💬 Chat
                          </Link>
                        </div>
                      )}

                      {app.status === 'approved' && (
                        <Link
                          href={`/messages`}
                          className="text-xs font-bold px-4 py-2 rounded-full transition hover:opacity-90 text-center"
                          style={{ background: '#F3D58D', color: '#2E4365' }}
                        >
                          💬 Message Adopter
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        )}

          </div>{/* end right main content */}
        </div>{/* end two-column layout */}

      </div>

      {/* ── Delete Confirmation Modal ── */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !deleting && setDeleteConfirm(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: '#fef2f2' }}>
                <Trash2 size={28} className="text-red-500" />
              </div>
            </div>
            <h3 className="text-xl font-bold mb-2" style={{ color: '#2E4365' }}>Delete Listing?</h3>
            <p className="text-sm text-gray-500 mb-6">
              Are you sure you want to delete <strong>{deleteConfirm.name || 'this listing'}</strong>? This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={deleting}
                className="flex-1 py-3 rounded-full font-semibold text-sm transition border-2 hover:opacity-80"
                style={{ borderColor: '#2E4365', color: '#2E4365' }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteListing(deleteConfirm.id, deleteConfirm.name)}
                disabled={deleting}
                className="flex-1 py-3 rounded-full font-semibold text-sm transition hover:scale-[1.02] disabled:opacity-50"
                style={{ background: '#dc2626', color: 'white' }}
              >
                {deleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
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
