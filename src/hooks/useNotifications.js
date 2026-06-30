// src/hooks/useNotifications.js
'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'

export function useNotifications(userId) {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const channelRef = useRef(null)

  useEffect(() => {
    if (!userId) {
      setNotifications([])
      setUnreadCount(0)
      setLoading(false)
      return
    }

    fetchNotifications()
    subscribeToNotifications()

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [userId])

  const fetchNotifications = async () => {
    setLoading(true)

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(30)

    if (!error) {
      setNotifications(data || [])
      setUnreadCount((data || []).filter((n) => !n.read).length)
    }

    setLoading(false)
  }

  const subscribeToNotifications = () => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
    }

    const channel = supabase
      .channel(`notifications_${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          setNotifications((prev) => [payload.new, ...prev])
          setUnreadCount((prev) => prev + 1)
        }
      )
      .subscribe()

    channelRef.current = channel
  }

  const markAsRead = async (notificationId) => {
    await supabase.from('notifications').update({ read: true }).eq('id', notificationId)

    setNotifications((prev) => prev.map((n) => n.id === notificationId ? { ...n, read: true } : n))
    setUnreadCount((prev) => Math.max(0, prev - 1))
  }

  const markAllAsRead = async () => {
    await supabase.from('notifications').update({ read: true }).eq('user_id', userId).eq('read', false)

    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    setUnreadCount(0)
  }

  return { notifications, unreadCount, loading, markAsRead, markAllAsRead, refetch: fetchNotifications }
}