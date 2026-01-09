/**
 * Hook for fetching dashboard metrics with real-time updates
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'
import { formatDateForDB } from '@/lib/utils/date'
import type { DashboardMetrics } from '@/types/metrics'
import type { UserRole } from '@/types/database'

interface UseDashboardMetricsOptions {
  dateFrom: Date
  dateTo: Date
  userRole: UserRole
  userName: string
}

interface UseDashboardMetricsReturn {
  metrics: DashboardMetrics | null
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useDashboardMetrics({
  dateFrom,
  dateTo,
  userRole,
  userName,
}: UseDashboardMetricsOptions): UseDashboardMetricsReturn {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const supabase = createBrowserClient()

  const fetchMetrics = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Determine filtering based on role
      const accountManagerFilter = userRole === 'account_manager' ? userName : null
      const fieldRepFilter = userRole === 'field_rep' ? userName : null

      console.log('Fetching metrics:', {
        dateFrom: formatDateForDB(dateFrom),
        dateTo: formatDateForDB(dateTo),
        role: userRole,
        accountManager: accountManagerFilter,
        fieldRep: fieldRepFilter,
      })

      // Call the API route instead of calling RPC directly
      // This uses the service role key server-side for proper permissions
      const response = await fetch('/api/metrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dateFrom: formatDateForDB(dateFrom),
          dateTo: formatDateForDB(dateTo),
          accountManager: accountManagerFilter,
          fieldRep: fieldRepFilter,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('API Error:', errorData)
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const { data } = await response.json()

      console.log('Metrics fetched successfully:', data)

      setMetrics(data)
    } catch (err) {
      console.error('Failed to fetch metrics:', err)
      setError(err instanceof Error ? err : new Error('Failed to fetch metrics'))
    } finally {
      setLoading(false)
    }
  }, [dateFrom, dateTo, userRole, userName, supabase])

  // Initial fetch
  useEffect(() => {
    fetchMetrics()
  }, [fetchMetrics])

  // Real-time subscription
  useEffect(() => {
    console.log('Setting up real-time subscription for dashboard metrics')

    const channel = supabase
      .channel('dashboard-updates')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'solar',
          table: 'solar_leads',
        },
        (payload) => {
          console.log('Dashboard leads change detected:', payload)
          // Refetch metrics after a short delay to batch multiple changes
          setTimeout(() => {
            fetchMetrics()
          }, 500)
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'solar',
          table: 'expenses',
        },
        (payload) => {
          console.log('Dashboard expenses change detected:', payload)
          // Refetch metrics after a short delay to batch multiple changes
          setTimeout(() => {
            fetchMetrics()
          }, 500)
        }
      )
      .subscribe()

    return () => {
      console.log('Cleaning up real-time subscription')
      channel.unsubscribe()
    }
  }, [fetchMetrics, supabase])

  return {
    metrics,
    loading,
    error,
    refetch: fetchMetrics,
  }
}
