// src/components/EmojiIcon.js
// Reusable component to render custom icon-emoji images inline instead of system emojis

const emojiMap = {
  'cat-face':       '/icon-emoji/cat-face.png',
  'cat-paw':        '/icon-emoji/cat-paw.png',
  'location-pin':   '/icon-emoji/paw-shaped location pin.png',
  'house':          '/icon-emoji/house.png',
  'lost-cat':       '/icon-emoji/lost-cat.png',
  'found-cat':      '/icon-emoji/found-cat.png',
  'reunited':       '/icon-emoji/reunited.png',
  'message-chat':   '/icon-emoji/message-chat.png',
  'notification':   '/icon-emoji/notification-bell.png',
  'map':            '/icon-emoji/map.png',
  'search':         '/icon-emoji/search-icon.png',
  'sparkle':        '/icon-emoji/sparkle.png',
  'direction':      '/icon-emoji/direction.png',
  'open-book':      '/icon-emoji/open-book.png',
  'paw-heart':      '/icon-emoji/paw-heart.png',
  'blue-yarn':      '/icon-emoji/blue-yarn.png',
  'yellow-yarn':    '/icon-emoji/yellow-yarn.png',
}

export default function EmojiIcon({ name, size = 20, className = '', alt = '' }) {
  const src = emojiMap[name]
  if (!src) return null

  return (
    <img
      src={src}
      alt={alt || name}
      width={size}
      height={size}
      className={`inline-block object-contain ${className}`}
      style={{ width: `${size}px`, height: `${size}px` }}
      draggable={false}
    />
  )
}

// Export the map for direct use in non-component contexts
export { emojiMap }
