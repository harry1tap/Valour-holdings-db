/**
 * useAuth Hook
 * Provides access to current user authentication state and profile
 *
 * Usage:
 * const { user, profile, role, isAdmin, loading } = useAuth()
 */

'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import type { UserProfile, UserRole } from '@/types/database'

interface UseAuthReturn {
  user: User | null
  profile: UserProfile | null
  role: UserRole | null
  isAdmin: boolean
  isAccountManager: boolean
  isFieldRep: boolean
  loading: boolean
  error: string | null
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createBrowserClient()
    let timeoutId: NodeJS.Timeout | null = null

    console.log('useAuth: Setting up auth subscription')

    // Safety timeout - force loading to false after 10 seconds
    timeoutId = setTimeout(() => {
      console.log('useAuth: Timeout reached, forcing loading to false')
      setLoading(false)
    }, 10000)

    // Fetch profile from API route (server-side)
    const fetchProfile = async (userId: string) => {
      console.log('useAuth: Fetching profile via API for user:', userId)
      try {
        const response = await fetch('/api/auth/profile')

        if (!response.ok) {
          throw new Error(`Failed to fetch profile: ${response.statusText}`)
        }

        const profileData = await response.json()
        console.log('useAuth: Profile fetched successfully, role:', profileData.role)

        setProfile(profileData)
        setError(null)
      } catch (err) {
        console.error('useAuth: Error fetching profile:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch profile')
        setProfile(null)
      }
    }

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('useAuth: onAuthStateChange triggered, event:', event, 'hasSession:', !!session)

      try {
        setUser(session?.user ?? null)

        if (session?.user) {
          // Fetch profile via API route (server-side query)
          await fetchProfile(session.user.id)
        } else {
          console.log('useAuth: No session, clearing profile')
          setProfile(null)
        }
      } catch (err) {
        console.error('useAuth: Exception in onAuthStateChange:', err)
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        console.log('useAuth: Setting loading to false')
        if (timeoutId) clearTimeout(timeoutId)
        setLoading(false)
      }
    })

    return () => {
      console.log('useAuth: Cleanup - unsubscribing')
      if (timeoutId) clearTimeout(timeoutId)
      subscription.unsubscribe()
    }
  }, [])

  return {
    user,
    profile,
    role: profile?.role ?? null,
    isAdmin: profile?.role === 'admin',
    isAccountManager: profile?.role === 'account_manager',
    isFieldRep: profile?.role === 'field_rep',
    loading,
    error,
  }
}
