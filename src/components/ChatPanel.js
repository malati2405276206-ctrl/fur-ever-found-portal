// src/components/ChatPanel.js
'use client'

import { useState, useEffect, useRef } from 'react'
import { useChat } from '@/hooks/useChat'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function ChatPanel({ isOpen, onClose, currentUserId, catType, catId, recipientId, catLabel }) {
  const { conversationId, messages, loading, sending, error, openConversation, sendMessage, closeConversation } = useChat(currentUserId)
  const [input, setInput] = useState('')
  const [recipientName, setRecipientName] = useState('')
  const [nameLoading, setNameLoading] = useState(true)
  const messagesEndRef = useRef(null)
  const router = useRouter()

  useEffect(() => {
    if (isOpen && currentUserId && recipientId) {
      openConversation(catType, catId, recipientId)
      fetchRecipientName()
    }
    return () => {
      closeConversation()
    }
  }, [isOpen, currentUserId, recipientId, catType, catId])

  const fetchRecipientName = async () => {
    setNameLoading(true)
    // Try profiles first
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', recipientId)
      .maybeSingle()

    if (profile?.full_name) {
      setRecipientName(profile.full_name)
      setNameLoading(false)
      return
    }

    // Fallback to ngo_profiles
    const { data: ngo } = await supabase
      .from('ngo_profiles')
      .select('org_name')
      .eq('user_id', recipientId)
      .maybeSingle()

    setRecipientName(ngo?.org_name || 'User')
    setNameLoading(false)
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (e) => {
    e.preventDefault()
    if (!input.trim()) return
    const text = input
    setInput('')
    await sendMessage(text)
  }

  const handleExpandToFullPage = () => {
    if (conversationId) {
      onClose()
      router.push(`/messages?conversation=${conversationId}`)
    }
  }

  const formatTime = (ts) => new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/30 z-40 transition-opacity" onClick={onClose} />
      )}

      {/* Slide-over panel */}
      <div className={`fixed top-0 right-0 h-full w-full sm:w-96 bg-white shadow-2xl z-50 flex flex-col transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100" style={{ background: 'var(--buff)' }}>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-900 text-sm truncate">
              {nameLoading ? '...' : recipientName}
            </p>
            <p className="text-xs text-gray-400 truncate">
              About: {catLabel}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {/* Expand to full page */}
            {conversationId && (
              <button
                onClick={handleExpandToFullPage}
                className="text-gray-400 hover:text-gray-600 text-sm transition p-1"
                title="Open in full page"
              >
                ↗
              </button>
            )}
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl transition">✕</button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gray-50">
          {loading && (
            <div className="flex items-center justify-center h-full">
              <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {error && (
            <div className="text-center text-red-500 text-sm mt-4 px-4">
              <p>⚠️ {error}</p>
            </div>
          )}

          {!loading && !error && messages.length === 0 && (
            <div className="text-center text-gray-400 text-sm mt-10">
              <div className="text-3xl mb-2"><img src="/icon-emoji/message-chat.png" alt="" width={60} height={60} className="inline-block" /></div>
              Say hello! Start the conversation about {catLabel}.
            </div>
          )}

          {!loading && messages.map((msg) => {
            const isMine = msg.sender_id === currentUserId
            return (
              <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${isMine ? 'bg-[#2E4365] text-white rounded-br-sm' : 'bg-white text-gray-800 border border-gray-100 rounded-bl-sm'}`}>
                  <p>{msg.content}</p>
                  <p className={`text-[10px] mt-1 ${isMine ? 'text-blue-200' : 'text-gray-300'}`}>{formatTime(msg.created_at)}</p>
                </div>
              </div>
            )
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="flex items-center gap-2 px-4 py-3 border-t border-gray-100 bg-white" style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            disabled={sending || loading}
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-400 transition text-sm disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={sending || loading || !input.trim()}
            className="bg-[#2E4365] hover:bg-[#243551] disabled:bg-[#d6e3f0] text-white w-10 h-10 rounded-xl flex items-center justify-center transition shrink-0"
          >
            {sending ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : '➤'}
          </button>
        </form>
      </div>
    </>
  )
}
