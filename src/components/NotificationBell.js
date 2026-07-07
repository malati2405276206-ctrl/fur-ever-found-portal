// src/components/NotificationBell.js
'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useNotifications } from '@/hooks/useNotifications'

export default function NotificationBell({ userId }) {
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications(userId)
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef(null)
  const router = useRouter()

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleNotificationClick = async (notification) => {
    if (!notification.read) {
      await markAsRead(notification.id)
    }
    setOpen(false)

    // Handle navigation based on notification type and link
    if (notification.link) {
      // Use router.push for reliable SPA navigation
      router.push(notification.link)
    } else if (notification.type === 'new_message' && notification.conversation_id) {
      // Fallback: if link is missing but we have a conversation_id
      router.push(`/messages?conversation=${notification.conversation_id}`)
    }
  }

  const typeIcon = {
    new_message: '/icon-emoji/message-chat.png',
    ai_match: '/icon-emoji/search-icon.png',
    ngo_verified: '/icon-emoji/house.png',
    cat_reunited: '/icon-emoji/reunited.png',
    adoption_application: '/icon-emoji/cat-paw.png',
  }

  const timeAgo = (dateStr) => {
    if (!dateStr) return ''
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    return `${Math.floor(hours / 24)}d ago`
  }

  if (!userId) return null

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button */}
      <button onClick={() => setOpen(!open)} className="relative text-gray-500 hover:text-amber-600 transition p-2 bell-hover-trigger">
        <img
          src="/icon-emoji/notification-bell.png"
          alt="notifications"
          width={30}
          height={30}
          className="inline-block origin-top"
        />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50">

          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <p className="font-bold text-gray-900 text-sm">Notifications</p>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} className="text-xs text-amber-600 hover:underline font-medium">
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading && (
              <div className="flex items-center justify-center py-10">
                <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {!loading && notifications.length === 0 && (
              <div className="text-center text-gray-400 text-sm py-10 px-4">
                <div className="mb-2"><img src="/icon-emoji/notification-bell.png" alt="bell" width={32} height={32} className="inline-block" /></div>
                No notifications yet
              </div>
            )}

            {!loading && notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => handleNotificationClick(n)}
                className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-amber-50 transition flex gap-3 ${!n.read ? 'bg-amber-50/50' : ''}`}
              >
                <span className="shrink-0"><img src={typeIcon[n.type] || '/icon-emoji/notification-bell.png'} alt="" width={20} height={20} className="inline-block" /></span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm leading-snug ${!n.read ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
                    {n.title}
                  </p>
                  {n.body && <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{n.body}</p>}
                  <p className="text-[10px] text-gray-300 mt-1">{timeAgo(n.created_at)}</p>
                </div>
                {!n.read && <span className="w-2 h-2 bg-amber-500 rounded-full shrink-0 mt-1.5" />}
              </button>
            ))}
          </div>

          <button onClick={() => { setOpen(false); router.push('/notifications') }} className="w-full text-center py-2.5 text-xs font-semibold text-gray-500 hover:bg-gray-50 transition">
            View all notifications
          </button>
        </div>
      )}
    </div>
  )
}
