// src/app/messages/page.js
'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useChat } from '@/hooks/useChat'
import ProtectedRoute from '@/components/ProtectedRoute'

function MessagesContent() {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const router = useRouter()
  const targetConvoId = searchParams.get('conversation')

  const [conversations, setConversations] = useState([])
  const [activeConvo, setActiveConvo] = useState(null)
  const [loadingList, setLoadingList] = useState(true)
  const [listError, setListError] = useState(null)
  const [input, setInput] = useState('')
  const messagesEndRef = useRef(null)
  const hasAutoOpened = useRef(false)

  const { messages, loading, sending, error: chatError, openConversationById, sendMessage, closeConversation } = useChat(user?.id)

  // ─── Fetch conversations ───
  useEffect(() => {
    if (user) fetchConversations()
  }, [user])

  // ─── Auto-open from notification URL param ───
  useEffect(() => {
    if (targetConvoId && conversations.length > 0 && !hasAutoOpened.current) {
      const found = conversations.find((c) => c.id === targetConvoId)
      if (found) {
        hasAutoOpened.current = true
        handleOpenConvo(found)
      }
    }
  }, [targetConvoId, conversations])

  // ─── Scroll to bottom on new messages ───
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const fetchConversations = async () => {
    setLoadingList(true)
    setListError(null)

    // Step 1: Fetch conversations without any relationship joins
    const { data: convos, error } = await supabase
      .from('conversations')
      .select('*')
      .or(`initiator_id.eq.${user.id},recipient_id.eq.${user.id}`)
      .order('last_message_at', { ascending: false, nullsFirst: false })

    if (error) {
      console.error('Error fetching conversations:', error.message)
      setListError('Could not load conversations. Please refresh.')
      setLoadingList(false)
      return
    }

    if (!convos || convos.length === 0) {
      setConversations([])
      setLoadingList(false)
      return
    }

    // Step 2: Collect all unique user IDs from both sides
    const userIds = new Set()
    convos.forEach((c) => {
      if (c.initiator_id) userIds.add(c.initiator_id)
      if (c.recipient_id) userIds.add(c.recipient_id)
    })

    const userIdArray = Array.from(userIds)

    // Step 3: Fetch profiles and ngo_profiles separately
    const [profilesRes, ngoRes] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, full_name, role')
        .in('id', userIdArray),
      supabase
        .from('ngo_profiles')
        .select('user_id, org_name')
        .in('user_id', userIdArray),
    ])

    // Build lookup maps
    const profileMap = {}
    ;(profilesRes.data || []).forEach((p) => {
      profileMap[p.id] = p
    })

    const ngoMap = {}
    ;(ngoRes.data || []).forEach((n) => {
      ngoMap[n.user_id] = n.org_name
    })

    // Step 4: Merge profile data into conversations
    const enriched = convos.map((c) => {
      const initiatorProfile = profileMap[c.initiator_id]
      const recipientProfile = profileMap[c.recipient_id]

      return {
        ...c,
        initiator: {
          id: c.initiator_id,
          full_name: initiatorProfile?.full_name || ngoMap[c.initiator_id] || null,
          role: initiatorProfile?.role || (ngoMap[c.initiator_id] ? 'ngo' : 'user'),
        },
        recipient: {
          id: c.recipient_id,
          full_name: recipientProfile?.full_name || ngoMap[c.recipient_id] || null,
          role: recipientProfile?.role || (ngoMap[c.recipient_id] ? 'ngo' : 'user'),
        },
      }
    })

    const uniqueConversations = Array.from(
      new Map(enriched.map(c => [c.id, c])).values()
    )

    setConversations(uniqueConversations)

    setConversations(enriched)
    setLoadingList(false)
  }

  const handleOpenConvo = useCallback(async (convo) => {
    setActiveConvo(convo)
    await openConversationById(convo.id)
  }, [openConversationById])

  const handleBack = useCallback(() => {
    setActiveConvo(null)
    closeConversation()
  }, [closeConversation])

  const handleSend = async (e) => {
    e.preventDefault()
    if (!input.trim()) return
    const text = input
    setInput('')
    await sendMessage(text)

    // Update local conversation order
    setConversations((prev) =>
      prev
        .map((c) =>
          c.id === activeConvo?.id
            ? { ...c, last_message_at: new Date().toISOString() }
            : c
        )
        .sort((a, b) => new Date(b.last_message_at || 0) - new Date(a.last_message_at || 0))
    )
  }

  const formatTime = (ts) => {
    if (!ts) return ''
    return new Date(ts).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  }

  const typeLabel = { lost: 'Lost Cat', found: 'Found Cat', adoption: 'Adoption' }
  const typeColor = { lost: 'bg-red-50 text-red-600', found: 'bg-emerald-50 text-emerald-600', adoption: 'bg-amber-50 text-amber-700' }

  const getOtherUser = (convo) => {
    if (!convo || !user) return null
    return convo.initiator_id === user.id ? convo.recipient : convo.initiator
  }

  const getOtherUserName = (convo) => {
    const other = getOtherUser(convo)
    return other?.full_name || other?.org_name || 'Unknown User'
  }

  return (
    <div className="min-h-screen py-6 px-4" style={{ background: 'var(--background)' }}>
      <div className="max-w-6xl mx-auto">

        {/* Page Header */}
        <div className="mb-5 flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: 'var(--buff)' }}>
            <img src="/icon-emoji/message-chat.png" alt="" width={60} height={60} />
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
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"><img src="/icon-emoji/search-icon.png" alt="" width={30} height={30} className="inline-block" /></span>
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

                {listError && (
                  <div className="flex flex-col items-center justify-center h-40 px-6 text-center">
                    <p className="text-sm text-red-500 mb-2">⚠️ {listError}</p>
                    <button onClick={fetchConversations} className="text-xs text-amber-600 hover:underline font-medium">
                      Retry
                    </button>
                  </div>
                )}

                {!loadingList && !listError && conversations.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full px-6 text-center">
                    <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4" style={{ background: 'var(--buff)' }}>
                      <img src="/icon-emoji/cat-paw.png" alt="" width={60} height={60} />
                    </div>
                    <p className="font-semibold text-sm mb-1" style={{ color: 'var(--foreground)' }}>No conversations yet</p>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      Message someone from a cat listing to start chatting!
                    </p>
                  </div>
                )}

                {!loadingList && conversations.map((convo) => {
                  const isActive = activeConvo?.id === convo.id
                  const otherUserName = getOtherUserName(convo)
                  const otherUser = getOtherUser(convo)

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
                        <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: isActive ? '#ffffff' : 'var(--buff)' }}>
                          <img src={convo.cat_type === 'lost' ? '/icon-emoji/lost-cat.png' : convo.cat_type === 'found' ? '/icon-emoji/found-cat.png' : '/icon-emoji/house.png'} alt="" width={60} height={60} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-semibold text-sm truncate" style={{ color: 'var(--foreground)' }}>
                              {otherUserName}
                            </p>

                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0 ${typeColor[convo.cat_type] || 'bg-gray-50 text-gray-600'}`}>
                              {convo.cat_type === 'lost'
                                ? 'Lost'
                                : convo.cat_type === 'found'
                                ? 'Found'
                                : 'Adoption'}
                            </span>
                          </div>

                          <p className="text-[11px] text-gray-500 mt-1 capitalize">
                            {otherUser?.role === 'ngo' ? '🏢 NGO' : '👤 User'}
                          </p>

                          <p className="text-[11px] text-gray-400">
                            {formatTime(convo.last_message_at)}
                          </p>
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
                    <img src="/icon-emoji/cat-face.png" alt="" width={60} height={60} />
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
                      onClick={handleBack}
                      className="sm:hidden w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                      style={{ background: 'var(--buff)' }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 18 9 12 15 6" />
                      </svg>
                    </button>

                    {/* Chat avatar */}
                    <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'var(--buff)' }}>
                      <img src={activeConvo.cat_type === 'lost' ? '/icon-emoji/lost-cat.png' : activeConvo.cat_type === 'found' ? '/icon-emoji/found-cat.png' : '/icon-emoji/house.png'} alt="" width={60} height={60} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate" style={{ color: 'var(--foreground)' }}>
                        {getOtherUserName(activeConvo)}
                      </p>

                      <p className="text-[11px] text-gray-400 flex items-center gap-1">
                        <span>
                          {getOtherUser(activeConvo)?.role === 'ngo' ? '🏢 NGO' : '👤 User'}
                        </span>
                        <span>•</span>
                        <span>{typeLabel[activeConvo.cat_type] || 'Chat'}</span>
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        const otherId = getOtherUser(activeConvo)?.id
                        if (otherId) router.push(`/profile/${otherId}`)
                      }}
                      className="text-xs px-3 py-1.5 rounded-full border transition hover:bg-amber-50 hover:border-amber-300"
                      style={{ borderColor: 'var(--buff)' }}
                    >
                      View Profile
                    </button>

                    {/* Status dot */}
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

                    {chatError && (
                      <div className="text-center text-red-500 text-sm py-4">
                        <p>⚠️ {chatError}</p>
                      </div>
                    )}

                    {!loading && !chatError && messages.length === 0 && (
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
                          {showTimestamp && (
                            <div className="flex items-center justify-center my-3">
                              <span className="text-[10px] px-3 py-1 rounded-full text-gray-400" style={{ background: 'rgba(243, 213, 141, 0.4)' }}>
                                {formatTime(msg.created_at)}
                              </span>
                            </div>
                          )}

                          <div className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                            {!isMine && (
                              <div className="w-7 h-7 rounded-full flex items-center justify-center mr-2 mt-auto shrink-0 text-xs" style={{ background: 'var(--buff)' }}>
                                {getOtherUser(activeConvo)?.role === 'ngo' ? '🏢' : '👤'}
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
