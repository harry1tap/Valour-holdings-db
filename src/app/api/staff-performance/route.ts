/**
 * API Route: Staff Performance
 * Fetches per-staff performance metrics with role-based filtering
 */

import { createServerClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { dateFrom, dateTo, accountManager } = body

    console.log('API /staff-performance - Request:', {
      dateFrom,
      dateTo,
      accountManager,
    })

    // Create server client (uses service role key)
    const supabase = await createServerClient()

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('API /staff-performance - Auth error:', authError)
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('API /staff-performance - User authenticated:', user.id)

    // Call the RPC function
    const { data, error } = await supabase.rpc('get_staff_performance', {
      p_date_from: dateFrom,
      p_date_to: dateTo,
      p_account_manager: accountManager,
    } as never)

    if (error) {
      console.error('API /staff-performance - RPC error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    console.log('API /staff-performance - Success:', (data as unknown[])?.length || 0, 'staff members')

    return NextResponse.json({ data })
  } catch (err) {
    console.error('API /staff-performance - Unexpected error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
