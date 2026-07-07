// src/app/api/admin/approve-ngo/route.js
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const ADMIN_PASSWORD = 'furever2024admin'

// Service role client bypasses RLS — used for admin operations
function getAdminClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY not configured')
  }
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    serviceKey,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function POST(request) {
  try {
    const body = await request.json()
    const { adminPassword, action, ngoRequest } = body

    // Verify admin password
    if (adminPassword !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!ngoRequest || !ngoRequest.id) {
      return NextResponse.json({ error: 'Missing ngoRequest data' }, { status: 400 })
    }

    const supabase = getAdminClient()

    if (action === 'approve') {
      const source = ngoRequest._source

      if (source === 'ngo_verification_requests') {
        // Update request status
        const { error: reqErr } = await supabase
          .from('ngo_verification_requests')
          .update({ status: 'approved', verified_at: new Date().toISOString() })
          .eq('id', ngoRequest.id)

        if (reqErr) return NextResponse.json({ error: reqErr.message }, { status: 500 })

        // Update profiles.role to 'ngo'
        const { error: roleErr } = await supabase
          .from('profiles')
          .update({ role: 'ngo' })
          .eq('id', ngoRequest.user_id)

        if (roleErr) console.error('Role update error:', roleErr.message)

        // Create ngo_profiles entry
        await supabase.from('ngo_profiles').upsert({
          user_id: ngoRequest.user_id,
          org_name: ngoRequest.org_name,
          org_description: ngoRequest.org_description,
          city: ngoRequest.city,
          website: ngoRequest.website,
          contact_phone: ngoRequest.phone,
          verified: true,
        }, { onConflict: 'user_id' })

      } else {
        // Legacy ngo_profiles path
        const { error: verifyErr } = await supabase
          .from('ngo_profiles')
          .update({ verified: true })
          .eq('id', ngoRequest.id)

        if (verifyErr) return NextResponse.json({ error: verifyErr.message }, { status: 500 })

        // Update profiles.role to 'ngo'
        if (ngoRequest.user_id) {
          const { error: roleErr } = await supabase
            .from('profiles')
            .update({ role: 'ngo' })
            .eq('id', ngoRequest.user_id)

          if (roleErr) console.error('Role update error:', roleErr.message)
        }
      }

      return NextResponse.json({ success: true, message: 'NGO approved' })

    } else if (action === 'reject') {
      const source = ngoRequest._source

      if (source === 'ngo_verification_requests') {
        await supabase
          .from('ngo_verification_requests')
          .update({ status: 'rejected' })
          .eq('id', ngoRequest.id)
      } else {
        await supabase
          .from('ngo_profiles')
          .delete()
          .eq('id', ngoRequest.id)
      }

      return NextResponse.json({ success: true, message: 'NGO rejected' })

    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (err) {
    console.error('Admin API error:', err)
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 })
  }
}
