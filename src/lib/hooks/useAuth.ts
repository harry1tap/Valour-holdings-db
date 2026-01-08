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

  const supabase = createBrowserClient()

  useEffect(() => {
    // Get initial session
    const getUser = async () => {
      try {
        const {
          data: { user: currentUser },
          error: userError,
        } = await supabase.auth.getUser()

        if (userError) throw userError

        setUser(currentUser)

        if (currentUser) {
          // Fetch user profile from user_profiles table
          const { data: profileData, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', currentUser.id)
            .single()

          if (profileError) throw profileError

          setProfile(profileData)
        } else {
          setProfile(null)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    getUser()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null)

      if (session?.user) {
        // Refetch profile on auth change
        const { data: profileData } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        setProfile(profileData)
      } else {
        setProfile(null)
      }

      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

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
