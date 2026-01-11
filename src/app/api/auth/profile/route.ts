/**
 * GET /api/auth/profile
 * Fetch current user's profile (authenticated users only)
 *
 * This API route fetches the user profile from the server-side where RLS policies
 * work reliably. Used by the useAuth hook to avoid race conditions with browser
 * client authentication timing.
 */

import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { UserProfile } from '@/types/database'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    // Create server-side Supabase client
    const supabase = await createServerClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch user profile (RLS works correctly server-side)
    const { data: profile, error: profileError } = (await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single()) as { data: UserProfile | null; error: Error | null }

    if (profileError) {
      console.error('Profile fetch error:', profileError)
      return NextResponse.json(
        { error: profileError.message },
        { status: 500 }
      )
    }

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(profile)
  } catch (error) {
    console.error('Error in /api/auth/profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
