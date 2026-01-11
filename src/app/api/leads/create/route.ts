/**
 * API Route: Create Lead
 * Handles creation of new solar leads
 */

import { createServerClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import type { UserProfile } from '@/types/database'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    console.log('API /leads/create - Request:', body)

    // Create server client (uses service role key)
    const supabase = await createServerClient()

    // Verify user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('API /leads/create - Auth error:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile for role-based permissions
    const { data: profile, error: profileError } = (await supabase
      .from('user_profiles')
      .select('role, full_name')
      .eq('id', user.id)
      .single()) as { data: Pick<UserProfile, 'role' | 'full_name'> | null; error: Error | null }

    if (profileError || !profile) {
      console.error('API /leads/create - Profile error:', profileError)
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    // Only admins and account managers can create leads
    if (profile.role !== 'admin' && profile.role !== 'account_manager') {
      return NextResponse.json(
        { error: 'Insufficient permissions to create leads' },
        { status: 403 }
      )
    }

    // Validate required fields
    const requiredFields = [
      'Customer_Name',
      'Customer_Tel',
      'First_Line_Of_Address',
      'Postcode',
    ]

    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 }
        )
      }
    }

    // Insert the new lead using RPC function with role check
    const { data, error } = await supabase.rpc('create_solar_lead', {
      p_lead_data: body,
      p_user_role: profile.role,
    } as never)

    if (error) {
      console.error('API /leads/create - RPC error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('API /leads/create - Success')

    return NextResponse.json({ data })
  } catch (err) {
    console.error('API /leads/create - Unexpected error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
