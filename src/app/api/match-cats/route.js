// src/app/api/match-cats/route.js
import { NextResponse } from 'next/server'

// Simple in-memory store for server-side rate limiting
// Resets when server restarts (good enough for dev/hackathon)
const rateLimitStore = new Map()

function serverRateLimit(ip) {
  const now       = Date.now()
  const windowMs  = 60 * 60 * 1000  // 1 hour
  const maxReqs   = 20               // 20 AI requests per IP per hour

  const record = rateLimitStore.get(ip) || []
  const recent = record.filter((t) => now - t < windowMs)

  if (recent.length >= maxReqs) {
    return false
  }

  recent.push(now)
  rateLimitStore.set(ip, recent)
  return true
}

export async function POST(request) {
  try {
    // Get client IP
    const ip = request.headers.get('x-forwarded-for') || 'unknown'

    // Server-side rate limit check
    if (!serverRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    const { lostCat, foundCats } = await request.json()

    // Validate input exists
    if (!lostCat || !foundCats || foundCats.length === 0) {
      return NextResponse.json({ error: 'Missing data' }, { status: 400 })
    }

    // Validate lostCat has required fields
    if (!lostCat.description || !lostCat.name) {
      return NextResponse.json({ error: 'Invalid lost cat data' }, { status: 400 })
    }

    // Limit foundCats to 20 most recent to keep prompt size reasonable
    const limitedFoundCats = foundCats.slice(0, 20)

    const prompt = `You are a cat matching assistant for a lost and found cat portal called "Fur Ever Found".

A cat owner is looking for their lost cat. Compare the lost cat's description with each found cat report and return the top 3 best matches with a similarity score.

LOST CAT:
Name: ${lostCat.name}
Description: ${lostCat.description}
Last seen location: ${lostCat.location}

FOUND CATS:
${limitedFoundCats.map((cat, index) => `
[${index}]
ID: ${cat.id}
Description: ${cat.description}
Location found: ${cat.location}
Date found: ${cat.created_at}
`).join('\n')}

Instructions:
- Compare physical descriptions carefully (color, size, markings, breed)
- Consider location proximity as a bonus factor
- Return ONLY a valid JSON array with exactly up to 3 matches
- Do NOT include any explanation or text outside the JSON
- Format must be exactly:
[
  {
    "id": "the found cat's id",
    "score": 85,
    "reason": "One short sentence why they match"
  }
]
- Score is 0-100 (100 = perfect match)
- Only include matches with score above 30
- If no good matches exist, return an empty array []`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 500,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!response.ok) {
      const errData = await response.json()
      console.error('Claude API error:', errData)
      return NextResponse.json({ error: 'AI service error' }, { status: 500 })
    }

    const data     = await response.json()
    const rawText  = data.content?.[0]?.text || '[]'

    let matches = []
    try {
      const cleaned = rawText.replace(/```json|```/g, '').trim()
      matches = JSON.parse(cleaned)

      // Validate matches is actually an array
      if (!Array.isArray(matches)) matches = []

    } catch {
      console.error('Failed to parse Claude response:', rawText)
      matches = []
    }

    const enrichedMatches = matches
      .slice(0, 3)
      .map((match) => {
        // Validate match structure
        if (!match.id || typeof match.score !== 'number') return null
        const foundCat = limitedFoundCats.find((c) => c.id === match.id)
        return foundCat ? { ...match, foundCat } : null
      })
      .filter(Boolean)

    return NextResponse.json({ matches: enrichedMatches })

  } catch (err) {
    console.error('Match API error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}