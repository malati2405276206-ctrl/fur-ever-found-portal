// src/app/api/match-cats/route.js
import { NextResponse } from 'next/server'

// Server-side rate limiting (same as before)
const rateLimitStore = new Map()

function serverRateLimit(ip) {
  const now      = Date.now()
  const windowMs = 60 * 60 * 1000
  const maxReqs  = 30 // generous for free tier
  const record   = rateLimitStore.get(ip) || []
  const recent   = record.filter((t) => now - t < windowMs)
  if (recent.length >= maxReqs) return false
  recent.push(now)
  rateLimitStore.set(ip, recent)
  return true
}

export async function POST(request) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown'
    if (!serverRateLimit(ip)) {
      return NextResponse.json({ error: 'Too many requests.' }, { status: 429 })
    }

    const { lostCat, foundCats } = await request.json()

    if (!lostCat || !foundCats || foundCats.length === 0) {
      return NextResponse.json({ error: 'Missing data' }, { status: 400 })
    }

    if (!lostCat.description || !lostCat.name) {
      return NextResponse.json({ error: 'Invalid lost cat data' }, { status: 400 })
    }

    const limitedFoundCats = foundCats.slice(0, 20)

    // ── Build prompt for Gemini ──────────────────────
    const prompt = `You are a cat matching assistant for a lost and found cat portal called "Fur Ever Found".

A cat owner is looking for their lost cat. Compare the lost cat description with each found cat report and return the top 3 best matches with a similarity score.

LOST CAT:
Name: ${lostCat.name}
Description: ${lostCat.description}
Last seen location: ${lostCat.location}

FOUND CATS:
${limitedFoundCats.map((cat, i) => `[${i}]
ID: ${cat.id}
Description: ${cat.description}
Location: ${cat.location}
Date: ${cat.created_at}`).join('\n\n')}

IMPORTANT: Return ONLY a valid JSON array. No explanation, no markdown, no code blocks.
Format exactly like this:
[{"id":"the_found_cat_id","score":85,"reason":"One short sentence why they match"}]

Rules:
- score is 0-100 (100 = perfect match)
- Only include matches with score above 30
- Maximum 3 matches
- If no good matches exist, return exactly: []`

    // ── Call Gemini API ──────────────────────────────
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`

    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature:     0.1,  // low = more deterministic, better for structured output
          maxOutputTokens: 500,
        },
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT',        threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_HATE_SPEECH',       threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
        ]
      }),
    })

    if (!response.ok) {
      const errData = await response.json()
      console.error('Gemini API error:', JSON.stringify(errData, null, 2))
      return NextResponse.json(
        { error: 'AI service error', details: errData },
        { status: 500 }
      )
    }

    const data = await response.json()

    // ── Extract text from Gemini response ────────────
    // Gemini response structure is different from Anthropic
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]'

    // ── Parse JSON safely ─────────────────────────────
    let matches = []
    try {
      // Strip any accidental markdown code blocks Gemini might add
      const cleaned = rawText
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim()

      matches = JSON.parse(cleaned)
      if (!Array.isArray(matches)) matches = []

    } catch {
      console.error('Failed to parse Gemini response:', rawText)
      matches = []
    }

    // ── Enrich matches with full found cat data ───────
    const enrichedMatches = matches
      .slice(0, 3)
      .map((match) => {
        if (!match.id || typeof match.score !== 'number') return null
        const foundCat = limitedFoundCats.find((c) => c.id === match.id)
        return foundCat ? { ...match, foundCat } : null
      })
      .filter(Boolean)

    return NextResponse.json({ matches: enrichedMatches })

  } catch (err) {
    console.error('Match API error:', err)
    return NextResponse.json(
      { error: 'Server error', details: err.message },
      { status: 500 }
    )
  }
}