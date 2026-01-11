/**
 * Individual User API Routes
 * Handles get, update, and deactivate operations for specific users (admin only)
 */

import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { UserProfile } from '@/types/database'

export const dynamic = 'force-dynamic'

/**
 * GET /api/users/[id]
 * Get single user details (admin only)
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerClient()

    // Auth check (admin only)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile, error: profileError } = (await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single()) as { data: UserProfile | null; error: Error | null }

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    if (profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Fetch user by ID
    const { data: targetUser, error: userError } = (await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', params.id)
      .single()) as { data: UserProfile | null; error: Error | null }

    if (userError) {
      return NextResponse.json({ error: userError.message }, { status: 500 })
    }

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json(targetUser)
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/users/[id]
 * Update user details (admin only)
 */
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerClient()

    // Auth check (admin only)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile, error: profileError } = (await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single()) as { data: UserProfile | null; error: Error | null }

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    if (profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Parse body
    const body = await request.json()
    const { full_name, role, account_manager_name } = body as {
      full_name: string
      role: string
      account_manager_name?: string | null
    }

    // Validate required fields
    if (!full_name || !role) {
      return NextResponse.json(
        { error: 'Missing required fields: full_name, role' },
        { status: 400 }
      )
    }

    // Validate role
    if (!['admin', 'account_manager', 'field_rep', 'installer'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      )
    }

    // Update user
    const { data: updatedUser, error: updateError } = (await supabase
      .from('user_profiles')
      .update({
        full_name: full_name,
        role: role,
        account_manager_name: role === 'field_rep' ? account_manager_name : null,
      } as never)
      .eq('id', params.id)
      .select()
      .single()) as { data: UserProfile | null; error: Error | null }

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      )
    }

    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/users/[id]
 * Deactivate user (soft delete - set is_active = false) (admin only)
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerClient()

    // Auth check (admin only)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile, error: profileError } = (await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single()) as { data: UserProfile | null; error: Error | null }

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    if (profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Prevent admin from deactivating themselves
    if (params.id === user.id) {
      return NextResponse.json(
        { error: 'Cannot deactivate your own account' },
        { status: 400 }
      )
    }

    // Soft delete - set is_active = false
    const { data: deactivatedUser, error: deactivateError } = (await supabase
      .from('user_profiles')
      .update({ is_active: false } as never)
      .eq('id', params.id)
      .select()
      .single()) as { data: UserProfile | null; error: Error | null }

    if (deactivateError) {
      return NextResponse.json(
        { error: deactivateError.message },
        { status: 500 }
      )
    }

    if (!deactivatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json(deactivatedUser)
  } catch (error) {
    console.error('Error deactivating user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
