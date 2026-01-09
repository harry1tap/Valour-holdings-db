/**
 * Hook for fetching metrics trend data with real-time updates
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'
import { formatDateForDB } from '@/lib/utils/date'
import type { UserRole } from '@/types/database'

export interface MetricsTrendData {
  date: string
  value: number
}

interface UseMetricsTrendOptions {
  dateFrom: Date
  dateTo: Date
  userRole: UserRole
  userName: string
  interval?: 'day' | 'week' | 'month'
}

interface UseMetricsTrendReturn {
  data: MetricsTrendData[] | null
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useMetricsTrend({
  dateFrom,
  dateTo,
  userRole,
  userName,
  interval = 'day',
}: UseMetricsTrendOptions): UseMetricsTrendReturn {
  const [data, setData] = useState<MetricsTrendData[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const supabase = createBrowserClient()

  const fetchMetricsTrend = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Determine filtering based on role
      const accountManagerFilter = userRole === 'account_manager' ? userName : null
      const fieldRepFilter = userRole === 'field_rep' ? userName : null

      console.log('Fetching metrics trend:', {
        dateFrom: formatDateForDB(dateFrom),
        dateTo: formatDateForDB(dateTo),
        role: userRole,
        accountManager: accountManagerFilter,
        fieldRep: fieldRepFilter,
        interval,
      })

      // Call the API route
      const response = await fetch('/api/metrics-trend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dateFrom: formatDateForDB(dateFrom),
          dateTo: formatDateForDB(dateTo),
          accountManager: accountManagerFilter,
          fieldRep: fieldRepFilter,
          interval,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('API Error:', errorData)
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const { data: trendData } = await response.json()

      console.log('Metrics trend fetched successfully:', trendData?.length || 0, 'data points')

      setData(trendData || [])
    } catch (err) {
      console.error('Failed to fetch metrics trend:', err)
      setError(err instanceof Error ? err : new Error('Failed to fetch metrics trend'))
    } finally {
      setLoading(false)
    }
  }, [dateFrom, dateTo, userRole, userName, interval])

  // Initial fetch
  useEffect(() => {
    fetchMetricsTrend()
  }, [fetchMetricsTrend])

  // Real-time subscription
  useEffect(() => {
    console.log('Setting up real-time subscription for metrics trend')

    const channel = supabase
      .channel('metrics-trend-updates')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'solar',
          table: 'solar_leads',
        },
        (payload) => {
          console.log('Metrics trend change detected:', payload)
          // Refetch data after a short delay to batch multiple changes
          setTimeout(() => {
            fetchMetricsTrend()
          }, 500)
        }
      )
      .subscribe()

    return () => {
      console.log('Cleaning up metrics trend real-time subscription')
      channel.unsubscribe()
    }
  }, [fetchMetricsTrend, supabase])

  return {
    data,
    loading,
    error,
    refetch: fetchMetricsTrend,
  }
}
