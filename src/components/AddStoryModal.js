// src/components/AddStoryModal.js
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { X, BookOpen } from 'lucide-react'

export default function AddStoryModal({ isOpen, onClose, onStoryAdded, currentUserId }) {
  const [adoptedCats, setAdoptedCats] = useState([])
  const [selectedCat, setSelectedCat] = useState(null)
  const [storyline, setStoryline] = useState('')
  const [loadingCats, setLoadingCats] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen) fetchAdoptedCats()
  }, [isOpen])

  const fetchAdoptedCats = async () => {
    setLoadingCats(true)
    const { data, error } = await supabase
      .from('adoption_cats')
      .select('*')
      .eq('ngo_id', currentUserId)
      .eq('status', 'adopted')
      .order('adopted_at', { ascending: false })

    if (!error) setAdoptedCats(data || [])
    setLoadingCats(false)
  }

  const handleSelectCat = (cat) => {
    setSelectedCat(cat)
    setStoryline(cat.storyline || '')
    setError('')
  }

  const handleSave = async () => {
    if (!selectedCat || !storyline.trim()) {
      setError('Please write the rescue story before saving.')
      return
    }

    setSaving(true)
    setError('')

    const { error: updateError } = await supabase
      .from('adoption_cats')
      .update({ storyline: storyline.trim() })
      .eq('id', selectedCat.id)
      .eq('ngo_id', currentUserId)

    if (updateError) {
      setError('Failed to save. Please try again.')
      setSaving(false)
      return
    }

    setSaving(false)
    onStoryAdded()
    handleClose()
  }

  const handleClose = () => {
    setSelectedCat(null)
    setStoryline('')
    setError('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[85vh] flex flex-col overflow-hidden">

        <div className="flex items-center justify-between px-6 py-4 border-b border-amber-100 bg-amber-50">
          <div className="flex items-center gap-2">
            <BookOpen size={18} className="text-amber-600" />
            <h2 className="font-bold text-gray-900 text-sm">Add a New Page</h2>
          </div>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 transition">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">

          {!selectedCat ? (
            <>
              <p className="text-xs text-gray-400 mb-4">Pick one of your adopted cats to write or edit their rescue story.</p>

              {loadingCats && (
                <div className="flex items-center justify-center py-10">
                  <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              {!loadingCats && adoptedCats.length === 0 && (
                <div className="text-center py-10 text-gray-400 text-sm">
                  <div className="text-3xl mb-2">🐾</div>
                  No adopted cats yet. Mark a cat as adopted from your dashboard first.
                </div>
              )}

              <div className="space-y-2">
                {adoptedCats.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleSelectCat(cat)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-amber-300 hover:bg-amber-50 transition text-left"
                  >
                    {cat.image_url ? (
                      <img src={cat.image_url} alt={cat.name} className="w-12 h-12 rounded-lg object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center text-xl">🐱</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 text-sm">{cat.name}</p>
                      <p className="text-xs text-gray-400 line-clamp-1">{cat.storyline ? 'Story written — tap to edit' : 'No story yet'}</p>
                    </div>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <button onClick={() => setSelectedCat(null)} className="text-xs text-gray-400 hover:text-gray-600 mb-4 transition">
                ← Choose a different cat
              </button>

              <div className="flex items-center gap-3 mb-4">
                {selectedCat.image_url ? (
                  <img src={selectedCat.image_url} alt={selectedCat.name} className="w-14 h-14 rounded-xl object-cover" />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-amber-100 flex items-center justify-center text-2xl">🐱</div>
                )}
                <p className="font-bold text-gray-900">{selectedCat.name}</p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-xs px-3 py-2 rounded-xl mb-3">⚠️ {error}</div>
              )}

              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">Rescue Story</label>
              <textarea
                value={storyline}
                onChange={(e) => setStoryline(e.target.value)}
                placeholder="We found this cat shivering under a car during monsoon rains..."
                rows={6}
                className="w-full px-4 py-3 rounded-xl border border-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-400 transition text-sm resize-none bg-amber-50/50"
              />
              <p className="text-xs text-gray-300 mt-1 text-right">{storyline.length} characters</p>
            </>
          )}
        </div>

        {selectedCat && (
          <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
            <button onClick={handleClose} className="flex-1 border border-gray-200 text-gray-600 hover:bg-gray-50 py-2.5 rounded-xl font-semibold text-sm transition">
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving} className="flex-1 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white py-2.5 rounded-xl font-semibold text-sm transition">
              {saving ? 'Saving...' : '📖 Save Page'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}