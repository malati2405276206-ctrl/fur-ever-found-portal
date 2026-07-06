// src/context/ChatContext.js
'use client'

import { createContext, useContext, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import ChatPanel from '@/components/ChatPanel'
import { useAuth } from '@/hooks/useAuth'

const ChatContext = createContext(null)

/**
 * ChatProvider wraps the entire app and provides:
 * - openChat() — opens the slide-over ChatPanel for quick messaging
 * - openFullChat() — navigates to /messages with a specific conversation
 * - closeChat() — closes the ChatPanel
 *
 * The ChatPanel is a quick-reply overlay. Full conversation management
 * happens at /messages.
 */
export function ChatProvider({ children }) {
  const { user } = useAuth()
  const router = useRouter()
  const [chatState, setChatState] = useState(null)
  // chatState = { catType, catId, recipientId, catLabel } | null

  const openChat = useCallback(({ catType, catId, recipientId, catLabel }) => {
    if (!user) return
    if (recipientId === user.id) return // can't message yourself
    setChatState({ catType, catId, recipientId, catLabel })
  }, [user])

  const closeChat = useCallback(() => {
    setChatState(null)
  }, [])

  // Navigate to full messages page with a specific conversation
  const openFullChat = useCallback((conversationId) => {
    if (!conversationId) return
    setChatState(null) // close panel if open
    router.push(`/messages?conversation=${conversationId}`)
  }, [router])

  return (
    <ChatContext.Provider value={{ openChat, closeChat, openFullChat }}>
      {children}
      {user && chatState && (
        <ChatPanel
          isOpen={!!chatState}
          onClose={closeChat}
          currentUserId={user.id}
          catType={chatState.catType}
          catId={chatState.catId}
          recipientId={chatState.recipientId}
          catLabel={chatState.catLabel}
        />
      )}
    </ChatContext.Provider>
  )
}

export function useChatContext() {
  const ctx = useContext(ChatContext)
  if (!ctx) {
    // Provide safe fallback instead of crashing
    return { openChat: () => {}, closeChat: () => {}, openFullChat: () => {} }
  }
  return ctx
}
