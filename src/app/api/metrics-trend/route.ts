/**
 * API Route: Metrics Trend
 * Fetches time-series metrics data for charts
 */

import { createServerClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

interface MetricsTrendItem {
  date: string
  value: number
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { dateFrom, dateTo, interval = 'day' } = body

    console.log('API /metrics-trend - Request:', { dateFrom, dateTo, interval })

    // Create server client (uses service role key)
    const supabase = await createServerClient()

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('API /metrics-trend - Auth error:', authError)
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user profile for role-based filtering
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role, full_name, organization')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    console.log('API /metrics-trend - User role:', profile.role)

    // Call the RPC function with server-side role enforcement
    const { data, error } = await supabase.rpc('get_metrics_trend', {
      p_date_from: dateFrom,
      p_date_to: dateTo,
      p_user_role: profile.role,
      p_user_name: profile.full_name,
      p_organization: profile.organization,
      p_interval: interval,
    } as never)

    if (error) {
      console.error('API /metrics-trend - RPC error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    // Format data - date field comes as string from RPC
    const trendData = (data as MetricsTrendItem[] | null)?.map((item: MetricsTrendItem) => ({
      date: item.date,
      value: item.value,
    })) || []

    console.log('API /metrics-trend - Success:', trendData.length, 'data points')

    return NextResponse.json({ data: trendData })
  } catch (err) {
    console.error('API /metrics-trend - Unexpected error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
