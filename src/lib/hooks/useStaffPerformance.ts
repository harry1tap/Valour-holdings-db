/**
 * Hook for fetching staff performance metrics with real-time updates
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'
import { formatDateForDB } from '@/lib/utils/date'
import type { StaffPerformance } from '@/types/metrics'
import type { UserRole } from '@/types/database'

interface UseStaffPerformanceOptions {
  dateFrom: Date
  dateTo: Date
  userRole: UserRole
  userName: string
}

interface UseStaffPerformanceReturn {
  data: StaffPerformance[] | null
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useStaffPerformance({
  dateFrom,
  dateTo,
  userRole,
  userName,
}: UseStaffPerformanceOptions): UseStaffPerformanceReturn {
  const [data, setData] = useState<StaffPerformance[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const supabase = createBrowserClient()

  const fetchStaffPerformance = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Determine filtering based on role
      const accountManagerFilter = userRole === 'account_manager' ? userName : null

      console.log('Fetching staff performance:', {
        dateFrom: formatDateForDB(dateFrom),
        dateTo: formatDateForDB(dateTo),
        role: userRole,
        accountManager: accountManagerFilter,
      })

      // Call the API route
      const response = await fetch('/api/staff-performance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dateFrom: formatDateForDB(dateFrom),
          dateTo: formatDateForDB(dateTo),
          accountManager: accountManagerFilter,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('API Error:', errorData)
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const { data: staffData } = await response.json()

      console.log('Staff performance fetched successfully:', staffData?.length || 0, 'staff members')

      setData(staffData || [])
    } catch (err) {
      console.error('Failed to fetch staff performance:', err)
      setError(err instanceof Error ? err : new Error('Failed to fetch staff performance'))
    } finally {
      setLoading(false)
    }
  }, [dateFrom, dateTo, userRole, userName])

  // Initial fetch
  useEffect(() => {
    fetchStaffPerformance()
  }, [fetchStaffPerformance])

  // Real-time subscription
  useEffect(() => {
    console.log('Setting up real-time subscription for staff performance')

    const channel = supabase
      .channel('staff-performance-updates')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'solar',
          table: 'solar_leads',
        },
        (payload) => {
          console.log('Staff performance change detected:', payload)
          // Refetch data after a short delay to batch multiple changes
          setTimeout(() => {
            fetchStaffPerformance()
          }, 500)
        }
      )
      .subscribe()

    return () => {
      console.log('Cleaning up staff performance real-time subscription')
      channel.unsubscribe()
    }
  }, [fetchStaffPerformance, supabase])

  return {
    data,
    loading,
    error,
    refetch: fetchStaffPerformance,
  }
}
