// src/app/profile/page.js
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import ProtectedRoute from '@/components/ProtectedRoute'
import AIMatchButton from '@/components/AIMatchButton'
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

  // Edit profile states
  const [editMode,     setEditMode]     = useState(false)
  const [editName,     setEditName]     = useState('')
  const [editPhone,    setEditPhone]    = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileMsg,   setProfileMsg]   = useState('')

  // Add these states inside ProfileContent:
  const [editCat,      setEditCat]      = useState(null)  // cat being edited
  const [editField,    setEditField]    = useState({})    // edited values
  const [savingCat,    setSavingCat]    = useState(false)
  const [catEditMsg,   setCatEditMsg]   = useState('')
  const [newImageFile, setNewImageFile] = useState(null)
  const [newImagePreview, setNewImagePreview] = useState(null)

  useEffect(() => {
    if (user) fetchData()
  }, [user])

  const fetchData = async () => {
    setLoading(true)

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()

    setProfile(profileData)
    setEditName(profileData?.full_name || '')
    setEditPhone(profileData?.phone || '')

    const { data: lost } = await supabase
      .from('lost_cats')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    const { data: found } = await supabase
      .from('found_cats')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    setLostCats(lost || [])
    setFoundCats(found || [])
    setLoading(false)
  }

    const handleOpenEditCat = (cat, type) => {
      setEditCat({ ...cat, _type: type })
      setEditField({
        name:          cat.name || '',
        description:   cat.description || '',
        location:      cat.location || '',
        contact_phone: cat.contact_phone || '',
      })
      setNewImageFile(null)
      setNewImagePreview(null)
    }

    const handleSaveCat = async () => {
      if (!editCat) return
      setSavingCat(true)
      setCatEditMsg('')

      try {
        let imageUrl = editCat.image_url

        // Upload new image if selected
        if (newImageFile) {
          const fileExt  = newImageFile.name.split('.').pop().toLowerCase()
          const fileName = `${user.id}_${Date.now()}.${fileExt}`
          const { error: uploadError } = await supabase.storage
            .from('cat-images')
            .upload(fileName, newImageFile)

          if (uploadError) throw uploadError

          const { data: urlData } = supabase.storage
            .from('cat-images')
            .getPublicUrl(fileName)

          imageUrl = urlData.publicUrl
        }

        const table   = editCat._type === 'lost' ? 'lost_cats' : 'found_cats'
        const updates = {
          description:   editField.description,
          location:      editField.location,
          contact_phone: editField.contact_phone || null,
          image_url:     imageUrl,
        }

        // Only lost cats have a name field
        if (editCat._type === 'lost') {
          updates.name = editField.name
        }

        const { error } = await supabase
          .from(table)
          .update(updates)
          .eq('id', editCat.id)
          .eq('user_id', user.id)

        if (error) throw error

        // Update local state
        if (editCat._type === 'lost') {
          setLostCats((prev) => prev.map((c) => c.id === editCat.id ? { ...c, ...updates } : c))
        } else {
          setFoundCats((prev) => prev.map((c) => c.id === editCat.id ? { ...c, ...updates } : c))
        }

        setCatEditMsg('✅ Report updated!')
        setTimeout(() => { setCatEditMsg(''); setEditCat(null) }, 1500)

      } catch (err) {
        setCatEditMsg('❌ Failed to save: ' + err.message)
      } finally {
        setSavingCat(false)
      }
    }

  const handleSaveProfile = async () => {
    setSavingProfile(true)
    setProfileMsg('')

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: editName.trim(),
        phone:     editPhone.trim() || null,
      })
      .eq('id', user.id)

    if (error) {
      setProfileMsg('Failed to save. Please try again.')
    } else {
      setProfileMsg('✅ Profile updated!')
      setProfile((prev) => ({ ...prev, full_name: editName, phone: editPhone }))
      setEditMode(false)
      setTimeout(() => setProfileMsg(''), 3000)
    }

    setSavingProfile(false)
  }

  const handleDelete = async (id, type) => {
    setDeleting(true)
    setError('')

    const table = type === 'lost' ? 'lost_cats' : 'found_cats'

    const { error: delError } = await supabase
      .from(table)
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (delError) {
      setError('Failed to delete. Please try again.')
      setDeleting(false)
      return
    }

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

    if (error) { setError('Failed to update status.'); return }
    setLostCats((prev) => prev.map((c) => c.id === id ? { ...c, status: 'reunited' } : c))
  }

  const handleMarkResolved = async (id) => {
    const { error } = await supabase
      .from('found_cats')
      .update({ status: 'resolved' })
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) { setError('Failed to update.'); return }
    setFoundCats((prev) => prev.map((c) => c.id === id ? { ...c, status: 'resolved' } : c))
  }

  const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric'
  })

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

          {profileMsg && (
            <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-2 rounded-xl mb-4">
              {profileMsg}
            </div>
          )}

          {!editMode ? (
            /* ── View Mode ── */
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-orange-100 flex items-center justify-center text-3xl shrink-0">
                  🐾
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    {profile?.full_name || 'Cat Lover'}
                  </h1>
                  <p className="text-gray-400 text-sm">{user?.email}</p>
                  {profile?.phone && (
                    <p className="text-gray-400 text-sm">📞 {profile.phone}</p>
                  )}
                  <p className="text-gray-300 text-xs mt-0.5">
                    Member since {formatDate(user?.created_at)}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setEditMode(true)}
                className="shrink-0 border border-gray-200 text-gray-600 hover:bg-gray-50 px-4 py-2 rounded-xl text-sm font-medium transition flex items-center gap-1.5"
              >
                ✏️ Edit Profile
              </button>
            </div>
          ) : (
            /* ── Edit Mode ── */
            <div>
              <h2 className="font-bold text-gray-800 mb-4">Edit Profile</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Your full name"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-400 transition text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Phone <span className="font-normal text-gray-400">(optional)</span>
                  </label>
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-400 transition text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
                  <input
                    type="email"
                    value={user?.email}
                    disabled
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-100 bg-gray-50 text-gray-400 text-sm cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-400 mt-0.5">Email cannot be changed</p>
                </div>
              </div>

              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => { setEditMode(false); setEditName(profile?.full_name || ''); setEditPhone(profile?.phone || '') }}
                  className="flex-1 border border-gray-200 text-gray-600 hover:bg-gray-50 py-2.5 rounded-xl font-semibold text-sm transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveProfile}
                  disabled={savingProfile}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white py-2.5 rounded-xl font-semibold text-sm transition"
                >
                  {savingProfile ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          )}

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

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl mb-4">
            ⚠️ {error}
          </div>
        )}

        {/* Tabs */}
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

        {/* Lost Cats Tab */}
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
            ) : lostCats.map((cat) => (
              <div key={cat.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex gap-4">
                  {cat.image_url ? (
                    <img src={cat.image_url} alt={cat.name} className="w-20 h-20 rounded-xl object-cover shrink-0" />
                  ) : (
                    <div className="w-20 h-20 rounded-xl bg-orange-100 flex items-center justify-center text-3xl shrink-0">🐱</div>
                  )}
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

                <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100 flex-wrap">
                  {cat.status !== 'reunited' && (
                    <button onClick={() => handleMarkReunited(cat.id)} className="flex-1 border border-green-300 text-green-600 hover:bg-green-50 text-xs font-semibold py-2 rounded-xl transition">
                      🎉 Mark Reunited
                    </button>
                  )}
                  <button
                      onClick={() => handleOpenEditCat(cat, 'lost')} // or 'found' for found cats
                      className="flex-1 border border-blue-200 text-blue-500 hover:bg-blue-50 text-xs font-semibold py-2 rounded-xl transition"
                    >
                      ✏️ Edit
                    </button>
                  <button onClick={() => setDeleteId({ id: cat.id, type: 'lost', name: cat.name })} className="flex-1 border border-red-200 text-red-500 hover:bg-red-50 text-xs font-semibold py-2 rounded-xl transition">
                    🗑️ Delete
                  </button>
                </div>

                {/* AI Match — owner only */}
                {cat.status !== 'reunited' && (
                  <div className="mt-2">
                    <AIMatchButton lostCat={cat} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Found Cats Tab */}
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
            ) : foundCats.map((cat) => (
              <div key={cat.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex gap-4">
                  {cat.image_url ? (
                    <img src={cat.image_url} alt="Found cat" className="w-20 h-20 rounded-xl object-cover shrink-0" />
                  ) : (
                    <div className="w-20 h-20 rounded-xl bg-green-100 flex items-center justify-center text-3xl shrink-0">🐱</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-gray-900">Found Cat</h3>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium shrink-0 ${cat.status === 'resolved' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
                        {cat.status === 'resolved' ? '✅ Resolved' : '😊 Found'}
                      </span>
                    </div>
                    <p className="text-xs text-green-600 font-medium mt-0.5">📍 {cat.location}</p>
                    <p className="text-gray-500 text-xs mt-1 line-clamp-2">{cat.description}</p>
                    <p className="text-gray-300 text-xs mt-1">Reported {formatDate(cat.created_at)}</p>
                  </div>
                </div>

                <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                  {cat.status !== 'resolved' && (
                    <button onClick={() => handleMarkResolved(cat.id)} className="flex-1 border border-blue-200 text-blue-500 hover:bg-blue-50 text-xs font-semibold py-2 rounded-xl transition">
                      ✅ Mark Resolved
                    </button>
                  )}
                  <button onClick={() => setDeleteId({ id: cat.id, type: 'found', name: 'this found cat' })} className="flex-1 border border-red-200 text-red-500 hover:bg-red-50 text-xs font-semibold py-2 rounded-xl transition">
                    🗑️ Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Edit Cat Modal ── */}
        {editCat && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center px-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">

              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h3 className="font-bold text-gray-900">✏️ Edit Report</h3>
                <button onClick={() => setEditCat(null)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

                {catEditMsg && (
                  <div className={`text-sm px-4 py-2 rounded-xl ${catEditMsg.startsWith('✅') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
                    {catEditMsg}
                  </div>
                )}

                {/* Photo update */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">
                    Photo
                  </label>
                  {(newImagePreview || editCat.image_url) ? (
                    <div className="relative">
                      <img
                        src={newImagePreview || editCat.image_url}
                        alt="Cat"
                        className="w-full h-40 object-cover rounded-xl border border-gray-200"
                      />
                      <label className="absolute bottom-2 right-2 bg-white text-gray-700 text-xs px-3 py-1.5 rounded-full shadow cursor-pointer hover:bg-gray-50 transition border border-gray-200">
                        Change Photo
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (!file) return
                            setNewImageFile(file)
                            setNewImagePreview(URL.createObjectURL(file))
                          }}
                        />
                      </label>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-orange-300 rounded-xl cursor-pointer bg-orange-50 hover:bg-orange-100 transition">
                      <span className="text-2xl mb-1">📷</span>
                      <span className="text-sm text-orange-500 font-medium">Add a photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (!file) return
                          setNewImageFile(file)
                          setNewImagePreview(URL.createObjectURL(file))
                        }}
                      />
                    </label>
                  )}
                </div>

                {/* Name — lost cats only */}
                {editCat._type === 'lost' && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1">Cat&apos;s Name</label>
                    <input
                      type="text"
                      value={editField.name}
                      onChange={(e) => setEditField((p) => ({ ...p, name: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-400 transition text-sm"
                    />
                  </div>
                )}

                {/* Description */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1">Description</label>
                  <textarea
                    value={editField.description}
                    onChange={(e) => setEditField((p) => ({ ...p, description: e.target.value }))}
                    rows={4}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-400 transition text-sm resize-none"
                  />
                </div>

                {/* Location */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1">Location</label>
                  <input
                    type="text"
                    value={editField.location}
                    onChange={(e) => setEditField((p) => ({ ...p, location: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-400 transition text-sm"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1">
                    Phone <span className="font-normal normal-case text-gray-400">(optional)</span>
                  </label>
                  <input
                    type="tel"
                    value={editField.contact_phone}
                    onChange={(e) => setEditField((p) => ({ ...p, contact_phone: e.target.value }))}
                    placeholder="+91 98765 43210"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-400 transition text-sm"
                  />
                </div>
              </div>

              {/* Footer buttons */}
              <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
                <button
                  onClick={() => setEditCat(null)}
                  className="flex-1 border border-gray-200 text-gray-600 hover:bg-gray-50 py-3 rounded-xl font-semibold text-sm transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveCat}
                  disabled={savingCat}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white py-3 rounded-xl font-semibold text-sm transition"
                >
                  {savingCat ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full text-center">
            <div className="text-5xl mb-4">🗑️</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Report?</h3>
            <p className="text-gray-500 text-sm mb-6">
              Are you sure you want to delete the report for <strong>{deleteId.name}</strong>? This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} disabled={deleting} className="flex-1 border border-gray-200 text-gray-600 hover:bg-gray-50 py-3 rounded-xl font-semibold transition text-sm">
                Cancel
              </button>
              <button onClick={() => handleDelete(deleteId.id, deleteId.type)} disabled={deleting} className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white py-3 rounded-xl font-semibold transition text-sm">
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