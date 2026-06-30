// src/components/ChatPanel.js
'use client'

import { useState, useEffect, useRef } from 'react'
import { useChat } from '@/hooks/useChat'
import { supabase } from '@/lib/supabase'

export default function ChatPanel({ isOpen, onClose, currentUserId, catType, catId, recipientId, catLabel }) {
  const { conversationId, messages, loading, sending, openConversation, sendMessage, closeConversation } = useChat(currentUserId)
  const [input, setInput] = useState('')
  const [recipientName, setRecipientName] = useState('')
  const messagesEndRef = useRef(null)

  useEffect(() => {
    if (isOpen && currentUserId && recipientId) {
      openConversation(catType, catId, recipientId)
      fetchRecipientName()
    }
    return () => {
      if (!isOpen) closeConversation()
    }
  }, [isOpen])

  const fetchRecipientName = async () => {
    const { data } = await supabase.from('profiles').select('full_name').eq('id', recipientId).maybeSingle()
    setRecipientName(data?.full_name || 'User')
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
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-orange-50">
          <div>
            <p className="font-bold text-gray-900 text-sm">{recipientName}</p>
            <p className="text-xs text-gray-400">About: {catLabel}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl transition">✕</button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gray-50">
          {loading && (
            <div className="flex items-center justify-center h-full">
              <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {!loading && messages.length === 0 && (
            <div className="text-center text-gray-400 text-sm mt-10">
              <div className="text-3xl mb-2">💬</div>
              Say hello! Start the conversation about {catLabel}.
            </div>
          )}

          {!loading && messages.map((msg) => {
            const isMine = msg.sender_id === currentUserId
            return (
              <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${isMine ? 'bg-orange-500 text-white rounded-br-sm' : 'bg-white text-gray-800 border border-gray-100 rounded-bl-sm'}`}>
                  <p>{msg.content}</p>
                  <p className={`text-[10px] mt-1 ${isMine ? 'text-orange-100' : 'text-gray-300'}`}>{formatTime(msg.created_at)}</p>
                </div>
              </div>
            )
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="flex items-center gap-2 px-4 py-3 border-t border-gray-100 bg-white">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            disabled={sending || loading}
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-400 transition text-sm disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={sending || loading || !input.trim()}
            className="bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white w-10 h-10 rounded-xl flex items-center justify-center transition shrink-0"
          >
            {sending ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : '➤'}
          </button>
        </form>
      </div>
    </>
  )
}