/**
 * API Route: Dashboard Metrics
 * Calls the calculate_dashboard_metrics function server-side with service role
 */

import { createServerClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import type { UserProfile } from '@/types/database'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { dateFrom, dateTo } = body

    console.log('API /metrics - Request:', { dateFrom, dateTo })

    // Create server client (uses service role key)
    const supabase = await createServerClient()

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('API /metrics - Auth error:', authError)
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user profile for role-based filtering
    const { data: profile, error: profileError } = (await supabase
      .from('user_profiles')
      .select('role, full_name, organization')
      .eq('id', user.id)
      .single()) as { data: Pick<UserProfile, 'role' | 'full_name' | 'organization'> | null; error: Error | null }

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    console.log('API /metrics - User role:', profile.role)

    // Call the RPC function with server-side role enforcement
    const { data, error } = await supabase.rpc('calculate_dashboard_metrics', {
      p_date_from: dateFrom,
      p_date_to: dateTo,
      p_user_role: profile.role,
      p_user_name: profile.full_name,
      p_organization: profile.organization,
    } as never)

    if (error) {
      console.error('API /metrics - RPC error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    console.log('API /metrics - Success:', data)

    // The function returns a single row, but might be wrapped in an array
    const metricsData = Array.isArray(data) && (data as unknown[]).length > 0 ? data[0] : data

    return NextResponse.json({ data: metricsData })
  } catch (err) {
    console.error('API /metrics - Unexpected error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
