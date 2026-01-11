/**
 * Logout API Route
 * Signs out user from Supabase and clears session cookies
 */

import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient()

    // Sign out from Supabase (clears session)
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error('Logout error:', error)
      return NextResponse.json(
        { error: 'Failed to logout' },
        { status: 500 }
      )
    }

    // Redirect to login page
    return NextResponse.redirect(new URL('/login', request.url))
  } catch (error) {
    console.error('Logout exception:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
