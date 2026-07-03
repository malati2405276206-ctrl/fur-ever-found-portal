// src/app/api/match-cats/route.js
import { NextResponse } from 'next/server'

const rateLimitStore = new Map()

function serverRateLimit(ip) {
  const now     = Date.now()
  const window  = 60 * 60 * 1000
  const max     = 30
  const record  = rateLimitStore.get(ip) || []
  const recent  = record.filter((t) => now - t < window)
  if (recent.length >= max) return false
  recent.push(now)
  rateLimitStore.set(ip, recent)
  return true
}

function smartMatch(lostCat, foundCats) {
  const norm = (str) => (str || '').toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean)

  const COLORS    = ['black','white','orange','grey','gray','brown','tabby','calico','ginger','cream','golden','striped','spotted','tortoiseshell','tuxedo']
  const SIZES     = ['small','large','big','tiny','kitten','adult','fat','thin','fluffy','slim','medium']
  const FEATURES  = ['collar','stripe','spot','patch','scar','ear','tail','eye','paw','mark','long','short','torn','bent','missing']
  const BREEDS    = ['persian','siamese','bengal','maine','ragdoll','british','scottish','domestic','shorthair','longhair']

  const lostWords = norm(`${lostCat.description} ${lostCat.name}`)

  return foundCats.map((foundCat) => {
    const foundWords = norm(foundCat.description)
    let score = 0
    const reasons = []

    // Color match — 35 points max
    const lc = COLORS.filter((c) => lostWords.includes(c))
    const fc = COLORS.filter((c) => foundWords.includes(c))
    const cm = lc.filter((c) => fc.includes(c))
    if (cm.length > 0) {
      score += Math.min(cm.length * 18, 35)
      reasons.push(`Both described as ${cm.slice(0, 2).join(' and ')}`)
    }

    // Size/type match — 20 points max
    const ls = SIZES.filter((s) => lostWords.includes(s))
    const fs = SIZES.filter((s) => foundWords.includes(s))
    const sm = ls.filter((s) => fs.includes(s))
    if (sm.length > 0) {
      score += Math.min(sm.length * 10, 20)
      reasons.push(`Similar build: ${sm.join(', ')}`)
    }

    // Feature match — 20 points max
    const lf = FEATURES.filter((f) => lostWords.includes(f))
    const ff = FEATURES.filter((f) => foundWords.includes(f))
    const fm = lf.filter((f) => ff.includes(f))
    if (fm.length > 0) {
      score += Math.min(fm.length * 10, 20)
      reasons.push(`Matching features: ${fm.join(', ')}`)
    }

    // Breed match — 15 points
    const lb = BREEDS.filter((b) => lostWords.includes(b))
    const fb = BREEDS.filter((b) => foundWords.includes(b))
    if (lb.some((b) => fb.includes(b))) {
      score += 15
      reasons.push(`Same breed type`)
    }

    // Location proximity — 10 points
    const ll = norm(lostCat.location).filter((w) => w.length > 3)
    const fl = norm(foundCat.location).filter((w) => w.length > 3)
    if (ll.some((w) => fl.includes(w))) {
      score += 10
      reasons.push(`Found in similar area`)
    }

    const reason = reasons.length > 0 ? reasons[0] : 'Some physical similarities found'
    return { id: foundCat.id, score: Math.min(score, 100), reason, foundCat }
  })
  .filter((m) => m.score >= 25)
  .sort((a, b) => b.score - a.score)
  .slice(0, 3)
}

export async function POST(request) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown'
    if (!serverRateLimit(ip)) {
      return NextResponse.json({ error: 'Too many requests.' }, { status: 429 })
    }

    const { lostCat, foundCats } = await request.json()

    if (!lostCat || !foundCats || foundCats.length === 0) {
      return NextResponse.json({ matches: [] })
    }

    const matches = smartMatch(lostCat, foundCats.slice(0, 20))
    return NextResponse.json({ matches })

  } catch (err) {
    console.error('Match error:', err)
    return NextResponse.json({ matches: [] })
  }
}