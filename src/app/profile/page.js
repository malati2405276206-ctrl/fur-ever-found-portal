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
import { Edit3, Trash2, CheckCircle, MapPin, Phone, Mail, Calendar, Camera, X } from 'lucide-react'

function ProfileContent() {
  const { user } = useAuth()
  const router = useRouter()

  const [profile, setProfile] = useState(null)
  const [lostCats, setLostCats] = useState([])
  const [foundCats, setFoundCats] = useState([])
  const [activeTab, setActiveTab] = useState('lost')
  const [loading, setLoading] = useState(true)
  const [deleteId, setDeleteId] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  // Edit profile states
  const [editMode, setEditMode] = useState(false)
  const [editName, setEditName] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileMsg, setProfileMsg] = useState('')
  const [editAvatar, setEditAvatar] = useState(null)
  const [editAvatarPreview, setEditAvatarPreview] = useState(null)

  // Edit cat states
  const [editCat, setEditCat] = useState(null)
  const [editField, setEditField] = useState({})
  const [savingCat, setSavingCat] = useState(false)
  const [catEditMsg, setCatEditMsg] = useState('')
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
      name: cat.name || '',
      description: cat.description || '',
      location: cat.location || '',
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
        const fileExt = newImageFile.name.split('.').pop().toLowerCase()
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

      const table = editCat._type === 'lost' ? 'lost_cats' : 'found_cats'
      const updates = {
        description: editField.description,
        location: editField.location,
        contact_phone: editField.contact_phone || null,
        image_url: imageUrl,
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

    let avatarUrl = profile?.avatar_url || null

    if (editAvatar) {
      const fileExt = editAvatar.name.split('.').pop().toLowerCase()
      const fileName = `avatar_${user.id}_${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('cat-images')
        .upload(fileName, editAvatar)

      if (!uploadError) {
        const { data: urlData } = supabase.storage
          .from('cat-images')
          .getPublicUrl(fileName)
        avatarUrl = urlData.publicUrl
      }
    }

    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        full_name: editName.trim(),
        phone: editPhone.trim() || null,
        avatar_url: avatarUrl,
      })

    if (error) {
      setProfileMsg('Failed to save. Please try again.')
    } else {
      setProfileMsg('✅ Profile updated!')
      setProfile((prev) => ({ ...prev, full_name: editName, phone: editPhone, avatar_url: avatarUrl }))
      setEditMode(false)
      setEditAvatar(null)
      setEditAvatarPreview(null)
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
    <div className="min-h-screen pb-12 pt-8" style={{ background: '#f4f5f7' }}>
      {/* ── Profile Content ── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center"
        >
          <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full border-4 border-white shadow-xl overflow-hidden bg-white">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center" style={{ background: 'var(--gold-light)' }}>
                <img src="/icon-emoji/cat-paw.png" alt="" width={60} height={60} />
              </div>
            )}
          </div>

          {/* ── Name Card ── */}
          <div className="mt-4 w-full rounded-3xl bg-white border shadow-sm p-6 text-center"
            style={{ borderColor: '#e8e8e8' }}>
            {profileMsg && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="border text-sm px-4 py-3 rounded-2xl mb-4"
                style={{ background: '#f0fdf4', borderColor: '#bbf7d0', color: '#15803d' }}
              >
                {profileMsg}
              </motion.div>
            )}

            <h1 className="heading-artistic text-2xl sm:text-3xl" style={{ color: 'var(--police-blue)' }}>
              {profile?.full_name || 'Cat Lover'}
            </h1>

            <div className="mt-3 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 text-sm"
              style={{ color: 'var(--police-blue)' }}>
              <span className="flex items-center gap-1.5 opacity-70">
                <Mail size={14} /> {user?.email}
              </span>
              {profile?.phone && (
                <span className="flex items-center gap-1.5 opacity-70">
                  <Phone size={14} /> {profile.phone}
                </span>
              )}
            </div>

            <div className="flex items-center justify-center gap-1.5 mt-2 text-xs opacity-50"
              style={{ color: 'var(--police-blue)' }}>
              <Calendar size={12} />
              <span>Member since {formatDate(user?.created_at)}</span>
            </div>

            <button
              onClick={() => setEditMode(true)}
              className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all hover:scale-105 shadow-sm"
              style={{ background: 'var(--police-blue)', color: 'var(--gold-light)' }}
            >
              <Edit3 size={15} /> Edit Profile
            </button>
          </div>
        </motion.div>

        {/* ── Two-Column Info Cards (About & Stats) ── */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6"
        >
          {/* About Card */}
          <div className="rounded-3xl bg-white border p-5" style={{ borderColor: '#e8e8e8' }}>
            <div className="flex items-center gap-2 mb-3">
              <img src="/icon-emoji/cat-face.png" alt="" width={24} height={24} />
              <h2 className="heading-artistic text-base" style={{ color: 'var(--police-blue)' }}>About</h2>
            </div>
            <div className="space-y-2 text-sm" style={{ color: 'var(--police-blue)' }}>
              <p><span className="font-semibold">Email:</span> {user?.email}</p>
              {profile?.phone && <p><span className="font-semibold">Phone:</span> {profile.phone}</p>}
              <p><span className="font-semibold">Name:</span> {profile?.full_name || 'Not set'}</p>
              <p className="opacity-60 text-xs">Last Active: {formatDate(new Date().toISOString())}</p>
            </div>
          </div>

          {/* Stats/Badges Card */}
          <div className="rounded-3xl bg-white border p-5" style={{ borderColor: '#e8e8e8' }}>
            <div className="flex items-center gap-2 mb-3">
              <img src="/icon-emoji/paw-heart.png" alt="" width={24} height={24} />
              <h2 className="heading-artistic text-base" style={{ color: 'var(--police-blue)' }}>Activity</h2>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-2xl p-3" style={{ background: '#fef9ee' }}>
                <div className="text-xl font-extrabold" style={{ color: 'var(--gold)' }}>{lostCats.length}</div>
                <div className="text-[10px] mt-0.5 font-medium opacity-70" style={{ color: 'var(--police-blue)' }}>Lost</div>
              </div>
              <div className="rounded-2xl p-3" style={{ background: '#f0fdf4' }}>
                <div className="text-xl font-extrabold" style={{ color: '#16a34a' }}>{foundCats.length}</div>
                <div className="text-[10px] mt-0.5 font-medium opacity-70" style={{ color: 'var(--police-blue)' }}>Found</div>
              </div>
              <div className="rounded-2xl p-3" style={{ background: '#faf5ff' }}>
                <div className="text-xl font-extrabold" style={{ color: '#9333ea' }}>
                  {lostCats.filter((c) => c.status === 'reunited').length}
                </div>
                <div className="text-[10px] mt-0.5 font-medium opacity-70" style={{ color: 'var(--police-blue)' }}>Reunited</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Reports Section (Ranking-style layout) ── */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          className="mt-6 rounded-3xl bg-white border p-5 sm:p-6"
          style={{ borderColor: '#e8e8e8' }}
        >
          {/* Tab Buttons */}
          <div className="flex gap-3 mb-5">
            <button
              onClick={() => setActiveTab('lost')}
              className={`flex-1 py-3 rounded-full font-semibold text-sm transition-all ${activeTab === 'lost' ? 'shadow-md scale-[1.02]' : 'hover:opacity-80'}`}
              style={activeTab === 'lost'
                ? { background: 'var(--gold)', color: 'white' }
                : { background: '#f9f9f9', color: 'var(--police-blue)', border: '1.5px solid #e8e8e8' }
              }
            >
              <img src="/icon-emoji/lost-cat.png" alt="" width={22} height={22} className="inline-block mr-1 -mt-0.5" />
              Lost ({lostCats.length})
            </button>
            <button
              onClick={() => setActiveTab('found')}
              className={`flex-1 py-3 rounded-full font-semibold text-sm transition-all ${activeTab === 'found' ? 'shadow-md scale-[1.02]' : 'hover:opacity-80'}`}
              style={activeTab === 'found'
                ? { background: '#16a34a', color: 'white' }
                : { background: '#f9f9f9', color: 'var(--police-blue)', border: '1.5px solid #e8e8e8' }
              }
            >
              <img src="/icon-emoji/found-cat.png" alt="" width={22} height={22} className="inline-block mr-1 -mt-0.5" />
              Found ({foundCats.length})
            </button>
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="border text-sm px-4 py-3 rounded-2xl mb-4"
                style={{ background: '#fef2f2', borderColor: '#fecaca', color: '#dc2626' }}
              >
                ⚠️ {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Lost Cats List ── */}
          {activeTab === 'lost' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
              {lostCats.length === 0 ? (
                <div className="text-center py-12 px-6">
                  <div className="mb-3 animate-float">
                    <img src="/icon-emoji/cat-paw.png" alt="" width={50} height={50} className="inline-block" />
                  </div>
                  <p className="heading-artistic text-base mb-1" style={{ color: 'var(--police-blue)' }}>No lost cat reports yet</p>
                  <p className="text-sm mb-5 opacity-60" style={{ color: 'var(--police-blue)' }}>We hope you never need to use this!</p>
                  <Link href="/report"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm transition hover:scale-105"
                    style={{ background: 'var(--gold)', color: 'white' }}>
                    Report a Lost Cat
                  </Link>
                </div>
              ) : lostCats.map((cat, idx) => (
                <motion.div
                  key={cat.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.05 }}
                  className="flex items-center gap-3 p-3 rounded-2xl border transition hover:shadow-sm"
                  style={{ borderColor: '#f0f0f0', background: '#fafafa' }}
                >
                  {/* Rank-style number */}
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                    style={{ background: 'var(--gold-light)', color: 'var(--police-blue)' }}>
                    #{idx + 1}
                  </div>

                  {/* Cat image */}
                  {cat.image_url ? (
                    <img src={cat.image_url} alt={cat.name} className="w-12 h-12 rounded-xl object-cover shrink-0 shadow-sm" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: 'var(--gold-light)' }}>
                      <img src="/icon-emoji/cat-face.png" alt="" width={28} height={28} />
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold truncate" style={{ color: 'var(--police-blue)' }}>{cat.name}</h3>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold shrink-0"
                        style={cat.status === 'reunited'
                          ? { background: '#dcfce7', color: '#16a34a' }
                          : { background: '#fef3c7', color: '#d97706' }
                        }>
                        {cat.status === 'reunited' ? 'Reunited' : 'Lost'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <MapPin size={11} style={{ color: 'var(--gold)' }} />
                      <span className="text-xs truncate" style={{ color: 'var(--gold)' }}>{cat.location}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {cat.status !== 'reunited' && (
                      <button onClick={() => handleMarkReunited(cat.id)}
                        className="w-7 h-7 rounded-full flex items-center justify-center transition hover:scale-110"
                        style={{ background: '#dcfce7' }} title="Mark Reunited">
                        <CheckCircle size={14} style={{ color: '#16a34a' }} />
                      </button>
                    )}
                    <button onClick={() => handleOpenEditCat(cat, 'lost')}
                      className="w-7 h-7 rounded-full flex items-center justify-center transition hover:scale-110"
                      style={{ background: '#f3f4f6' }} title="Edit">
                      <Edit3 size={13} style={{ color: 'var(--police-blue)' }} />
                    </button>
                    <button onClick={() => setDeleteId({ id: cat.id, type: 'lost', name: cat.name })}
                      className="w-7 h-7 rounded-full flex items-center justify-center transition hover:scale-110"
                      style={{ background: '#fef2f2' }} title="Delete">
                      <Trash2 size={13} style={{ color: '#dc2626' }} />
                    </button>
                  </div>
                </motion.div>
              ))}

              {/* AI Match Buttons for lost cats */}
              {lostCats.filter(c => c.status !== 'reunited').map((cat) => (
                <div key={`ai-${cat.id}`} className="mt-1">
                  <AIMatchButton lostCat={cat} />
                </div>
              ))}
            </motion.div>
          )}

          {/* ── Found Cats List ── */}
          {activeTab === 'found' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
              {foundCats.length === 0 ? (
                <div className="text-center py-12 px-6">
                  <div className="mb-3 animate-float">
                    <img src="/icon-emoji/cat-paw.png" alt="" width={50} height={50} className="inline-block" />
                  </div>
                  <p className="heading-artistic text-base mb-1" style={{ color: 'var(--police-blue)' }}>No found cat reports yet</p>
                  <p className="text-sm mb-5 opacity-60" style={{ color: 'var(--police-blue)' }}>Spotted a stray? Help them find home.</p>
                  <Link href="/report"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm transition hover:scale-105"
                    style={{ background: '#16a34a', color: 'white' }}>
                    Report a Found Cat
                  </Link>
                </div>
              ) : foundCats.map((cat, idx) => (
                <motion.div
                  key={cat.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.05 }}
                  className="flex items-center gap-3 p-3 rounded-2xl border transition hover:shadow-sm"
                  style={{ borderColor: '#f0f0f0', background: '#fafafa' }}
                >
                  {/* Rank-style number */}
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                    style={{ background: '#dcfce7', color: '#16a34a' }}>
                    #{idx + 1}
                  </div>

                  {/* Cat image */}
                  {cat.image_url ? (
                    <img src={cat.image_url} alt="Found cat" className="w-12 h-12 rounded-xl object-cover shrink-0 shadow-sm" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: '#dcfce7' }}>
                      <img src="/icon-emoji/cat-face.png" alt="" width={28} height={28} />
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold truncate" style={{ color: 'var(--police-blue)' }}>Found Cat</h3>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold shrink-0"
                        style={cat.status === 'resolved'
                          ? { background: '#dbeafe', color: '#2563eb' }
                          : { background: '#dcfce7', color: '#16a34a' }
                        }>
                        {cat.status === 'resolved' ? 'Resolved' : 'Found'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <MapPin size={11} style={{ color: '#16a34a' }} />
                      <span className="text-xs truncate" style={{ color: '#16a34a' }}>{cat.location}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {cat.status !== 'resolved' && (
                      <button onClick={() => handleMarkResolved(cat.id)}
                        className="w-7 h-7 rounded-full flex items-center justify-center transition hover:scale-110"
                        style={{ background: '#dbeafe' }} title="Mark Resolved">
                        <CheckCircle size={14} style={{ color: '#2563eb' }} />
                      </button>
                    )}
                    <button onClick={() => handleOpenEditCat(cat, 'found')}
                      className="w-7 h-7 rounded-full flex items-center justify-center transition hover:scale-110"
                      style={{ background: '#f3f4f6' }} title="Edit">
                      <Edit3 size={13} style={{ color: 'var(--police-blue)' }} />
                    </button>
                    <button onClick={() => setDeleteId({ id: cat.id, type: 'found', name: 'this found cat' })}
                      className="w-7 h-7 rounded-full flex items-center justify-center transition hover:scale-110"
                      style={{ background: '#fef2f2' }} title="Delete">
                      <Trash2 size={13} style={{ color: '#dc2626' }} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* ── Edit Profile Modal ── */}
      <AnimatePresence>
        {editMode && (
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
              className="w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden rounded-3xl shadow-2xl bg-white"
            >
              <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #e8e8e8' }}>
                <h3 className="heading-artistic text-lg" style={{ color: 'var(--police-blue)' }}>Edit Profile</h3>
                <button onClick={() => { setEditMode(false); setEditName(profile?.full_name || ''); setEditPhone(profile?.phone || '') }}
                  className="w-8 h-8 rounded-full flex items-center justify-center transition hover:scale-110"
                  style={{ background: '#f3f4f6' }}>
                  <X size={16} style={{ color: 'var(--police-blue)' }} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
                {/* Photo upload */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-2">Profile Photo</label>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center shrink-0">
                      {(editAvatarPreview || profile?.avatar_url) ? (
                        <img src={editAvatarPreview || profile?.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <img src="/icon-emoji/cat-paw.png" alt="" width={40} height={40} />
                      )}
                    </div>
                    <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-600 px-4 py-2 rounded-xl text-sm font-medium transition">
                      Upload Photo
                      <input type="file" accept="image/*" className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0]
                          if (!f) return
                          setEditAvatar(f)
                          setEditAvatarPreview(URL.createObjectURL(f))
                        }}
                      />
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--police-blue)', opacity: 0.6 }}>Full Name</label>
                  <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)}
                    placeholder="Your full name"
                    className="w-full px-4 py-3 rounded-2xl border-2 focus:outline-none transition text-sm"
                    style={{ borderColor: '#e8e8e8', background: '#f9f9f9' }} />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--police-blue)', opacity: 0.6 }}>
                    Phone <span className="font-normal normal-case opacity-60">(optional)</span>
                  </label>
                  <input type="tel" value={editPhone} onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-4 py-3 rounded-2xl border-2 focus:outline-none transition text-sm"
                    style={{ borderColor: '#e8e8e8', background: '#f9f9f9' }} />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--police-blue)', opacity: 0.6 }}>Email</label>
                  <input type="email" value={user?.email} disabled
                    className="w-full px-4 py-3 rounded-2xl border-2 text-sm opacity-50 cursor-not-allowed"
                    style={{ borderColor: '#e8e8e8', background: '#f9f9f9' }} />
                  <p className="text-xs mt-1 opacity-50" style={{ color: 'var(--police-blue)' }}>Email cannot be changed</p>
                </div>
              </div>

              <div className="px-6 py-4 flex gap-3" style={{ borderTop: '1px solid #e8e8e8' }}>
                <button
                  onClick={() => { setEditMode(false); setEditName(profile?.full_name || ''); setEditPhone(profile?.phone || '') }}
                  className="flex-1 py-3 rounded-full font-semibold text-sm transition border-2 hover:opacity-80"
                  style={{ borderColor: 'var(--police-blue)', color: 'var(--police-blue)' }}>
                  Cancel
                </button>
                <button onClick={handleSaveProfile} disabled={savingProfile}
                  className="flex-1 py-3 rounded-full font-semibold text-sm transition hover:scale-[1.02] disabled:opacity-50"
                  style={{ background: 'var(--police-blue)', color: 'var(--gold-light)' }}>
                  {savingProfile ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
              className="w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden rounded-3xl shadow-2xl bg-white"
            >
              <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #e8e8e8' }}>
                <h3 className="heading-artistic text-lg" style={{ color: 'var(--police-blue)' }}>Edit Report</h3>
                <button onClick={() => setEditCat(null)}
                  className="w-8 h-8 rounded-full flex items-center justify-center transition hover:scale-110"
                  style={{ background: '#f3f4f6' }}>
                  <X size={16} style={{ color: 'var(--police-blue)' }} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
                {catEditMsg && (
                  <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                    className={`text-sm px-4 py-2.5 rounded-2xl border ${catEditMsg.startsWith('✅') ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                    {catEditMsg}
                  </motion.div>
                )}

                {/* Photo update */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--police-blue)', opacity: 0.6 }}>Photo</label>
                  {(newImagePreview || editCat.image_url) ? (
                    <div className="relative">
                      <img src={newImagePreview || editCat.image_url} alt="Cat"
                        className="w-full h-36 sm:h-44 object-cover rounded-2xl shadow-md"
                        style={{ border: '2px solid #e8e8e8' }} />
                      <label className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-2 rounded-full shadow-lg text-xs font-semibold transition hover:scale-105"
                        style={{ background: 'var(--police-blue)', color: 'var(--gold-light)' }}>
                        <Camera size={14} /> Change
                        <input type="file" accept="image/*" className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (!file) return
                            setNewImageFile(file)
                            setNewImagePreview(URL.createObjectURL(file))
                          }} />
                      </label>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed rounded-2xl transition hover:opacity-80"
                      style={{ borderColor: 'var(--gold)', background: '#f9f9f9' }}>
                      <Camera size={28} style={{ color: 'var(--gold)' }} className="mb-2" />
                      <span className="text-sm font-medium" style={{ color: 'var(--gold)' }}>Add a photo</span>
                      <input type="file" accept="image/*" className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (!file) return
                          setNewImageFile(file)
                          setNewImagePreview(URL.createObjectURL(file))
                        }} />
                    </label>
                  )}
                </div>

                {/* Name — lost cats only */}
                {editCat._type === 'lost' && (
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--police-blue)', opacity: 0.6 }}>Cat&apos;s Name</label>
                    <input type="text" value={editField.name}
                      onChange={(e) => setEditField((p) => ({ ...p, name: e.target.value }))}
                      className="w-full px-4 py-3 rounded-2xl border-2 focus:outline-none transition text-sm"
                      style={{ borderColor: '#e8e8e8', background: '#f9f9f9' }} />
                  </div>
                )}

                {/* Description */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--police-blue)', opacity: 0.6 }}>Description</label>
                  <textarea value={editField.description}
                    onChange={(e) => setEditField((p) => ({ ...p, description: e.target.value }))}
                    rows={4}
                    className="w-full px-4 py-3 rounded-2xl border-2 focus:outline-none transition text-sm resize-none"
                    style={{ borderColor: '#e8e8e8', background: '#f9f9f9' }} />
                </div>

                {/* Location */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--police-blue)', opacity: 0.6 }}>Location</label>
                  <input type="text" value={editField.location}
                    onChange={(e) => setEditField((p) => ({ ...p, location: e.target.value }))}
                    className="w-full px-4 py-3 rounded-2xl border-2 focus:outline-none transition text-sm"
                    style={{ borderColor: '#e8e8e8', background: '#f9f9f9' }} />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--police-blue)', opacity: 0.6 }}>
                    Phone <span className="font-normal normal-case opacity-60">(optional)</span>
                  </label>
                  <input type="tel" value={editField.contact_phone}
                    onChange={(e) => setEditField((p) => ({ ...p, contact_phone: e.target.value }))}
                    placeholder="+91 98765 43210"
                    className="w-full px-4 py-3 rounded-2xl border-2 focus:outline-none transition text-sm"
                    style={{ borderColor: '#e8e8e8', background: '#f9f9f9' }} />
                </div>
              </div>

              {/* Footer buttons */}
              <div className="px-6 py-4 flex gap-3" style={{ borderTop: '1px solid #e8e8e8' }}>
                <button onClick={() => setEditCat(null)}
                  className="flex-1 py-3 rounded-full font-semibold text-sm transition border-2 hover:opacity-80"
                  style={{ borderColor: 'var(--police-blue)', color: 'var(--police-blue)' }}>
                  Cancel
                </button>
                <button onClick={handleSaveCat} disabled={savingCat}
                  className="flex-1 py-3 rounded-full font-semibold text-sm transition hover:scale-[1.02] disabled:opacity-50"
                  style={{ background: 'var(--police-blue)', color: 'var(--gold-light)' }}>
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
              className="rounded-3xl shadow-2xl p-8 max-w-sm w-full text-center bg-white"
            >
              <div className="text-5xl mb-4">🗑️</div>
              <h3 className="heading-artistic text-xl mb-2" style={{ color: 'var(--police-blue)' }}>Delete Report?</h3>
              <p className="text-sm mb-6 opacity-70" style={{ color: 'var(--police-blue)' }}>
                Are you sure you want to delete the report for <strong>{deleteId.name}</strong>? This cannot be undone.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteId(null)} disabled={deleting}
                  className="flex-1 py-3 rounded-full font-semibold text-sm transition border-2 hover:opacity-80"
                  style={{ borderColor: 'var(--police-blue)', color: 'var(--police-blue)' }}>
                  Cancel
                </button>
                <button onClick={() => handleDelete(deleteId.id, deleteId.type)} disabled={deleting}
                  className="flex-1 py-3 rounded-full font-semibold text-sm transition hover:scale-[1.02] disabled:opacity-50"
                  style={{ background: '#dc2626', color: 'white' }}>
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
