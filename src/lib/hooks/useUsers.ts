/**
 * useUsers Hook
 * Fetches and manages users list (admin only)
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import type { UserProfile } from '@/types/database'

interface UseUsersReturn {
  users: UserProfile[] | null
  loading: boolean
  error: Error | null
  refresh: () => Promise<void>
}

export function useUsers(): UseUsersReturn {
  const [users, setUsers] = useState<UserProfile[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/users')

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch users')
      }

      const data = await response.json()
      setUsers(data)
    } catch (err) {
      console.error('Error fetching users:', err)
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  return {
    users,
    loading,
    error,
    refresh: fetchUsers,
  }
}
