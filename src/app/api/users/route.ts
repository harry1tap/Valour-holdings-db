/**
 * Users API Routes
 * Handles user management operations (admin only)
 */

import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import type { UserProfile } from '@/types/database'

export const dynamic = 'force-dynamic'

/**
 * GET /api/users
 * Fetch all users (admin only)
 */
export async function GET(request: Request) {
  try {
    // 1. Create Supabase client
    const supabase = await createServerClient()

    // 2. Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 3. Get user profile
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

    // 4. Check if admin
    if (profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin only' },
        { status: 403 }
      )
    }

    // 5. Fetch all users (RLS policy handles permissions)
    const { data: users, error: usersError } = await supabase
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (usersError) {
      return NextResponse.json(
        { error: usersError.message },
        { status: 500 }
      )
    }

    return NextResponse.json(users)
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/users
 * Create new user and send invitation email (admin only)
 */
export async function POST(request: Request) {
  try {
    const supabase = await createServerClient()

    // 1. Auth check
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

    // 2. Parse request body
    const body = await request.json()
    const { email, full_name, role, account_manager_name } = body

    // 3. Validate required fields
    if (!email || !full_name || !role) {
      return NextResponse.json(
        { error: 'Missing required fields: email, full_name, role' },
        { status: 400 }
      )
    }

    // 3.5. Validate role (installers cannot be created via UI)
    if (!['admin', 'account_manager', 'field_rep'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Can only create admin, account_manager, or field_rep users.' },
        { status: 400 }
      )
    }

    // 4. Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    // 5. Check if user already exists
    const { data: existingUser } = await supabase
      .from('user_profiles')
      .select('email')
      .eq('email', email)
      .single()

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      )
    }

    // 7. Send invitation email via Supabase Admin API
    // Use admin client (service role key) for inviteUserByEmail
    const adminClient = createAdminClient()
    const { data: invitedUser, error: inviteError } =
      await adminClient.auth.admin.inviteUserByEmail(email, {
        data: {
          full_name,
          role,
          account_manager_name,
        },
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/callback`,
      })

    if (inviteError) {
      return NextResponse.json(
        { error: inviteError.message },
        { status: 500 }
      )
    }

    // 8. Create user_profiles entry
    // Use admin client to bypass RLS policies
    const { data: newProfile, error: profileCreateError } = (await adminClient
      .from('user_profiles')
      .insert({
        id: invitedUser.user.id,
        email,
        full_name,
        role,
        account_manager_name: role === 'field_rep' ? account_manager_name : null,
        is_active: true,
        created_by: user.id,
      } as never)
      .select()
      .single()) as { data: UserProfile | null; error: Error | null }

    if (profileCreateError) {
      return NextResponse.json(
        { error: profileCreateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json(newProfile, { status: 201 })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
