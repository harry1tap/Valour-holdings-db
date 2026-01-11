/**
 * API Route: Get Single Lead
 * Fetches a single lead by ID
 */

import { createServerClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import type { UserProfile } from '@/types/database'

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

    // Get user profile for role-based access
    const { data: profile, error: profileError } = (await supabase
      .from('user_profiles')
      .select('role, full_name, organization')
      .eq('id', user.id)
      .single()) as { data: Pick<UserProfile, 'role' | 'full_name' | 'organization'> | null; error: Error | null }

    if (profileError || !profile) {
      console.error('API /leads/[id] - Profile error:', profileError)
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    console.log('API /leads/[id] - User role:', profile.role)

    // Fetch the lead using RPC function with role-based filtering
    const { data, error } = await supabase.rpc('get_solar_lead_by_id', {
      p_lead_id: parseInt(leadId),
      p_user_role: profile.role,
      p_user_name: profile.full_name,
      p_organization: profile.organization,
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
