// src/app/messages/page.js
'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useChat } from '@/hooks/useChat'
import ProtectedRoute from '@/components/ProtectedRoute'

function MessagesContent() {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const targetConvoId = searchParams.get('conversation')

  const [conversations, setConversations] = useState([])
  const [activeConvo, setActiveConvo] = useState(null)
  const [loadingList, setLoadingList] = useState(true)
  const [input, setInput] = useState('')

  const { conversationId, messages, loading, sending, openConversation, sendMessage } = useChat(user?.id)

  useEffect(() => {
    if (user) fetchConversations()
  }, [user])

  const fetchConversations = async () => {
    setLoadingList(true)

    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .or(`initiator_id.eq.${user.id},recipient_id.eq.${user.id}`)
      .order('last_message_at', { ascending: false })

    if (!error) {
      setConversations(data || [])

      // Auto-open conversation from notification link
      if (targetConvoId) {
        const found = data.find((c) => c.id === targetConvoId)
        if (found) handleOpenConvo(found)
      }
    }
    setLoadingList(false)
  }

  const handleOpenConvo = async (convo) => {
    setActiveConvo(convo)
    const otherId = convo.initiator_id === user.id ? convo.recipient_id : convo.initiator_id
    await openConversation(convo.cat_type, convo.cat_id, otherId)
  }

  const handleSend = async (e) => {
    e.preventDefault()
    if (!input.trim()) return
    const text = input
    setInput('')
    await sendMessage(text)
  }

  const formatTime = (ts) => new Date(ts).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

  const typeLabel = { lost: '😿 Lost Cat', found: '😊 Found Cat', adoption: '🏠 Adoption' }

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-5xl mx-auto bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden" style={{ height: 'calc(100vh - 120px)' }}>
        <div className="flex h-full">

          {/* Conversation list */}
          <div className={`w-full sm:w-80 border-r border-gray-100 flex flex-col ${activeConvo ? 'hidden sm:flex' : 'flex'}`}>
            <div className="px-5 py-4 border-b border-gray-100">
              <h1 className="font-bold text-gray-900">Messages</h1>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loadingList && (
                <div className="flex items-center justify-center h-32">
                  <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              {!loadingList && conversations.length === 0 && (
                <div className="text-center text-gray-400 text-sm mt-10 px-4">
                  <div className="text-3xl mb-2">💬</div>
                  No conversations yet. Message someone from a cat listing to start chatting.
                </div>
              )}

              {conversations.map((convo) => (
                <button
                  key={convo.id}
                  onClick={() => handleOpenConvo(convo)}
                  className={`w-full text-left px-5 py-3 border-b border-gray-50 hover:bg-orange-50 transition ${activeConvo?.id === convo.id ? 'bg-orange-50' : ''}`}
                >
                  <p className="text-xs font-medium text-gray-400">{typeLabel[convo.cat_type]}</p>
                  <p className="text-sm text-gray-700 mt-0.5">{formatTime(convo.last_message_at)}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Active chat */}
          <div className={`flex-1 flex-col ${activeConvo ? 'flex' : 'hidden sm:flex'}`}>
            {!activeConvo ? (
              <div className="flex-1 flex items-center justify-center text-gray-300 text-sm">
                Select a conversation
              </div>
            ) : (
              <>
                <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
                  <button onClick={() => setActiveConvo(null)} className="sm:hidden text-gray-400">←</button>
                  <p className="font-semibold text-gray-800 text-sm">{typeLabel[activeConvo.cat_type]}</p>
                </div>

                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-gray-50">
                  {loading && (
                    <div className="flex items-center justify-center h-full">
                      <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}

                  {!loading && messages.map((msg) => {
                    const isMine = msg.sender_id === user.id
                    return (
                      <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm ${isMine ? 'bg-orange-500 text-white rounded-br-sm' : 'bg-white text-gray-800 border border-gray-100 rounded-bl-sm'}`}>
                          <p>{msg.content}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>

                <form onSubmit={handleSend} className="flex items-center gap-2 px-5 py-3 border-t border-gray-100">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type a message..."
                    disabled={sending}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-400 transition text-sm"
                  />
                  <button type="submit" disabled={sending || !input.trim()} className="bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white w-10 h-10 rounded-xl flex items-center justify-center transition shrink-0">
                    ➤
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function MessagesPage() {
  return (
    <ProtectedRoute>
      <MessagesContent />
    </ProtectedRoute>
  )
}