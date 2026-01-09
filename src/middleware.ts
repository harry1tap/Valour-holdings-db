/**
 * Next.js Middleware for Authentication
 *
 * This middleware:
 * 1. Refreshes Supabase sessions automatically
 * 2. Protects authenticated routes (/dashboard, /leads, /team, /settings)
 * 3. Redirects unauthenticated users to /login
 * 4. Redirects authenticated users away from /login to /dashboard
 */

import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  // Update Supabase session and get user
  const { user, response } = await updateSession(request)

  // Debug logging
  console.log('🔒 Middleware:', {
    path: request.nextUrl.pathname,
    hasUser: !!user,
    userId: user?.id,
  })

  // Define protected routes
  const protectedPaths = ['/dashboard', '/leads', '/team', '/settings']
  const isProtectedRoute = protectedPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  )

  // Redirect unauthenticated users trying to access protected routes
  if (isProtectedRoute && !user) {
    console.log('🚫 Redirecting to login - no user found')
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/login'
    redirectUrl.searchParams.set('redirectTo', request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Redirect authenticated users away from login page
  if (request.nextUrl.pathname === '/login' && user) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/dashboard'
    return NextResponse.redirect(redirectUrl)
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
