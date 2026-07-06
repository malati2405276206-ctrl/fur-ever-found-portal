// src/app/notifications/page.js
'use client'

import { useAuth } from '@/hooks/useAuth'
import { useNotifications } from '@/hooks/useNotifications'
import { useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/ProtectedRoute'

function NotificationsContent() {
  const { user } = useAuth()
  const { notifications, loading, markAsRead, markAllAsRead } = useNotifications(user?.id)
  const router = useRouter()

  const typeIcon = { new_message: '/icon-emoji/message-chat.png', ai_match: '/icon-emoji/search-icon.png', ngo_verified: '/icon-emoji/house.png', cat_reunited: '/icon-emoji/reunited.png' }

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    return `${Math.floor(hours / 24)}d ago`
  }

  const handleClick = async (n) => {
    if (!n.read) await markAsRead(n.id)
    if (n.link) {
      router.push(n.link)
    } else if (n.type === 'new_message' && n.conversation_id) {
      router.push(`/messages?conversation=${n.conversation_id}`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto">

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><img src="/icon-emoji/notification-bell.png" alt="" width={60} height={60} className="inline-block" /> Notifications</h1>
          {notifications.some((n) => !n.read) && (
            <button onClick={markAllAsRead} className="text-sm text-orange-500 hover:underline font-medium">
              Mark all as read
            </button>
          )}
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          {loading && (
            <div className="flex items-center justify-center py-16">
              <div className="w-7 h-7 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {!loading && notifications.length === 0 && (
            <div className="text-center py-16">
              <div className="mb-3"><img src="/icon-emoji/notification-bell.png" alt="" width={60} height={60} className="inline-block" /></div>
              <p className="text-gray-500 font-medium">No notifications yet</p>
              <p className="text-gray-400 text-sm mt-1">We&apos;ll let you know when something happens</p>
            </div>
          )}

          {!loading && notifications.map((n, i) => (
            <button
              key={n.id}
              onClick={() => handleClick(n)}
              className={`w-full text-left px-5 py-4 flex gap-4 items-start hover:bg-orange-50 transition ${i !== notifications.length - 1 ? 'border-b border-gray-50' : ''} ${!n.read ? 'bg-orange-50/40' : ''}`}
            >
              <span className="shrink-0"><img src={typeIcon[n.type] || '/icon-emoji/notification-bell.png'} alt="" width={60} height={60} className="inline-block" /></span>
              <div className="flex-1 min-w-0">
                <p className={`text-sm leading-snug ${!n.read ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
                  {n.title}
                </p>
                {n.body && <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{n.body}</p>}
                <p className="text-xs text-gray-300 mt-1">{timeAgo(n.created_at)}</p>
              </div>
              {!n.read && <span className="w-2 h-2 bg-orange-500 rounded-full shrink-0 mt-2" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function NotificationsPage() {
  return (
    <ProtectedRoute>
      <NotificationsContent />
    </ProtectedRoute>
  )
}