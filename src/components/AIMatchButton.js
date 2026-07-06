// src/components/AIMatchButton.js
'use client'

import { checkRateLimit } from '@/lib/rateLimit'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function AIMatchButton({ lostCat }) {
  const [matches,   setMatches]   = useState([])
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')
  const [searched,  setSearched]  = useState(false)

  const handleFindMatches = async () => {

    // Rate limit check
    const { allowed, message } = checkRateLimit('aiMatch')
    if (!allowed) {
        setError(message)
        return
    }

    setLoading(true)
    setError('')
    setMatches([])

    try {
      // Step 1: Fetch all found cats from Supabase
      const { data: foundCats, error: fetchError } = await supabase
        .from('found_cats')
        .select('*')
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      if (!foundCats || foundCats.length === 0) {
        setError('No found cat reports exist yet to match against.')
        setSearched(true)
        setLoading(false)
        return
      }

      // Step 2: Send to our AI API route
      const response = await fetch('/api/match-cats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lostCat, foundCats }),
      })

      if (!response.ok) throw new Error('AI matching failed')

      const data = await response.json()
      setMatches(data.matches || [])
      setSearched(true)

      if (data.source === 'local') {
          console.info('Using local matching algorithm')
        }

      const strongMatches = (data.matches || []).filter((m) => m.score >= 75)

        if (strongMatches.length > 0) {
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            await supabase.from('notifications').insert({
              user_id: user.id,
              type: 'ai_match',
              title: `Strong match found for ${lostCat.name}! 🤖`,
              body: `${strongMatches[0].score}% match — ${strongMatches[0].reason}`,
              link: '/lost-cats',
            })
          }
        }


    } catch (err) {
      setError('Something went wrong. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const scoreColor = (score) => {
    if (score >= 75) return 'text-green-600 bg-green-100'
    if (score >= 50) return 'text-amber-600 bg-amber-100'
    return 'text-gray-500 bg-gray-100'
  }

  const scoreLabel = (score) => {
    if (score >= 75) return 'Strong Match'
    if (score >= 50) return 'Possible Match'
    return 'Weak Match'
  }

  return (
    <div className="mt-3">

      {/* Find Matches Button */}
      {!searched && (
        <button
          onClick={handleFindMatches}
          disabled={loading}
          className="w-full bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-300 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl transition text-sm flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
              AI is searching...
            </>
          ) : (
            '🤖 Find AI Matches'
          )}
        </button>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-xs px-3 py-2 rounded-xl mt-2">
          ⚠️ {error}
        </div>
      )}

      {/* Results */}
      {searched && !error && (
        <div className="mt-3">

          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest">
              🤖 AI Match Results
            </p>
            <button
              onClick={() => { setSearched(false); setMatches([]); setError('') }}
              className="text-xs text-gray-400 hover:text-gray-600 transition"
            >
              Search again
            </button>
          </div>

          {/* No matches */}
          {matches.length === 0 && (
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <p className="mb-1"><img src="/icon-emoji/search-icon.png" alt="" width={60} height={60} className="inline-block" /></p>
              <p className="text-gray-500 text-xs">No strong matches found yet.</p>
              <p className="text-gray-400 text-xs mt-0.5">Check back as more found cats are reported.</p>
            </div>
          )}

          {/* Match cards */}
          {matches.length > 0 && (
            <div className="space-y-2">
              {matches.map((match, i) => (
                <div key={match.id} className="bg-indigo-50 border border-indigo-100 rounded-xl p-3">
                  <div className="flex gap-3">

                    {/* Rank */}
                    <div className="w-6 h-6 bg-indigo-500 text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                      {i + 1}
                    </div>

                    {/* Found cat image */}
                    {match.foundCat?.image_url ? (
                      <img src={match.foundCat.image_url} alt="Found cat" className="w-14 h-14 rounded-lg object-cover shrink-0" />
                    ) : (
                      <div className="w-14 h-14 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0"><img src="/icon-emoji/cat-face.png" alt="" width={60} height={60} /></div>
                    )}

                    {/* Match info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${scoreColor(match.score)}`}>
                          {match.score}% — {scoreLabel(match.score)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 line-clamp-2 mb-1">{match.foundCat?.description}</p>
                      <p className="text-xs text-indigo-500 font-medium flex items-center gap-1"><img src="/icon-emoji/paw-shaped location pin.png" alt="" width={60} height={60} className="inline-block" /> {match.foundCat?.location}</p>
                      <p className="text-xs text-gray-400 mt-0.5 italic">{match.reason}</p>
                    </div>
                  </div>

                  {/* Contact finder */}
                  <a 
                    href={"mailto:"+ match.foundCat?.contact_email + "?subject=I think you found my cat!&body=Hi! I saw your found cat report on Fur Ever Found and I believe it might be my lost cat" + lostCat?.name + ". Can we connect?"}
                    className="mt-2 block w-full text-center bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-semibold py-2 rounded-lg transition"
                  >
                    📧 Contact the Finder
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}