// src/app/admin/page.js
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

// Simple password gate — no auth needed, just a secret key
// Change this to whatever you want your admin password to be
const ADMIN_PASSWORD = 'furever2024admin'

export default function AdminPage() {
  const [authed,     setAuthed]     = useState(false)
  const [pwInput,    setPwInput]    = useState('')
  const [pwError,    setPwError]    = useState('')
  const [activeTab,  setActiveTab]  = useState('ngos')
  const router = useRouter()

  // Stats
  const [stats,      setStats]      = useState({ users: 0, lostCats: 0, foundCats: 0, adoptionCats: 0, messages: 0 })

  // Data
  const [pendingNGOs,  setPendingNGOs]  = useState([])
  const [allNGOs,      setAllNGOs]      = useState([])
  const [lostCats,     setLostCats]     = useState([])
  const [foundCats,    setFoundCats]    = useState([])
  const [loading,      setLoading]      = useState(false)
  const [actionMsg,    setActionMsg]    = useState('')

  useEffect(() => {
    const saved = sessionStorage.getItem('admin_authed')
    if (saved === 'true') setAuthed(true)
  }, [])

  useEffect(() => {
    if (authed) fetchAllData()
  }, [authed])

  const handlePasswordSubmit = (e) => {
    e.preventDefault()
    if (pwInput === ADMIN_PASSWORD) {
      sessionStorage.setItem('admin_authed', 'true')
      setAuthed(true)
      setPwError('')
    } else {
      setPwError('Incorrect password.')
    }
  }

  const fetchAllData = async () => {
    setLoading(true)

    // Fetch pending NGOs
    const { data: pending } = await supabase
      .from('ngo_profiles')
      .select('*, profiles(email, full_name)')
      .eq('verified', false)
      .order('created_at', { ascending: false })

    // Fetch all NGOs
    const { data: ngos } = await supabase
      .from('ngo_profiles')
      .select('*, profiles(email, full_name)')
      .eq('verified', true)
      .order('created_at', { ascending: false })

    // Fetch lost cats
    const { data: lost } = await supabase
      .from('lost_cats')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)

    // Fetch found cats
    const { data: found } = await supabase
      .from('found_cats')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)

    // Fetch stats
    const [
      { count: userCount },
      { count: lostCount },
      { count: foundCount },
      { count: adoptCount },
      { count: msgCount },
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('lost_cats').select('*', { count: 'exact', head: true }),
      supabase.from('found_cats').select('*', { count: 'exact', head: true }),
      supabase.from('adoption_cats').select('*', { count: 'exact', head: true }),
      supabase.from('messages').select('*', { count: 'exact', head: true }),
    ])

    setPendingNGOs(pending || [])
    setAllNGOs(ngos || [])
    setLostCats(lost || [])
    setFoundCats(found || [])
    setStats({
      users:        userCount || 0,
      lostCats:     lostCount || 0,
      foundCats:    foundCount || 0,
      adoptionCats: adoptCount || 0,
      messages:     msgCount  || 0,
    })

    setLoading(false)
  }

  const handleApproveNGO = async (ngoProfile) => {
    const { error } = await supabase
      .from('ngo_profiles')
      .update({ verified: true })
      .eq('id', ngoProfile.id)

    if (error) { setActionMsg('Failed to approve.'); return }

    setActionMsg(`✅ ${ngoProfile.org_name} approved!`)
    setTimeout(() => setActionMsg(''), 3000)
    fetchAllData()
  }

  const handleRejectNGO = async (ngoProfile) => {
    if (!confirm(`Reject ${ngoProfile.org_name}? This will delete their NGO application.`)) return

    const { error } = await supabase
      .from('ngo_profiles')
      .delete()
      .eq('id', ngoProfile.id)

    if (error) { setActionMsg('Failed to reject.'); return }

    setActionMsg(`❌ ${ngoProfile.org_name} rejected and removed.`)
    setTimeout(() => setActionMsg(''), 3000)
    fetchAllData()
  }

  const handleMarkReunited = async (catId) => {
    await supabase.from('lost_cats').update({ status: 'reunited' }).eq('id', catId)
    setActionMsg('✅ Marked as reunited!')
    setTimeout(() => setActionMsg(''), 3000)
    fetchAllData()
  }

  const handleDeleteLostCat = async (catId) => {
    if (!confirm('Delete this lost cat report?')) return
    await supabase.from('lost_cats').delete().eq('id', catId)
    setActionMsg('🗑️ Report deleted.')
    setTimeout(() => setActionMsg(''), 3000)
    fetchAllData()
  }

  const handleDeleteFoundCat = async (catId) => {
    if (!confirm('Delete this found cat report?')) return
    await supabase.from('found_cats').delete().eq('id', catId)
    setActionMsg('🗑️ Report deleted.')
    setTimeout(() => setActionMsg(''), 3000)
    fetchAllData()
  }

  const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

  // ── Password Gate ──
  if (!authed) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
        <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8 w-full max-w-sm">
          <div className="text-center mb-6">
            <div className="text-4xl mb-3">🔐</div>
            <h1 className="text-xl font-bold text-white">Admin Portal</h1>
            <p className="text-gray-400 text-sm mt-1">Fur Ever Found</p>
          </div>

          {pwError && (
            <div className="bg-red-900/40 border border-red-700 text-red-400 text-sm px-4 py-2 rounded-xl mb-4">
              {pwError}
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <input
              type="password"
              value={pwInput}
              onChange={(e) => setPwInput(e.target.value)}
              placeholder="Admin password"
              className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
            />
            <button type="submit" className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3 rounded-xl transition">
              Enter Admin Panel
            </button>
          </form>
        </div>
      </div>
    )
  }

  // ── Main Admin Dashboard ──
  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">🔐 Admin Portal</h1>
          <p className="text-gray-400 text-xs mt-0.5">Fur Ever Found — Platform Management</p>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchAllData} className="text-xs text-gray-400 hover:text-white border border-gray-700 px-3 py-1.5 rounded-lg transition">
            🔄 Refresh
          </button>
          <button
            onClick={() => { sessionStorage.removeItem('admin_authed'); setAuthed(false) }}
            className="text-xs text-red-400 hover:text-red-300 border border-red-900 px-3 py-1.5 rounded-lg transition"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">

        {/* Action message toast */}
        {actionMsg && (
          <div className="bg-green-900/40 border border-green-700 text-green-400 text-sm px-4 py-3 rounded-xl mb-6">
            {actionMsg}
          </div>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
          {[
            { label: 'Total Users',     value: stats.users,        emoji: '👤' },
            { label: 'Lost Reports',    value: stats.lostCats,     emoji: '😿' },
            { label: 'Found Reports',   value: stats.foundCats,    emoji: '😊' },
            { label: 'Adoption Cats',   value: stats.adoptionCats, emoji: '🏠' },
            { label: 'Messages Sent',   value: stats.messages,     emoji: '💬' },
          ].map((s) => (
            <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-2xl p-4 text-center">
              <div className="text-2xl mb-1">{s.emoji}</div>
              <div className="text-2xl font-extrabold text-amber-400">{s.value}</div>
              <div className="text-gray-500 text-xs mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {[
            { id: 'ngos',      label: `🏢 Pending NGOs (${pendingNGOs.length})` },
            { id: 'all-ngos',  label: `✅ Verified NGOs (${allNGOs.length})`    },
            { id: 'lost',      label: `😿 Lost Cats (${lostCats.length})`       },
            { id: 'found',     label: `😊 Found Cats (${foundCats.length})`     },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition ${activeTab === tab.id ? 'bg-amber-500 text-white' : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>

            {/* ── Pending NGOs Tab ── */}
            {activeTab === 'ngos' && (
              <div className="space-y-4">
                {pendingNGOs.length === 0 ? (
                  <div className="text-center py-16 text-gray-500">
                    <div className="text-4xl mb-3">🎉</div>
                    <p>No pending NGO applications</p>
                  </div>
                ) : pendingNGOs.map((ngo) => (
                  <div key={ngo.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-white text-lg">{ngo.org_name}</h3>
                          <span className="text-xs bg-amber-900/40 text-amber-400 border border-amber-700 px-2 py-0.5 rounded-full">Pending</span>
                        </div>
                        <p className="text-gray-400 text-sm mb-1">📧 {ngo.profiles?.email}</p>
                        <p className="text-gray-400 text-sm mb-1">👤 {ngo.profiles?.full_name}</p>
                        <p className="text-gray-400 text-sm mb-1">📍 {ngo.city}</p>
                        <p className="text-gray-400 text-sm mb-1">📞 {ngo.contact_phone}</p>
                        {ngo.website && <p className="text-amber-400 text-sm mb-2">🌐 {ngo.website}</p>}
                        <p className="text-gray-300 text-sm mt-3 leading-relaxed">{ngo.org_description}</p>
                        <p className="text-gray-600 text-xs mt-2">Applied {formatDate(ngo.created_at)}</p>
                      </div>

                        <div className="flex sm:flex-col gap-2 shrink-0 w-full sm:w-auto mt-4 sm:mt-0">
                        <button
                            onClick={() => handleApproveNGO(ngo)}
                            className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition"
                        >
                            ✅ Approve
                        </button>
                        <button
                            onClick={() => handleRejectNGO(ngo)}
                            className="flex-1 sm:flex-none bg-red-900/50 hover:bg-red-800 text-red-400 px-5 py-2.5 rounded-xl font-semibold text-sm transition border border-red-800"
                        >
                            ❌ Reject
                        </button>
                        </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── Verified NGOs Tab ── */}
            {activeTab === 'all-ngos' && (
              <div className="space-y-3">
                {allNGOs.length === 0 ? (
                  <div className="text-center py-16 text-gray-500">No verified NGOs yet.</div>
                ) : allNGOs.map((ngo) => (
                  <div key={ngo.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-white">{ngo.org_name}</p>
                        <span className="text-xs bg-green-900/40 text-green-400 border border-green-800 px-2 py-0.5 rounded-full">Verified</span>
                      </div>
                      <p className="text-gray-400 text-xs mt-0.5">📍 {ngo.city} · 📧 {ngo.profiles?.email}</p>
                      <p className="text-gray-500 text-xs mt-0.5">Approved {formatDate(ngo.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── Lost Cats Tab ── */}
            {activeTab === 'lost' && (
              <div className="space-y-3">
                {lostCats.map((cat) => (
                  <div key={cat.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex gap-4 items-start">
                    {cat.image_url ? (
                      <img src={cat.image_url} alt={cat.name} className="w-16 h-16 rounded-xl object-cover shrink-0" />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-gray-800 flex items-center justify-center text-2xl shrink-0">🐱</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="font-semibold text-white">{cat.name}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${cat.status === 'reunited' ? 'bg-green-900/40 text-green-400 border-green-800' : 'bg-red-900/40 text-red-400 border-red-800'}`}>
                          {cat.status}
                        </span>
                      </div>
                      <p className="text-gray-400 text-xs">📍 {cat.location}</p>
                      <p className="text-gray-500 text-xs mt-0.5 line-clamp-1">{cat.description}</p>
                      <p className="text-gray-600 text-xs mt-0.5">📧 {cat.contact_email} · {formatDate(cat.created_at)}</p>
                    </div>
                    <div className="flex flex-col gap-2 shrink-0">
                      {cat.status !== 'reunited' && (
                        <button onClick={() => handleMarkReunited(cat.id)} className="text-xs bg-green-800/50 hover:bg-green-700 text-green-400 px-3 py-1.5 rounded-lg transition border border-green-800">
                          🎉 Reunited
                        </button>
                      )}
                      <button onClick={() => handleDeleteLostCat(cat.id)} className="text-xs bg-red-900/30 hover:bg-red-800 text-red-400 px-3 py-1.5 rounded-lg transition border border-red-900">
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── Found Cats Tab ── */}
            {activeTab === 'found' && (
              <div className="space-y-3">
                {foundCats.map((cat) => (
                  <div key={cat.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex gap-4 items-start">
                    {cat.image_url ? (
                      <img src={cat.image_url} alt="Found cat" className="w-16 h-16 rounded-xl object-cover shrink-0" />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-gray-800 flex items-center justify-center text-2xl shrink-0">🐱</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white text-sm">Found Cat</p>
                      <p className="text-gray-400 text-xs">📍 {cat.location}</p>
                      <p className="text-gray-500 text-xs mt-0.5 line-clamp-1">{cat.description}</p>
                      <p className="text-gray-600 text-xs mt-0.5">📧 {cat.contact_email} · {formatDate(cat.created_at)}</p>
                    </div>
                    <button onClick={() => handleDeleteFoundCat(cat.id)} className="text-xs bg-red-900/30 hover:bg-red-800 text-red-400 px-3 py-1.5 rounded-lg transition border border-red-900 shrink-0">
                      🗑️ Delete
                    </button>
                  </div>
                ))}
              </div>
            )}

          </>
        )}
      </div>
    </div>
  )
}