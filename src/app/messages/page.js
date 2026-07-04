// src/app/messages/page.js
'use client'

import { useState, useEffect, useRef } from 'react'
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
  const messagesEndRef = useRef(null)

  const { conversationId, messages, loading, sending, openConversation, sendMessage } = useChat(user?.id)

  useEffect(() => {
    if (user) fetchConversations()
  }, [user])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

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
  const typeColor = { lost: 'bg-red-50 text-red-600', found: 'bg-emerald-50 text-emerald-600', adoption: 'bg-amber-50 text-amber-700' }

  return (
    <div className="min-h-screen py-6 px-4" style={{ background: 'var(--background)' }}>
      <div className="max-w-6xl mx-auto">

        {/* Page Header */}
        <div className="mb-5 flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl" style={{ background: 'var(--buff)' }}>
            💬
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>Messages</h1>
            <p className="text-xs" style={{ color: 'var(--sage-400)' }}>
              {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Main Chat Container */}
        <div
          className="rounded-3xl overflow-hidden border shadow-lg"
          style={{
            background: '#ffffff',
            borderColor: 'var(--buff)',
            height: 'calc(100vh - 180px)',
            boxShadow: '0 8px 40px rgba(46, 67, 101, 0.08)',
          }}
        >
          <div className="flex h-full">

            {/* ─── Conversation Sidebar ─── */}
            <div className={`w-full sm:w-[320px] flex flex-col border-r ${activeConvo ? 'hidden sm:flex' : 'flex'}`} style={{ borderColor: 'var(--buff)', background: '#fffcf7' }}>

              {/* Search / Filter header */}
              <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--buff)' }}>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
                  <input
                    type="text"
                    placeholder="Search conversations..."
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-2 transition"
                    style={{ borderColor: 'var(--buff)', background: '#ffffff' }}
                    onFocus={(e) => e.target.style.boxShadow = '0 0 0 2px var(--buff)'}
                    onBlur={(e) => e.target.style.boxShadow = 'none'}
                    readOnly
                  />
                </div>
              </div>

              {/* Conversations List */}
              <div className="flex-1 overflow-y-auto">
                {loadingList && (
                  <div className="flex flex-col items-center justify-center h-40 gap-2">
                    <div className="w-8 h-8 border-3 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--gold)', borderTopColor: 'transparent' }} />
                    <p className="text-xs text-gray-400">Loading chats...</p>
                  </div>
                )}

                {!loadingList && conversations.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full px-6 text-center">
                    <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4" style={{ background: 'var(--buff)' }}>
                      <span className="text-3xl">🐾</span>
                    </div>
                    <p className="font-semibold text-sm mb-1" style={{ color: 'var(--foreground)' }}>No conversations yet</p>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      Message someone from a cat listing to start chatting!
                    </p>
                  </div>
                )}

                {conversations.map((convo) => {
                  const isActive = activeConvo?.id === convo.id
                  return (
                    <button
                      key={convo.id}
                      onClick={() => handleOpenConvo(convo)}
                      className="w-full text-left px-4 py-3.5 transition-all group relative"
                      style={{
                        background: isActive ? 'var(--buff)' : 'transparent',
                      }}
                    >
                      {/* Active indicator */}
                      {isActive && (
                        <div className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full" style={{ background: 'var(--gold)' }} />
                      )}

                      <div className="flex items-start gap-3">
                        {/* Avatar */}
                        <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-lg" style={{ background: isActive ? '#ffffff' : 'var(--buff)' }}>
                          {convo.cat_type === 'lost' ? '😿' : convo.cat_type === 'found' ? '😊' : '🏠'}
                        </div>

                        <div className="flex-1 min-w-0">
                          {/* Type badge */}
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${typeColor[convo.cat_type]}`}>
                            {convo.cat_type === 'lost' ? 'Lost' : convo.cat_type === 'found' ? 'Found' : 'Adoption'}
                          </span>
                          {/* Time */}
                          <p className="text-[11px] text-gray-400 mt-1">{formatTime(convo.last_message_at)}</p>
                        </div>
                      </div>

                      {/* Hover accent */}
                      {!isActive && (
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" style={{ background: 'rgba(243, 213, 141, 0.15)' }} />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* ─── Active Chat Area ─── */}
            <div className={`flex-1 flex flex-col ${activeConvo ? 'flex' : 'hidden sm:flex'}`}>

              {!activeConvo ? (
                /* Empty State */
                <div className="flex-1 flex flex-col items-center justify-center px-6">
                  <div className="w-24 h-24 rounded-full flex items-center justify-center mb-5 animate-float" style={{ background: 'var(--buff)' }}>
                    <span className="text-4xl">🐱</span>
                  </div>
                  <p className="font-bold text-lg mb-1" style={{ color: 'var(--foreground)' }}>Select a conversation</p>
                  <p className="text-sm text-gray-400 text-center max-w-xs">
                    Pick a conversation from the sidebar to start chatting about a furry friend
                  </p>
                </div>
              ) : (
                <>
                  {/* Chat Header */}
                  <div className="px-5 py-3.5 border-b flex items-center gap-3" style={{ borderColor: 'var(--buff)', background: '#fffcf7' }}>
                    {/* Mobile back button */}
                    <button
                      onClick={() => setActiveConvo(null)}
                      className="sm:hidden w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                      style={{ background: 'var(--buff)' }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 18 9 12 15 6" />
                      </svg>
                    </button>

                    {/* Chat avatar */}
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-base" style={{ background: 'var(--buff)' }}>
                      {activeConvo.cat_type === 'lost' ? '😿' : activeConvo.cat_type === 'found' ? '😊' : '🏠'}
                    </div>

                    <div className="flex-1">
                      <p className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>
                        {typeLabel[activeConvo.cat_type]}
                      </p>
                      <p className="text-[11px] text-gray-400">Active conversation</p>
                    </div>

                    {/* Optional status dot */}
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-emerald-100" />
                  </div>

                  {/* Messages Area */}
                  <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4" style={{ background: 'linear-gradient(180deg, #fefcf8 0%, #f9f5ee 100%)' }}>
                    {loading && (
                      <div className="flex items-center justify-center h-full">
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-8 h-8 border-3 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--gold)', borderTopColor: 'transparent' }} />
                          <p className="text-xs text-gray-400">Loading messages...</p>
                        </div>
                      </div>
                    )}

                    {!loading && messages.length === 0 && (
                      <div className="flex flex-col items-center justify-center h-full text-center">
                        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-3" style={{ background: 'var(--buff)' }}>
                          <span className="text-2xl">👋</span>
                        </div>
                        <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Start the conversation!</p>
                        <p className="text-xs text-gray-400 mt-1">Say hello and connect about this furry friend</p>
                      </div>
                    )}

                    {!loading && messages.map((msg, idx) => {
                      const isMine = msg.sender_id === user.id
                      const showTimestamp = idx === 0 || (new Date(msg.created_at) - new Date(messages[idx - 1]?.created_at)) > 300000

                      return (
                        <div key={msg.id}>
                          {/* Timestamp separator */}
                          {showTimestamp && (
                            <div className="flex items-center justify-center my-3">
                              <span className="text-[10px] px-3 py-1 rounded-full text-gray-400" style={{ background: 'rgba(243, 213, 141, 0.4)' }}>
                                {formatTime(msg.created_at)}
                              </span>
                            </div>
                          )}

                          <div className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                            {/* Other user avatar */}
                            {!isMine && (
                              <div className="w-7 h-7 rounded-full flex items-center justify-center mr-2 mt-auto shrink-0 text-xs" style={{ background: 'var(--buff)' }}>
                                🐾
                              </div>
                            )}

                            <div
                              className={`max-w-[70%] px-4 py-3 text-sm leading-relaxed shadow-sm ${
                                isMine
                                  ? 'rounded-2xl rounded-br-md text-white'
                                  : 'rounded-2xl rounded-bl-md border'
                              }`}
                              style={
                                isMine
                                  ? { background: 'var(--police-blue)' }
                                  : { background: '#ffffff', borderColor: 'var(--buff)' }
                              }
                            >
                              <p>{msg.content}</p>
                              <p className={`text-[10px] mt-1.5 ${isMine ? 'text-blue-200' : 'text-gray-300'}`}>
                                {new Date(msg.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input */}
                  <div className="px-4 py-3 border-t" style={{ borderColor: 'var(--buff)', background: '#ffffff' }}>
                    <form onSubmit={handleSend} className="flex items-end gap-2">
                      {/* Input area */}
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          placeholder="Type a message..."
                          disabled={sending}
                          className="w-full px-4 py-3 rounded-2xl border text-sm focus:outline-none focus:ring-2 transition disabled:opacity-50"
                          style={{ borderColor: 'var(--buff)', background: '#fffcf7' }}
                          onFocus={(e) => e.target.style.boxShadow = '0 0 0 2px var(--gold-light)'}
                          onBlur={(e) => e.target.style.boxShadow = 'none'}
                        />
                      </div>

                      {/* Send button */}
                      <button
                        type="submit"
                        disabled={sending || !input.trim()}
                        className="w-11 h-11 rounded-2xl flex items-center justify-center transition-all shrink-0 disabled:opacity-40"
                        style={{
                          background: input.trim() ? 'var(--police-blue)' : 'var(--buff)',
                          color: input.trim() ? '#ffffff' : 'var(--sage-400)',
                        }}
                      >
                        {sending ? (
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="22" y1="2" x2="11" y2="13" />
                            <polygon points="22 2 15 22 11 13 2 9 22 2" />
                          </svg>
                        )}
                      </button>
                    </form>

                    {/* Typing indicator area */}
                    <div className="h-5 mt-1 px-2">
                      {sending && (
                        <p className="text-[10px] text-gray-400 animate-pulse">Sending...</p>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
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
