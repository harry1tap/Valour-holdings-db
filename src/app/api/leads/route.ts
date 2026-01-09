/**
 * API Route: Leads Management
 * Handles CRUD operations for solar leads with pagination and filters
 */

import { createServerClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import type { LeadFilters, PaginationInfo, SolarLead } from '@/types/leads'
import type { UserProfile } from '@/types/database'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      page = 1,
      limit = 25,
      sortBy = 'Created_At',
      sortOrder = 'desc',
      filters = {},
    } = body

    console.log('API /leads - Request:', {
      page,
      limit,
      sortBy,
      sortOrder,
      filters,
    })

    // Create server client (uses service role key)
    const supabase = await createServerClient()

    // Verify user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('API /leads - Auth error:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('API /leads - User authenticated:', user.id)

    // Get user profile for role-based filtering
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role, full_name')
      .eq('id', user.id)
      .single() as { data: Pick<UserProfile, 'role' | 'full_name'> | null; error: Error | null }

    if (profileError || !profile) {
      console.error('API /leads - Profile error:', profileError)
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    console.log('API /leads - User profile:', profile)

    // Call RPC function for fetching leads
    const { data, error } = await supabase.rpc('get_solar_leads', {
      p_page: page,
      p_limit: limit,
      p_sort_by: sortBy,
      p_sort_order: sortOrder,
      p_search: filters.search || null,
      p_status: filters.status || null,
      p_survey_status: filters.surveyStatus || null,
      p_account_manager: filters.accountManager || null,
      p_field_rep: filters.fieldRep || null,
      p_date_from: filters.dateFrom || null,
      p_date_to: filters.dateTo || null,
      p_postcode: filters.postcode || null,
      p_user_role: profile.role,
      p_user_name: profile.full_name,
    } as never)

    if (error) {
      console.error('API /leads - RPC error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Parse JSONB response from RPC function
    const result = data as { data: SolarLead[]; total: number }

    // Build pagination info
    const pagination: PaginationInfo = {
      page,
      limit,
      total: result.total,
      totalPages: Math.ceil(result.total / limit),
    }

    console.log('API /leads - Success:', result.data.length, 'leads returned')

    return NextResponse.json({
      data: result.data,
      pagination,
    })
  } catch (err) {
    console.error('API /leads - Unexpected error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT - Update an existing lead
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json({ error: 'Lead ID is required' }, { status: 400 })
    }

    console.log('API /leads PUT - Request:', { id, updateData })

    // Create server client (uses service role key)
    const supabase = await createServerClient()

    // Verify user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('API /leads PUT - Auth error:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile for role-based permissions
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role, full_name')
      .eq('id', user.id)
      .single() as { data: Pick<UserProfile, 'role' | 'full_name'> | null; error: Error | null }

    if (profileError || !profile) {
      console.error('API /leads PUT - Profile error:', profileError)
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    // Role-based permission check
    // Field reps can only edit Notes and Installer_Notes
    if (profile.role === 'field_rep') {
      const allowedFields = ['Notes', 'Installer_Notes']
      const editedFields = Object.keys(updateData)
      const hasUnauthorizedFields = editedFields.some(
        (field) => !allowedFields.includes(field)
      )

      if (hasUnauthorizedFields) {
        return NextResponse.json(
          { error: 'Insufficient permissions to edit these fields' },
          { status: 403 }
        )
      }
    }

    // Update the lead using RPC function
    const { data, error } = await supabase.rpc('update_solar_lead', {
      p_lead_id: id,
      p_lead_data: updateData,
    } as never)

    if (error) {
      console.error('API /leads PUT - Update error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('API /leads PUT - Success')

    return NextResponse.json({ data })
  } catch (err) {
    console.error('API /leads PUT - Unexpected error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE - Delete a lead
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Lead ID is required' }, { status: 400 })
    }

    console.log('API /leads DELETE - Request:', { id })

    // Create server client (uses service role key)
    const supabase = await createServerClient()

    // Verify user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('API /leads DELETE - Auth error:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile for role-based permissions
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role, full_name')
      .eq('id', user.id)
      .single() as { data: Pick<UserProfile, 'role' | 'full_name'> | null; error: Error | null }

    if (profileError || !profile) {
      console.error('API /leads DELETE - Profile error:', profileError)
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    // Only admins and account managers can delete leads
    if (profile.role === 'field_rep') {
      return NextResponse.json(
        { error: 'Insufficient permissions to delete leads' },
        { status: 403 }
      )
    }

    // Delete the lead using RPC function
    const { data, error } = await supabase.rpc('delete_solar_lead', {
      p_lead_id: parseInt(id),
    } as never)

    if (error) {
      console.error('API /leads DELETE - Delete error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    console.log('API /leads DELETE - Success')

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('API /leads DELETE - Unexpected error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
