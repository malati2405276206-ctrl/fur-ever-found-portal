// src/app/profile/[id]/page.js
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useChatContext } from '@/context/ChatContext'
import Link from 'next/link'

export default function PublicProfilePage() {
  const { id }       = useParams()
  const { user }     = useAuth()
  const { openChat } = useChatContext()
  const router       = useRouter()

  const [profile,   setProfile]   = useState(null)
  const [lostCats,  setLostCats]  = useState([])
  const [foundCats, setFoundCats] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [notFound,  setNotFound]  = useState(false)

  useEffect(() => {
    if (id) fetchProfile()
  }, [id])

  // If viewing own profile, redirect to /profile
  useEffect(() => {
    if (user && id === user.id) {
      router.replace('/profile')
    }
  }, [user, id])

  const fetchProfile = async () => {
    setLoading(true)

    const { data: profileData, error } = await supabase
      .from('profiles')
      .select('id, full_name, created_at, role')
      .eq('id', id)
      .maybeSingle()

    if (error || !profileData) {
      setNotFound(true)
      setLoading(false)
      return
    }

    setProfile(profileData)

    // Only fetch public lost/found cat reports
    const [{ data: lost }, { data: found }] = await Promise.all([
      supabase.from('lost_cats').select('*').eq('user_id', id).eq('status', 'lost').order('created_at', { ascending: false }),
      supabase.from('found_cats').select('*').eq('user_id', id).order('created_at', { ascending: false }),
    ])

    setLostCats(lost || [])
    setFoundCats(found || [])
    setLoading(false)
  }

  const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric'
  })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <div className="text-5xl mb-4">🐾</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Profile not found</h2>
          <p className="text-gray-400 text-sm mb-4">This user doesn&apos;t exist or their profile is private.</p>
          <Link href="/" className="text-orange-500 hover:underline text-sm font-medium">← Back to Home</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-3xl mx-auto">

        {/* Profile Header */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-orange-100 flex items-center justify-center text-3xl shrink-0">
                🐾
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {profile?.full_name || 'Cat Lover'}
                </h1>
                <p className="text-gray-400 text-xs mt-0.5">
                  Member since {formatDate(profile?.created_at)}
                </p>
                {profile?.role === 'ngo' && (
                  <span className="inline-block mt-1 text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full font-medium">
                    🏢 NGO Partner
                  </span>
                )}
              </div>
            </div>

            {/* Message button — only for logged-in users viewing someone else */}
            {user && user.id !== id && (
              <button
                onClick={() => openChat({
                  catType:     'lost',
                  catId:       lostCats[0]?.id || id,
                  recipientId: id,
                  catLabel:    `${profile?.full_name || 'User'}'s profile`,
                })}
                className="shrink-0 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-semibold transition"
              >
                💬 Message
              </button>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-100">
            <div className="text-center">
              <div className="text-2xl font-extrabold text-orange-500">{lostCats.length}</div>
              <div className="text-xs text-gray-400 mt-0.5">Active Lost Reports</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-extrabold text-green-500">{foundCats.length}</div>
              <div className="text-xs text-gray-400 mt-0.5">Found Reports</div>
            </div>
          </div>
        </div>

        {/* Lost Cats */}
        {lostCats.length > 0 && (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 mb-6">
            <h2 className="font-bold text-gray-800 mb-4">😿 Active Lost Cat Reports</h2>
            <div className="space-y-3">
              {lostCats.map((cat) => (
                <div key={cat.id} className="flex gap-3 items-center p-3 rounded-xl bg-orange-50 border border-orange-100">
                  {cat.image_url ? (
                    <img src={cat.image_url} alt={cat.name} className="w-12 h-12 rounded-xl object-cover shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center text-xl shrink-0">🐱</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 text-sm">{cat.name}</p>
                    <p className="text-xs text-orange-500">📍 {cat.location}</p>
                    <p className="text-xs text-gray-400 line-clamp-1 mt-0.5">{cat.description}</p>
                  </div>
                  <span className="text-xs text-gray-400 shrink-0">{formatDate(cat.created_at)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Found Cats */}
        {foundCats.length > 0 && (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-bold text-gray-800 mb-4">😊 Found Cat Reports</h2>
            <div className="space-y-3">
              {foundCats.map((cat) => (
                <div key={cat.id} className="flex gap-3 items-center p-3 rounded-xl bg-green-50 border border-green-100">
                  {cat.image_url ? (
                    <img src={cat.image_url} alt="Found cat" className="w-12 h-12 rounded-xl object-cover shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center text-xl shrink-0">🐱</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 text-sm">Found Cat</p>
                    <p className="text-xs text-green-600">📍 {cat.location}</p>
                    <p className="text-xs text-gray-400 line-clamp-1 mt-0.5">{cat.description}</p>
                  </div>
                  <span className="text-xs text-gray-400 shrink-0">{formatDate(cat.created_at)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {lostCats.length === 0 && foundCats.length === 0 && (
          <div className="text-center py-10 text-gray-400 text-sm">
            <div className="text-4xl mb-3">🐾</div>
            This user hasn&apos;t posted any reports yet.
          </div>
        )}
      </div>
    </div>
  )
}