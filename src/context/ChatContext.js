// src/context/ChatContext.js
'use client'

import { createContext, useContext, useState } from 'react'
import ChatPanel from '@/components/ChatPanel'
import { useAuth } from '@/hooks/useAuth'

const ChatContext = createContext(null)

export function ChatProvider({ children }) {
  const { user } = useAuth()
  const [chatState, setChatState] = useState(null)
  // chatState = { catType, catId, recipientId, catLabel } | null

  const openChat = ({ catType, catId, recipientId, catLabel }) => {
    if (!user) return
    if (recipientId === user.id) return // can't message yourself
    setChatState({ catType, catId, recipientId, catLabel })
  }

  const closeChat = () => setChatState(null)

  return (
    <ChatContext.Provider value={{ openChat, closeChat }}>
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
  return useContext(ChatContext)
}