/**
 * API Route: Get Single Lead
 * Fetches a single lead by ID
 */

import { createServerClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const leadId = params.id

    console.log('API /leads/[id] - Request:', { id: leadId })

    // Create server client (uses service role key)
    const supabase = await createServerClient()

    // Verify user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('API /leads/[id] - Auth error:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch the lead using RPC function
    const { data, error } = await supabase.rpc('get_solar_lead_by_id', {
      p_lead_id: parseInt(leadId),
    } as never)

    if (error) {
      console.error('API /leads/[id] - RPC error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    console.log('API /leads/[id] - Success')

    return NextResponse.json({ data })
  } catch (err) {
    console.error('API /leads/[id] - Unexpected error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
