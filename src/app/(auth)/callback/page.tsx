'use client'

/**
 * Auth Callback Page (Client-Side)
 * Handles authentication callbacks from Supabase
 *
 * Supports TWO auth flows:
 * 1. Implicit Flow (hash-based): Invitations, password resets
 *    - Tokens in URL hash: #access_token=...&refresh_token=...
 * 2. PKCE Flow (query-based): OAuth, some password resets
 *    - Code in URL query: ?code=...
 *    - Handled by route.ts (server-side)
 */

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const supabase = createBrowserClient()

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Check for error in URL
        const errorParam = searchParams.get('error')
        const errorDescription = searchParams.get('error_description')

        if (errorParam) {
          setError(errorDescription || errorParam)
          setTimeout(() => router.push(`/login?error=${encodeURIComponent(errorDescription || errorParam)}`), 2000)
          return
        }

        // CASE 1: Hash-based tokens (implicit flow) - Invitations & Password Resets
        if (window.location.hash) {
          console.log('Processing hash-based auth callback...')

          // Extract tokens from hash fragment
          const hashParams = new URLSearchParams(window.location.hash.substring(1))
          const accessToken = hashParams.get('access_token')
          const refreshToken = hashParams.get('refresh_token')
          const type = hashParams.get('type')

          console.log('Callback type:', type)

          if (accessToken && refreshToken) {
            // Set session with tokens
            const { error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            })

            if (sessionError) {
              console.error('Session error:', sessionError)
              setError('Failed to authenticate. Please try again.')
              setTimeout(() => router.push('/login'), 2000)
              return
            }

            // Success - redirect to dashboard
            console.log('Session established successfully')

            // For invitations, redirect to password setup
            if (type === 'invite') {
              router.push('/set-password')
            }
            // For password recovery, redirect to password reset page
            else if (type === 'recovery') {
              router.push('/reset-password')
            }
            // Default: go to dashboard
            else {
              router.push('/dashboard')
            }
            return
          }
        }

        // CASE 2: Code-based flow (PKCE) - Handle client-side
        const code = searchParams.get('code')
        if (code) {
          console.log('Processing PKCE code exchange...')

          try {
            const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

            if (exchangeError) {
              console.error('Code exchange error:', exchangeError)
              setError('Unable to verify authentication')
              setTimeout(() => router.push('/login?error=Unable to verify authentication'), 2000)
              return
            }

            // Success - redirect to dashboard
            console.log('PKCE code exchange successful')
            router.push('/dashboard')
            return
          } catch (err) {
            console.error('Code exchange exception:', err)
            setError('Failed to complete authentication')
            setTimeout(() => router.push('/login'), 2000)
            return
          }
        }

        // CASE 3: No auth data found
        console.log('No auth data found in callback')
        router.push('/login')

      } catch (err) {
        console.error('Callback error:', err)
        setError('An error occurred during authentication')
        setTimeout(() => router.push('/login'), 2000)
      }
    }

    handleCallback()
  }, [router, searchParams, supabase])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        {error ? (
          <>
            <div className="text-destructive text-lg font-semibold">
              {error}
            </div>
            <p className="text-muted-foreground text-sm">
              Redirecting to login...
            </p>
          </>
        ) : (
          <>
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">
              Completing authentication...
            </p>
          </>
        )}
      </div>
    </div>
  )
}
