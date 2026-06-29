// src/app/profile/page.js
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import ProtectedRoute from '@/components/ProtectedRoute'
import Link from 'next/link'

function ProfileContent() {
  const { user } = useAuth()
  const router = useRouter()

  const [profile,    setProfile]    = useState(null)
  const [lostCats,   setLostCats]   = useState([])
  const [foundCats,  setFoundCats]  = useState([])
  const [activeTab,  setActiveTab]  = useState('lost')
  const [loading,    setLoading]    = useState(true)
  const [deleteId,   setDeleteId]   = useState(null)
  const [deleting,   setDeleting]   = useState(false)
  const [error,      setError]      = useState('')

  useEffect(() => {
    if (user) fetchData()
  }, [user])

  const fetchData = async () => {
    setLoading(true)

    // Fetch profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()

    setProfile(profileData)

    // Fetch lost cat reports by this user
    const { data: lost } = await supabase
      .from('lost_cats')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    setLostCats(lost || [])

    // Fetch found cat reports by this user
    const { data: found } = await supabase
      .from('found_cats')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    setFoundCats(found || [])
    setLoading(false)
  }

  const handleDelete = async (id, type) => {
    setDeleting(true)
    setError('')

    const table = type === 'lost' ? 'lost_cats' : 'found_cats'

    const { error: delError } = await supabase
      .from(table)
      .delete()
      .eq('id', id)
      .eq('user_id', user.id) // extra safety — only delete own posts

    if (delError) {
      setError('Failed to delete. Please try again.')
      setDeleting(false)
      return
    }

    // Update local state instantly
    if (type === 'lost') {
      setLostCats((prev) => prev.filter((c) => c.id !== id))
    } else {
      setFoundCats((prev) => prev.filter((c) => c.id !== id))
    }

    setDeleteId(null)
    setDeleting(false)
  }

  const handleMarkReunited = async (id) => {
    const { error } = await supabase
      .from('lost_cats')
      .update({ status: 'reunited' })
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      setError('Failed to update status.')
      return
    }

    setLostCats((prev) => prev.map((c) => c.id === id ? { ...c, status: 'reunited' } : c))
  }

  const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-4xl mx-auto">

        {/* ── Profile Header ── */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-orange-100 flex items-center justify-center text-3xl">
              🐾
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{profile?.full_name || 'Cat Lover'}</h1>
              <p className="text-gray-400 text-sm">{user?.email}</p>
              <p className="text-gray-300 text-xs mt-0.5">Member since {formatDate(user?.created_at)}</p>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4 mt-6 pt-6 border-t border-gray-100">
              <div className="text-center p-2 sm:p-0">
                <div className="text-xl sm:text-2xl font-extrabold text-orange-500">{lostCats.length}</div>
                <div className="text-xs text-gray-400 mt-0.5">Lost Reports</div>
              </div>
              <div className="text-center p-2 sm:p-0">
                <div className="text-xl sm:text-2xl font-extrabold text-green-500">{foundCats.length}</div>
                <div className="text-xs text-gray-400 mt-0.5">Found Reports</div>
              </div>
              <div className="text-center p-2 sm:p-0">
                <div className="text-xl sm:text-2xl font-extrabold text-purple-500">
                  {lostCats.filter((c) => c.status === 'reunited').length}
                </div>
                <div className="text-xs text-gray-400 mt-0.5">Reunited</div>
            </div>
          </div>
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl mb-4">
            ⚠️ {error}
          </div>
        )}

        {/* ── Tabs ── */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setActiveTab('lost')}
            className={`flex-1 py-3 rounded-xl font-semibold text-sm transition ${activeTab === 'lost' ? 'bg-orange-500 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:border-orange-300'}`}
          >
            😿 Lost Cats ({lostCats.length})
          </button>
          <button
            onClick={() => setActiveTab('found')}
            className={`flex-1 py-3 rounded-xl font-semibold text-sm transition ${activeTab === 'found' ? 'bg-green-500 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:border-green-300'}`}
          >
            😊 Found Cats ({foundCats.length})
          </button>
        </div>

        {/* ── Lost Cats Tab ── */}
        {activeTab === 'lost' && (
          <div className="space-y-4">
            {lostCats.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-gray-100">
                <div className="text-5xl mb-3">🐾</div>
                <p className="text-gray-500 font-medium mb-4">No lost cat reports yet</p>
                <Link href="/report" className="inline-block bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition">
                  Report a Lost Cat
                </Link>
              </div>
            ) : (
              lostCats.map((cat) => (
                <div key={cat.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <div className="flex gap-4">

                    {/* Image */}
                    {cat.image_url ? (
                      <img src={cat.image_url} alt={cat.name} className="w-20 h-20 rounded-xl object-cover shrink-0" />
                    ) : (
                      <div className="w-20 h-20 rounded-xl bg-orange-100 flex items-center justify-center text-3xl shrink-0">🐱</div>
                    )}

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-gray-900">{cat.name}</h3>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium shrink-0 ${cat.status === 'reunited' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'}`}>
                          {cat.status === 'reunited' ? '🎉 Reunited' : '😿 Lost'}
                        </span>
                      </div>
                      <p className="text-xs text-orange-500 font-medium mt-0.5">📍 {cat.location}</p>
                      <p className="text-gray-500 text-xs mt-1 line-clamp-2">{cat.description}</p>
                      <p className="text-gray-300 text-xs mt-1">Reported {formatDate(cat.created_at)}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                    {cat.status !== 'reunited' && (
                      <button
                        onClick={() => handleMarkReunited(cat.id)}
                        className="flex-1 border border-green-300 text-green-600 hover:bg-green-50 text-xs font-semibold py-2 rounded-xl transition"
                      >
                        🎉 Mark Reunited
                      </button>
                    )}
                    <button
                      onClick={() => setDeleteId({ id: cat.id, type: 'lost', name: cat.name })}
                      className="flex-1 border border-red-200 text-red-500 hover:bg-red-50 text-xs font-semibold py-2 rounded-xl transition"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── Found Cats Tab ── */}
        {activeTab === 'found' && (
          <div className="space-y-4">
            {foundCats.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-gray-100">
                <div className="text-5xl mb-3">🐾</div>
                <p className="text-gray-500 font-medium mb-4">No found cat reports yet</p>
                <Link href="/report" className="inline-block bg-green-500 hover:bg-green-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition">
                  Report a Found Cat
                </Link>
              </div>
            ) : (
              foundCats.map((cat) => (
                <div key={cat.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <div className="flex gap-4">

                    {/* Image */}
                    {cat.image_url ? (
                      <img src={cat.image_url} alt="Found cat" className="w-20 h-20 rounded-xl object-cover shrink-0" />
                    ) : (
                      <div className="w-20 h-20 rounded-xl bg-green-100 flex items-center justify-center text-3xl shrink-0">🐱</div>
                    )}

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-gray-900">Found Cat</h3>
                        <span className="text-xs px-2 py-1 rounded-full font-medium shrink-0 bg-green-100 text-green-600">
                          😊 Found
                        </span>
                      </div>
                      <p className="text-xs text-green-600 font-medium mt-0.5">📍 {cat.location}</p>
                      <p className="text-gray-500 text-xs mt-1 line-clamp-2">{cat.description}</p>
                      <p className="text-gray-300 text-xs mt-1">Reported {formatDate(cat.created_at)}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => setDeleteId({ id: cat.id, type: 'found', name: 'this found cat' })}
                      className="flex-1 border border-red-200 text-red-500 hover:bg-red-50 text-xs font-semibold py-2 rounded-xl transition"
                    >
                      🗑️ Delete Report
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

      </div>

      {/* ── Delete Confirmation Modal ── */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full text-center">
            <div className="text-5xl mb-4">🗑️</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Report?</h3>
            <p className="text-gray-500 text-sm mb-6">
              Are you sure you want to delete the report for <strong>{deleteId.name}</strong>? This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                disabled={deleting}
                className="flex-1 border border-gray-200 text-gray-600 hover:bg-gray-50 py-3 rounded-xl font-semibold transition text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteId.id, deleteId.type)}
                disabled={deleting}
                className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white py-3 rounded-xl font-semibold transition text-sm"
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

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  )
}