// src/hooks/useChat.js
'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

/**
 * Core chat hook — handles conversation creation/reuse, message loading,
 * real-time subscriptions, and sending.
 *
 * Key guarantees:
 * - Never creates duplicate conversations (checks both directions + handles 23505)
 * - Updates last_message_at on the conversation after sending
 * - Supports opening by conversation ID directly (for notification redirects)
 */
export function useChat(currentUserId) {
  const [conversationId, setConversationId] = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(null)
  const channelRef = useRef(null)
  const subscribingRef = useRef(false)

  // ─── Open by conversation ID directly (notification redirect) ───
  const openConversationById = useCallback(async (convoId) => {
    if (!convoId || !currentUserId) return null
    setLoading(true)
    setError(null)

    setConversationId(convoId)
    await loadMessages(convoId)
    await subscribeToMessages(convoId)
    setLoading(false)
    return convoId
  }, [currentUserId])

  // ─── Open or create conversation by cat + recipient ───
  const openConversation = useCallback(async (catType, catId, recipientId) => {
    if (!currentUserId || !recipientId) return null
    if (currentUserId === recipientId) return null // can't chat with yourself

    setLoading(true)
    setError(null)

    try {
      // Try to find existing conversation (check both directions)
      const { data: existingList, error: findError } = await supabase
        .from('conversations')
        .select('*')
        .eq('cat_type', catType)
        .eq('cat_id', catId)
        .or(
          `and(initiator_id.eq.${currentUserId},recipient_id.eq.${recipientId}),and(initiator_id.eq.${recipientId},recipient_id.eq.${currentUserId})`
        )
        .order('last_message_at', { ascending: false })
        .limit(1)
        .single()

      const existing = existingList?.[0]

      if (findError) {
        console.error('Error finding conversation:', findError.message)
      }

      let convoId = existing?.id

      if (!convoId) {
        // Create new conversation
        const { data: created, error: createError } = await supabase
          .from('conversations')
          .insert({
            cat_type: catType,
            cat_id: catId,
            initiator_id: currentUserId,
            recipient_id: recipientId,
            last_message_at: new Date().toISOString(),
          })
          .select('id')
          .maybeSingle()

        if (createError?.code === '23505') {
          // Duplicate key race condition — fetch existing
          const { data: retryList } = await supabase
              .from('conversations')
              .select('*')
              .eq('cat_type', catType)
              .eq('cat_id', catId)
              .or(
                `and(initiator_id.eq.${currentUserId},recipient_id.eq.${recipientId}),and(initiator_id.eq.${recipientId},recipient_id.eq.${currentUserId})`
              )
              .order('last_message_at', { ascending: false })
              .limit(1)
              .single()

            convoId = retryList?.[0]?.id

        } else if (createError) {
          console.error('Error creating conversation:', createError.message)
          setError('Could not start conversation. Please try again.')
          setLoading(false)
          return null
        } else {
          convoId = created?.id
        }
      }

      if (!convoId) {
        setError('Could not open conversation.')
        setLoading(false)
        return null
      }

      setConversationId(convoId)
      await loadMessages(convoId)
      await subscribeToMessages(convoId)
      setLoading(false)
      return convoId
    } catch (err) {
      console.error('Unexpected error in openConversation:', err)
      setError('Something went wrong. Please try again.')
      setLoading(false)
      return null
    }
  }, [currentUserId])

  // ─── Load messages for a conversation ───
  const loadMessages = async (convoId) => {
    const { data, error: loadError } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', convoId)
      .order('created_at', { ascending: true })

    if (loadError) {
      console.error('Error loading messages:', loadError.message)
      return
    }

    setMessages(data || [])

    // Mark unread messages as read
    if (currentUserId) {
      await supabase
        .from('messages')
        .update({ read: true })
        .eq('conversation_id', convoId)
        .neq('sender_id', currentUserId)
        .eq('read', false)
    }
  }

  // ─── Real-time subscription ───
  const subscribeToMessages = async (convoId) => {
    // Remove existing channel
    if (channelRef.current) {
      await supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }

    if (subscribingRef.current) return
    subscribingRef.current = true

    const channel = supabase
      .channel(`messages_${convoId}_${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${convoId}`,
        },
        (payload) => {
          setMessages((prev) => {
            if (prev.some((m) => m.id === payload.new.id)) return prev
            return [...prev, payload.new]
          })

          // Auto-mark as read if it's from the other person
          if (payload.new.sender_id !== currentUserId) {
            supabase
              .from('messages')
              .update({ read: true })
              .eq('id', payload.new.id)
              .then(() => {})
          }
        }
      )

    channelRef.current = channel
    channel.subscribe()
    subscribingRef.current = false
  }

  // ─── Send a message ───
  const sendMessage = useCallback(async (content) => {
    if (!conversationId || !content.trim() || !currentUserId) return

    setSending(true)

    const { error: sendError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: currentUserId,
        content: content.trim(),
      })

    if (sendError) {
      console.error('Error sending message:', sendError.message)
      setError('Failed to send message.')
    } else {
      // Update last_message_at on conversation for proper ordering
      await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', conversationId)
    }

    setSending(false)
  }, [conversationId, currentUserId])

  // ─── Cleanup on unmount ───
  useEffect(() => {
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [])

  // ─── Close conversation ───
  const closeConversation = useCallback(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }
    setConversationId(null)
    setMessages([])
    setError(null)
  }, [])

  return {
    conversationId,
    messages,
    loading,
    sending,
    error,
    openConversation,
    openConversationById,
    sendMessage,
    closeConversation,
  }
}
