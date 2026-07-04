// src/app/profile/page.js
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import ProtectedRoute from '@/components/ProtectedRoute'
import AIMatchButton from '@/components/AIMatchButton'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Edit3, Trash2, CheckCircle, MapPin, Phone, Mail, Calendar, Camera, X, Cat, PawPrint, Heart, Award } from 'lucide-react'

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

  // Edit cat states
  const [editCat,      setEditCat]      = useState(null)
  const [editField,    setEditField]    = useState({})
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

      if (editCat._type === 'lost') {
        updates.name = editField.name
      }

      const { error } = await supabase
        .from(table)
        .update(updates)
        .eq('id', editCat.id)
        .eq('user_id', user.id)

      if (error) throw error

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
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--cream)' }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
          className="w-12 h-12 border-4 rounded-full"
          style={{ borderColor: 'var(--gold)', borderTopColor: 'transparent' }}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6" style={{ background: 'var(--cream)' }}>
      {/* Decorative floating elements */}
      <div className="fixed top-32 right-8 text-2xl animate-float opacity-40 pointer-events-none hidden md:block">🐾</div>
      <div className="fixed bottom-40 left-8 text-xl animate-float-slow opacity-30 pointer-events-none hidden md:block" style={{ animationDelay: '1.5s' }}>✿</div>
      <div className="fixed top-60 left-12 text-lg animate-float opacity-25 pointer-events-none hidden lg:block" style={{ animationDelay: '0.8s' }}>🐱</div>

      <div className="max-w-4xl mx-auto">
        {/* ── Profile Header Card ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="organic-card p-6 sm:p-8 mb-8 relative overflow-hidden"
        >
          {/* Decorative corner accent */}
          <div className="absolute top-0 right-0 w-32 h-32 rounded-bl-full opacity-30" style={{ background: 'var(--gold-light)' }} />

          {profileMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="border text-sm px-4 py-3 rounded-2xl mb-5"
              style={{ background: '#f0fdf4', borderColor: '#bbf7d0', color: '#15803d' }}
            >
              {profileMsg}
            </motion.div>
          )}

          {!editMode ? (
            /* ── View Mode ── */
            <div className="relative z-10">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
                <div className="flex items-center gap-4">
                  <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-full flex items-center justify-center text-4xl shrink-0 shadow-lg blob-shape" style={{ background: 'var(--gold-light)' }}>
                    🐾
                  </div>
                  <div>
                    <h1 className="heading-artistic text-2xl sm:text-3xl" style={{ color: 'var(--police-blue)' }}>
                      {profile?.full_name || 'Cat Lover'}
                    </h1>
                    <div className="flex items-center gap-1.5 mt-1.5 text-sm opacity-70" style={{ color: 'var(--police-blue)' }}>
                      <Mail size={14} />
                      <span>{user?.email}</span>
                    </div>
                    {profile?.phone && (
                      <div className="flex items-center gap-1.5 mt-1 text-sm opacity-70" style={{ color: 'var(--police-blue)' }}>
                        <Phone size={14} />
                        <span>{profile.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 mt-1 text-xs opacity-50" style={{ color: 'var(--police-blue)' }}>
                      <Calendar size={12} />
                      <span>Member since {formatDate(user?.created_at)}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setEditMode(true)}
                  className="shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all hover:scale-105 shadow-sm"
                  style={{ background: 'var(--police-blue)', color: 'var(--gold-light)' }}
                >
                  <Edit3 size={15} />
                  Edit Profile
                </button>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-3 gap-3 sm:gap-6 mt-8 pt-6" style={{ borderTop: '1px solid var(--gold-light)' }}>
                <motion.div whileHover={{ scale: 1.05 }} className="text-center p-3 rounded-2xl transition" style={{ background: 'var(--sage-50)' }}>
                  <div className="text-2xl sm:text-3xl font-extrabold" style={{ color: 'var(--gold)' }}>{lostCats.length}</div>
                  <div className="text-xs mt-1 font-medium opacity-70" style={{ color: 'var(--police-blue)' }}>Lost Reports</div>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} className="text-center p-3 rounded-2xl transition" style={{ background: 'var(--sage-50)' }}>
                  <div className="text-2xl sm:text-3xl font-extrabold" style={{ color: '#16a34a' }}>{foundCats.length}</div>
                  <div className="text-xs mt-1 font-medium opacity-70" style={{ color: 'var(--police-blue)' }}>Found Reports</div>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} className="text-center p-3 rounded-2xl transition" style={{ background: 'var(--sage-50)' }}>
                  <div className="text-2xl sm:text-3xl font-extrabold" style={{ color: '#9333ea' }}>
                    {lostCats.filter((c) => c.status === 'reunited').length}
                  </div>
                  <div className="text-xs mt-1 font-medium opacity-70" style={{ color: 'var(--police-blue)' }}>Reunited 🎉</div>
                </motion.div>
              </div>
            </div>
          ) : (

            /* ── Edit Mode ── */
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative z-10">
              <h2 className="heading-artistic text-xl mb-5" style={{ color: 'var(--police-blue)' }}>Edit Profile</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--police-blue)', opacity: 0.6 }}>Full Name</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Your full name"
                    className="w-full px-4 py-3 rounded-2xl border-2 focus:outline-none transition text-sm"
                    style={{ borderColor: 'var(--gold-light)', background: 'var(--sage-50)' }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--police-blue)', opacity: 0.6 }}>
                    Phone <span className="font-normal normal-case opacity-60">(optional)</span>
                  </label>
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-4 py-3 rounded-2xl border-2 focus:outline-none transition text-sm"
                    style={{ borderColor: 'var(--gold-light)', background: 'var(--sage-50)' }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--police-blue)', opacity: 0.6 }}>Email</label>
                  <input
                    type="email"
                    value={user?.email}
                    disabled
                    className="w-full px-4 py-3 rounded-2xl border-2 text-sm opacity-50 cursor-not-allowed"
                    style={{ borderColor: 'var(--gold-light)', background: 'var(--sage-50)' }}
                  />
                  <p className="text-xs mt-1 opacity-50" style={{ color: 'var(--police-blue)' }}>Email cannot be changed</p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => { setEditMode(false); setEditName(profile?.full_name || ''); setEditPhone(profile?.phone || '') }}
                  className="flex-1 py-3 rounded-full font-semibold text-sm transition border-2 hover:opacity-80"
                  style={{ borderColor: 'var(--police-blue)', color: 'var(--police-blue)' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveProfile}
                  disabled={savingProfile}
                  className="flex-1 py-3 rounded-full font-semibold text-sm transition hover:scale-[1.02] disabled:opacity-50"
                  style={{ background: 'var(--police-blue)', color: 'var(--gold-light)' }}
                >
                  {savingProfile ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="border text-sm px-4 py-3 rounded-2xl mb-5"
              style={{ background: '#fef2f2', borderColor: '#fecaca', color: '#dc2626' }}
            >
              ⚠️ {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Tabs ── */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="flex gap-3 mb-6"
        >
          <button
            onClick={() => setActiveTab('lost')}
            className={`flex-1 py-3.5 rounded-full font-semibold text-sm transition-all ${activeTab === 'lost' ? 'shadow-lg scale-[1.02]' : 'hover:opacity-80'}`}
            style={activeTab === 'lost'
              ? { background: 'var(--gold)', color: 'white' }
              : { background: 'white', color: 'var(--police-blue)', border: '2px solid var(--gold-light)' }
            }
          >
            😿 Lost Cats ({lostCats.length})
          </button>
          <button
            onClick={() => setActiveTab('found')}
            className={`flex-1 py-3.5 rounded-full font-semibold text-sm transition-all ${activeTab === 'found' ? 'shadow-lg scale-[1.02]' : 'hover:opacity-80'}`}
            style={activeTab === 'found'
              ? { background: '#16a34a', color: 'white' }
              : { background: 'white', color: 'var(--police-blue)', border: '2px solid #bbf7d0' }
            }
          >
            😊 Found Cats ({foundCats.length})
          </button>
        </motion.div>

        {/* ── Lost Cats Tab ── */}
        {activeTab === 'lost' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="space-y-5"
          >
            {lostCats.length === 0 ? (
              <div className="organic-card text-center py-16 px-6">
                <div className="text-6xl mb-4 animate-float">🐾</div>
                <p className="heading-artistic text-lg mb-2" style={{ color: 'var(--police-blue)' }}>No lost cat reports yet</p>
                <p className="text-sm mb-6 opacity-60" style={{ color: 'var(--police-blue)' }}>We hope you never need to use this!</p>
                <Link
                  href="/report"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-sm transition hover:scale-105"
                  style={{ background: 'var(--gold)', color: 'white' }}
                >
                  Report a Lost Cat
                </Link>
              </div>
            ) : lostCats.map((cat, idx) => (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.08 }}
                className="organic-card p-5 sm:p-6"
              >
                <div className="flex gap-4">
                  {cat.image_url ? (
                    <img src={cat.image_url} alt={cat.name} className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover shrink-0 shadow-md" />
                  ) : (
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl flex items-center justify-center text-4xl shrink-0 shadow-inner" style={{ background: 'var(--gold-light)' }}>🐱</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="heading-artistic text-lg" style={{ color: 'var(--police-blue)' }}>{cat.name}</h3>
                      <span
                        className="text-xs px-3 py-1 rounded-full font-semibold shrink-0"
                        style={cat.status === 'reunited'
                          ? { background: '#dcfce7', color: '#16a34a' }
                          : { background: '#fef3c7', color: '#d97706' }
                        }
                      >
                        {cat.status === 'reunited' ? '🎉 Reunited' : '😿 Lost'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 mt-1.5">
                      <MapPin size={13} style={{ color: 'var(--gold)' }} />
                      <span className="text-sm font-medium" style={{ color: 'var(--gold)' }}>{cat.location}</span>
                    </div>
                    <p className="text-sm mt-1.5 line-clamp-2 opacity-70" style={{ color: 'var(--police-blue)' }}>{cat.description}</p>
                    <p className="text-xs mt-2 opacity-40" style={{ color: 'var(--police-blue)' }}>Reported {formatDate(cat.created_at)}</p>
                  </div>
                </div>

                <div className="flex gap-2 mt-4 pt-4 flex-wrap" style={{ borderTop: '1px solid var(--gold-light)' }}>
                  {cat.status !== 'reunited' && (
                    <button
                      onClick={() => handleMarkReunited(cat.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 border-2 text-xs font-semibold py-2.5 rounded-full transition hover:scale-[1.02]"
                      style={{ borderColor: '#86efac', color: '#16a34a' }}
                    >
                      <CheckCircle size={14} /> Mark Reunited
                    </button>
                  )}
                  <button
                    onClick={() => handleOpenEditCat(cat, 'lost')}
                    className="flex-1 flex items-center justify-center gap-1.5 border-2 text-xs font-semibold py-2.5 rounded-full transition hover:scale-[1.02]"
                    style={{ borderColor: 'var(--gold-light)', color: 'var(--police-blue)' }}
                  >
                    <Edit3 size={14} /> Edit
                  </button>
                  <button
                    onClick={() => setDeleteId({ id: cat.id, type: 'lost', name: cat.name })}
                    className="flex-1 flex items-center justify-center gap-1.5 border-2 text-xs font-semibold py-2.5 rounded-full transition hover:scale-[1.02]"
                    style={{ borderColor: '#fecaca', color: '#dc2626' }}
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </div>

                {cat.status !== 'reunited' && (
                  <div className="mt-3">
                    <AIMatchButton lostCat={cat} />
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* ── Found Cats Tab ── */}
        {activeTab === 'found' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="space-y-5"
          >
            {foundCats.length === 0 ? (
              <div className="organic-card text-center py-16 px-6">
                <div className="text-6xl mb-4 animate-float">🐾</div>
                <p className="heading-artistic text-lg mb-2" style={{ color: 'var(--police-blue)' }}>No found cat reports yet</p>
                <p className="text-sm mb-6 opacity-60" style={{ color: 'var(--police-blue)' }}>Spotted a stray? Help them find home.</p>
                <Link
                  href="/report"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-sm transition hover:scale-105"
                  style={{ background: '#16a34a', color: 'white' }}
                >
                  Report a Found Cat
                </Link>
              </div>
            ) : foundCats.map((cat, idx) => (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.08 }}
                className="organic-card p-5 sm:p-6"
              >
                <div className="flex gap-4">
                  {cat.image_url ? (
                    <img src={cat.image_url} alt="Found cat" className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover shrink-0 shadow-md" />
                  ) : (
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl flex items-center justify-center text-4xl shrink-0 shadow-inner" style={{ background: '#dcfce7' }}>🐱</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="heading-artistic text-lg" style={{ color: 'var(--police-blue)' }}>Found Cat</h3>
                      <span
                        className="text-xs px-3 py-1 rounded-full font-semibold shrink-0"
                        style={cat.status === 'resolved'
                          ? { background: '#dbeafe', color: '#2563eb' }
                          : { background: '#dcfce7', color: '#16a34a' }
                        }
                      >
                        {cat.status === 'resolved' ? '✅ Resolved' : '😊 Found'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 mt-1.5">
                      <MapPin size={13} style={{ color: '#16a34a' }} />
                      <span className="text-sm font-medium" style={{ color: '#16a34a' }}>{cat.location}</span>
                    </div>
                    <p className="text-sm mt-1.5 line-clamp-2 opacity-70" style={{ color: 'var(--police-blue)' }}>{cat.description}</p>
                    <p className="text-xs mt-2 opacity-40" style={{ color: 'var(--police-blue)' }}>Reported {formatDate(cat.created_at)}</p>
                  </div>
                </div>

                <div className="flex gap-2 mt-4 pt-4 flex-wrap" style={{ borderTop: '1px solid #dcfce7' }}>
                  {cat.status !== 'resolved' && (
                    <button
                      onClick={() => handleMarkResolved(cat.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 border-2 text-xs font-semibold py-2.5 rounded-full transition hover:scale-[1.02]"
                      style={{ borderColor: '#93c5fd', color: '#2563eb' }}
                    >
                      <CheckCircle size={14} /> Mark Resolved
                    </button>
                  )}
                  <button
                    onClick={() => handleOpenEditCat(cat, 'found')}
                    className="flex-1 flex items-center justify-center gap-1.5 border-2 text-xs font-semibold py-2.5 rounded-full transition hover:scale-[1.02]"
                    style={{ borderColor: 'var(--gold-light)', color: 'var(--police-blue)' }}
                  >
                    <Edit3 size={14} /> Edit
                  </button>
                  <button
                    onClick={() => setDeleteId({ id: cat.id, type: 'found', name: 'this found cat' })}
                    className="flex-1 flex items-center justify-center gap-1.5 border-2 text-xs font-semibold py-2.5 rounded-full transition hover:scale-[1.02]"
                    style={{ borderColor: '#fecaca', color: '#dc2626' }}
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* ── Edit Cat Modal ── */}
      <AnimatePresence>
        {editCat && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center px-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25 }}
              className="w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden rounded-3xl shadow-2xl"
              style={{ background: 'var(--cream)' }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--gold-light)' }}>
                <h3 className="heading-artistic text-lg" style={{ color: 'var(--police-blue)' }}>Edit Report</h3>
                <button
                  onClick={() => setEditCat(null)}
                  className="w-8 h-8 rounded-full flex items-center justify-center transition hover:scale-110"
                  style={{ background: 'var(--gold-light)' }}
                >
                  <X size={16} style={{ color: 'var(--police-blue)' }} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
                {catEditMsg && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`text-sm px-4 py-2.5 rounded-2xl border ${catEditMsg.startsWith('✅') ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-600 border-red-200'}`}
                  >
                    {catEditMsg}
                  </motion.div>
                )}

                {/* Photo update */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--police-blue)', opacity: 0.6 }}>Photo</label>
                  {(newImagePreview || editCat.image_url) ? (
                    <div className="relative">
                      <img
                        src={newImagePreview || editCat.image_url}
                        alt="Cat"
                        className="w-full h-36 sm:h-44 object-cover rounded-2xl shadow-md"
                        style={{ border: '2px solid var(--gold-light)' }}
                      />
                      <label
                        className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-2 rounded-full shadow-lg text-xs font-semibold transition hover:scale-105"
                        style={{ background: 'var(--police-blue)', color: 'var(--gold-light)' }}
                      >
                        <Camera size={14} /> Change
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
                    <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed rounded-2xl transition hover:opacity-80" style={{ borderColor: 'var(--gold)', background: 'var(--sage-50)' }}>
                      <Camera size={28} style={{ color: 'var(--gold)' }} className="mb-2" />
                      <span className="text-sm font-medium" style={{ color: 'var(--gold)' }}>Add a photo</span>
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
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--police-blue)', opacity: 0.6 }}>Cat&apos;s Name</label>
                    <input
                      type="text"
                      value={editField.name}
                      onChange={(e) => setEditField((p) => ({ ...p, name: e.target.value }))}
                      className="w-full px-4 py-3 rounded-2xl border-2 focus:outline-none transition text-sm"
                      style={{ borderColor: 'var(--gold-light)', background: 'white' }}
                    />
                  </div>
                )}

                {/* Description */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--police-blue)', opacity: 0.6 }}>Description</label>
                  <textarea
                    value={editField.description}
                    onChange={(e) => setEditField((p) => ({ ...p, description: e.target.value }))}
                    rows={4}
                    className="w-full px-4 py-3 rounded-2xl border-2 focus:outline-none transition text-sm resize-none"
                    style={{ borderColor: 'var(--gold-light)', background: 'white' }}
                  />
                </div>

                {/* Location */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--police-blue)', opacity: 0.6 }}>Location</label>
                  <input
                    type="text"
                    value={editField.location}
                    onChange={(e) => setEditField((p) => ({ ...p, location: e.target.value }))}
                    className="w-full px-4 py-3 rounded-2xl border-2 focus:outline-none transition text-sm"
                    style={{ borderColor: 'var(--gold-light)', background: 'white' }}
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--police-blue)', opacity: 0.6 }}>
                    Phone <span className="font-normal normal-case opacity-60">(optional)</span>
                  </label>
                  <input
                    type="tel"
                    value={editField.contact_phone}
                    onChange={(e) => setEditField((p) => ({ ...p, contact_phone: e.target.value }))}
                    placeholder="+91 98765 43210"
                    className="w-full px-4 py-3 rounded-2xl border-2 focus:outline-none transition text-sm"
                    style={{ borderColor: 'var(--gold-light)', background: 'white' }}
                  />
                </div>
              </div>

              {/* Footer buttons */}
              <div className="px-6 py-4 flex gap-3" style={{ borderTop: '1px solid var(--gold-light)' }}>
                <button
                  onClick={() => setEditCat(null)}
                  className="flex-1 py-3 rounded-full font-semibold text-sm transition border-2 hover:opacity-80"
                  style={{ borderColor: 'var(--police-blue)', color: 'var(--police-blue)' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveCat}
                  disabled={savingCat}
                  className="flex-1 py-3 rounded-full font-semibold text-sm transition hover:scale-[1.02] disabled:opacity-50"
                  style={{ background: 'var(--police-blue)', color: 'var(--gold-light)' }}
                >
                  {savingCat ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Delete Confirmation Modal ── */}
      <AnimatePresence>
        {deleteId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center px-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', damping: 25 }}
              className="rounded-3xl shadow-2xl p-8 max-w-sm w-full text-center"
              style={{ background: 'var(--cream)' }}
            >
              <div className="text-5xl mb-4">🗑️</div>
              <h3 className="heading-artistic text-xl mb-2" style={{ color: 'var(--police-blue)' }}>Delete Report?</h3>
              <p className="text-sm mb-6 opacity-70" style={{ color: 'var(--police-blue)' }}>
                Are you sure you want to delete the report for <strong>{deleteId.name}</strong>? This cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteId(null)}
                  disabled={deleting}
                  className="flex-1 py-3 rounded-full font-semibold text-sm transition border-2 hover:opacity-80"
                  style={{ borderColor: 'var(--police-blue)', color: 'var(--police-blue)' }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteId.id, deleteId.type)}
                  disabled={deleting}
                  className="flex-1 py-3 rounded-full font-semibold text-sm transition hover:scale-[1.02] disabled:opacity-50"
                  style={{ background: '#dc2626', color: 'white' }}
                >
                  {deleting ? 'Deleting...' : 'Yes, Delete'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
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
