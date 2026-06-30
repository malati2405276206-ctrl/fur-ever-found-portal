// src/hooks/useChat.js
'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'

export function useChat(currentUserId) {
  const [conversationId, setConversationId] = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const channelRef = useRef(null)
  const subscribingRef = useRef(false) // guards against overlapping subscribe calls

  const openConversation = async (catType, catId, recipientId) => {
    setLoading(true)

    const { data: existing } = await supabase
      .from('conversations')
      .select('*')
      .eq('cat_type', catType)
      .eq('cat_id', catId)
      .or(`and(initiator_id.eq.${currentUserId},recipient_id.eq.${recipientId}),and(initiator_id.eq.${recipientId},recipient_id.eq.${currentUserId})`)
      .maybeSingle()

    let convoId = existing?.id

    if (!convoId) {
      const { data: created, error } = await supabase
        .from('conversations')
        .insert({
          cat_type: catType,
          cat_id: catId,
          initiator_id: currentUserId,
          recipient_id: recipientId,
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating conversation:', error.message)
        setLoading(false)
        return null
      }
      convoId = created.id
    }

    setConversationId(convoId)
    await loadMessages(convoId)
    await subscribeToMessages(convoId)
    setLoading(false)
    return convoId
  }

  const loadMessages = async (convoId) => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', convoId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error loading messages:', error.message)
      return
    }

    setMessages(data || [])

    await supabase
      .from('messages')
      .update({ read: true })
      .eq('conversation_id', convoId)
      .neq('sender_id', currentUserId)
      .eq('read', false)
  }

  const subscribeToMessages = async (convoId) => {
    // Remove any existing channel fully before creating a new one
    if (channelRef.current) {
      await supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }

    // Guard: don't start a second subscribe while one is in flight
    if (subscribingRef.current) return
    subscribingRef.current = true

    // Unique channel name per conversation AND per mount to avoid collisions
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
            // avoid duplicate inserts if the event fires twice
            if (prev.some((m) => m.id === payload.new.id)) return prev
            return [...prev, payload.new]
          })

          if (payload.new.sender_id !== currentUserId) {
            supabase.from('messages').update({ read: true }).eq('id', payload.new.id).then(() => {})
          }
        }
      )

    channelRef.current = channel
    channel.subscribe()
    subscribingRef.current = false
  }

  const sendMessage = async (content) => {
    if (!conversationId || !content.trim()) return

    setSending(true)

    const { error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: currentUserId,
        content: content.trim(),
      })

    if (error) {
      console.error('Error sending message:', error.message)
    }

    setSending(false)
  }

  useEffect(() => {
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [])

  const closeConversation = () => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }
    setConversationId(null)
    setMessages([])
  }

  return {
    conversationId,
    messages,
    loading,
    sending,
    openConversation,
    sendMessage,
    closeConversation,
  }
}