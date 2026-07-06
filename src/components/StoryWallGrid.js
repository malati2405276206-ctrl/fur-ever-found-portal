'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const cuteMessages = [
  'Every cat deserves love',
  'Rescued & loved',
  'Home is where the cat is',
  'Purrfect endings',
  'Whiskers & wishes',
  'Fur-ever grateful',
  'Meow & forever',
  'Tiny paws, big hearts',
  'Saved with love',
  'A tail of hope',
]

const stickerImages = [
  '/icon-emoji/cat-paw.png',
  '/icon-emoji/sparkle.png',
  '/icon-emoji/cat-face.png',
  '/icon-emoji/paw-heart.png',
  '/icon-emoji/yellow-yarn.png',
  '/icon-emoji/blue-yarn.png',
]

export default function StoryWallGrid() {
  const [stories, setStories] = useState([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchStories()
  }, [])

  const fetchStories = async () => {
    const { data, error } = await supabase
      .from('adoption_cats')
      .select('*')
      .eq('status', 'adopted')
      .order('adopted_at', { ascending: false })
      .limit(8)

    if (error) {
      console.error('StoryWallGrid fetch error:', error.message)
    }
    setStories(data || [])
    setLoading(false)
  }

  // Deterministic random-like values based on index
  const getRotation = (i) => {
    const rotations = [-4, 2, -1, 3, -2, 4, -3, 1]
    return rotations[i % rotations.length]
  }

  const getPastelColor = (i) => {
    const colors = ['#fce4ec', '#e8f5e9', '#e3f2fd', '#fff3e0', '#f3e5f5', '#e0f7fa', '#fff9c4', '#fce4ec']
    return colors[i % colors.length]
  }

  const getPosition = (i) => {
    // Grid positions spread across the wall
    const positions = [
      { top: '8%', left: '5%' },
      { top: '5%', left: '35%' },
      { top: '12%', left: '65%' },
      { top: '6%', left: '85%' },
      { top: '52%', left: '8%' },
      { top: '48%', left: '38%' },
      { top: '55%', left: '62%' },
      { top: '50%', left: '85%' },
    ]
    return positions[i % positions.length]
  }

  if (loading) {
    return (
      <section className="py-16 sm:py-20 px-4" style={{ background: 'var(--cream)' }}>
        <div className="max-w-5xl mx-auto text-center">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      </section>
    )
  }

  if (stories.length === 0) {
    return (
      <section className="py-16 sm:py-20 px-4" style={{ background: 'var(--cream)' }}>
        <div className="max-w-5xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-10">
            <h2 className="heading-artistic text-3xl sm:text-4xl mb-3" style={{ color: '#2E4365' }}>
              <img src="/icon-emoji/cat-paw.png" alt="" width={60} height={60} className="inline-block mr-2" />Wall of Happy Tails
            </h2>
            <p className="text-sm sm:text-base" style={{ color: 'var(--sage-600)' }}>
              Every polaroid here is a cat that found their forever home
            </p>
          </div>

          {/* Empty grid wall */}
          <div className="relative mx-auto" style={{ maxWidth: '900px' }}>
            <div
              className="relative rounded-xl border-4 border-gray-800 overflow-hidden flex items-center justify-center"
              style={{
                minHeight: '350px',
                backgroundColor: '#f9f9f7',
                backgroundImage:
                  'linear-gradient(to right, #333 1.5px, transparent 1.5px), linear-gradient(to bottom, #333 1.5px, transparent 1.5px)',
                backgroundSize: '70px 70px',
                boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.1), 0 8px 32px rgba(0,0,0,0.15)',
              }}
            >
              {/* Sticky note placeholder */}
              <div className="bg-yellow-200 p-5 shadow-[2px_3px_8px_rgba(0,0,0,0.15)] text-center" style={{ transform: 'rotate(-2deg)', borderRadius: '2px' }}>
                <p className="mb-1"><img src="/icon-emoji/cat-face.png" alt="" width={60} height={60} className="inline-block" /></p>
                <p className="text-sm text-gray-700" style={{ fontFamily: "'Comic Sans MS', 'Segoe Print', cursive" }}>
                  No stories yet...<br/>Check back soon!
                </p>
              </div>

              {/* Decorative clips */}
              <div className="absolute top-4 left-6 w-3 h-5 rounded-sm" style={{ background: 'linear-gradient(135deg, #d4a056, #a07030)' }} />
              <div className="absolute top-4 right-8 w-3 h-5 rounded-sm" style={{ background: 'linear-gradient(135deg, #888, #555)' }} />
              <div className="absolute opacity-60 top-6 right-20"><img src="/icon-emoji/cat-paw.png" alt="" width={60} height={60} /></div>
              <div className="absolute opacity-60 bottom-6 left-10"><img src="/icon-emoji/sparkle.png" alt="" width={60} height={60} /></div>
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-16 sm:py-20 px-4" style={{ background: 'var(--cream)' }}>
      <div className="max-w-5xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-10">
          <h2 className="heading-artistic text-3xl sm:text-4xl mb-3" style={{ color: '#2E4365' }}>
            <img src="/icon-emoji/cat-paw.png" alt="" width={60} height={60} className="inline-block mr-2" />Wall of Happy Tails
          </h2>
          <p className="text-sm sm:text-base" style={{ color: 'var(--sage-600)' }}>
            Every polaroid here is a cat that found their forever home
          </p>
        </div>

        {/* Grid Wall */}
        <div className="relative mx-auto" style={{ maxWidth: '900px' }}>
          {/* Wire grid frame */}
          <div
            className="relative rounded-xl border-4 border-gray-800 overflow-hidden"
            style={{
              minHeight: '600px',
              backgroundColor: '#f9f9f7',
              backgroundImage:
                'linear-gradient(to right, #333 1.5px, transparent 1.5px), linear-gradient(to bottom, #333 1.5px, transparent 1.5px)',
              backgroundSize: '70px 70px',
              boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.1), 0 8px 32px rgba(0,0,0,0.15)',
            }}
          >
            {/* Polaroids */}
            {stories.map((cat, i) => {
              const pos = getPosition(i)
              const rot = getRotation(i)
              return (
                <div
                  key={cat.id}
                  className="absolute cursor-pointer group transition-all duration-300 hover:scale-110 hover:z-30"
                  style={{ top: pos.top, left: pos.left, transform: `rotate(${rot}deg)`, zIndex: 10 + i }}
                  onClick={() => router.push(`/stories?catId=${cat.id}`)}
                >
                  {/* Clip/tape at top */}
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-8 h-4 rounded-b-sm z-10"
                    style={{ background: 'linear-gradient(135deg, #d4a056, #c4903e)', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }}
                  />

                  {/* Polaroid card */}
                  <div className="p-2 pb-8 shadow-[3px_5px_15px_rgba(0,0,0,0.2)] transition-shadow duration-300 group-hover:shadow-[5px_8px_25px_rgba(0,0,0,0.3)]"
                    style={{ background: getPastelColor(i) }}
                  >
                    {cat.image_url ? (
                      <img
                        src={cat.image_url}
                        alt={cat.name}
                        className="w-[100px] h-[100px] sm:w-[120px] sm:h-[120px] object-cover block"
                      />
                    ) : (
                      <div className="w-[100px] h-[100px] sm:w-[120px] sm:h-[120px] flex items-center justify-center bg-amber-50">
                        <img src="/icon-emoji/cat-face.png" alt="" width={60} height={60} />
                      </div>
                    )}
                    <p className="text-center text-[10px] sm:text-[11px] text-gray-600 mt-2 font-medium truncate max-w-[100px] sm:max-w-[120px]"
                      style={{ fontFamily: "'Comic Sans MS', 'Segoe Print', cursive" }}
                    >
                      {cat.name} <img src="/icon-emoji/paw-heart.png" alt="" width={20} height={20} className="inline-block" />
                    </p>
                  </div>
                </div>
              )
            })}

            {/* Sticky Notes with cute messages */}
            <div
              className="absolute z-[20]"
              style={{ top: '30%', left: '22%', transform: 'rotate(-3deg)' }}
            >
              <div className="bg-yellow-200 p-3 w-[110px] shadow-[2px_3px_8px_rgba(0,0,0,0.12)]" style={{ borderRadius: '2px' }}>
                <p className="text-[10px] text-gray-700 leading-tight" style={{ fontFamily: "'Comic Sans MS', 'Segoe Print', cursive" }}>
                  {cuteMessages[0]}
                </p>
              </div>
            </div>

            <div
              className="absolute z-[20]"
              style={{ top: '72%', left: '45%', transform: 'rotate(2deg)' }}
            >
              <div className="bg-pink-200 p-3 w-[100px] shadow-[2px_3px_8px_rgba(0,0,0,0.12)]" style={{ borderRadius: '2px' }}>
                <p className="text-[10px] text-gray-700 leading-tight" style={{ fontFamily: "'Comic Sans MS', 'Segoe Print', cursive" }}>
                  {cuteMessages[1]}
                </p>
              </div>
            </div>

            <div
              className="absolute z-[20]"
              style={{ top: '38%', left: '78%', transform: 'rotate(-1.5deg)' }}
            >
              <div className="bg-blue-100 p-3 w-[105px] shadow-[2px_3px_8px_rgba(0,0,0,0.12)]" style={{ borderRadius: '2px' }}>
                <p className="text-[10px] text-gray-700 leading-tight" style={{ fontFamily: "'Comic Sans MS', 'Segoe Print', cursive" }}>
                  {cuteMessages[2]}
                </p>
              </div>
            </div>

            <div
              className="absolute z-[20]"
              style={{ top: '78%', left: '12%', transform: 'rotate(3deg)' }}
            >
              <div className="bg-green-100 p-3 w-[100px] shadow-[2px_3px_8px_rgba(0,0,0,0.12)]" style={{ borderRadius: '2px' }}>
                <p className="text-[10px] text-gray-700 leading-tight" style={{ fontFamily: "'Comic Sans MS', 'Segoe Print', cursive" }}>
                  {cuteMessages[3]}
                </p>
              </div>
            </div>

            {/* Scattered stickers */}
            <div className="absolute opacity-70 z-[4]" style={{ top: '18%', left: '52%', transform: 'rotate(15deg)' }}>
              <img src={stickerImages[0]} alt="" width={24} height={24} />
            </div>
            <div className="absolute opacity-60 z-[4]" style={{ top: '42%', left: '48%', transform: 'rotate(-10deg)' }}>
              <img src={stickerImages[1]} alt="" width={20} height={20} />
            </div>
            <div className="absolute opacity-70 z-[4]" style={{ top: '68%', left: '72%', transform: 'rotate(8deg)' }}>
              <img src={stickerImages[2]} alt="" width={24} height={24} />
            </div>
            <div className="absolute opacity-60 z-[4]" style={{ top: '85%', left: '88%', transform: 'rotate(-5deg)' }}>
              <img src={stickerImages[3]} alt="" width={18} height={18} />
            </div>
            <div className="absolute opacity-60 z-[4]" style={{ top: '90%', left: '58%', transform: 'rotate(12deg)' }}>
              <img src={stickerImages[4]} alt="" width={24} height={24} />
            </div>
            <div className="absolute opacity-70 z-[4]" style={{ top: '25%', left: '90%', transform: 'rotate(-8deg)' }}>
              <img src={stickerImages[5]} alt="" width={18} height={18} />
            </div>

            {/* Extra clips on grid wires */}
            <div className="absolute w-3 h-5 rounded-sm z-[3]" style={{ top: '45%', left: '3%', background: 'linear-gradient(135deg, #d4a056, #a07030)', transform: 'rotate(2deg)' }} />
            <div className="absolute w-3 h-5 rounded-sm z-[3]" style={{ top: '20%', left: '55%', background: 'linear-gradient(135deg, #888, #555)', transform: 'rotate(-3deg)' }} />
            <div className="absolute w-3 h-5 rounded-sm z-[3]" style={{ top: '60%', left: '95%', background: 'linear-gradient(135deg, #d4a056, #a07030)', transform: 'rotate(1deg)' }} />
          </div>
        </div>

        {/* CTA to stories page */}
        <div className="text-center mt-8">
          <a
            href="/stories"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm transition-all hover:scale-105"
            style={{ background: '#2E4365', color: '#F3D58D' }}
          >
            <img src="/icon-emoji/open-book.png" alt="" width={40} height={40} className="inline-block" /> Read All Stories
          </a>
        </div>
      </div>
    </section>
  )
}
