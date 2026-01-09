/**
 * Hook for fetching and managing solar leads with pagination and real-time updates
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'
import type {
  LeadFilters,
  PaginationInfo,
  SolarLead,
  SortOrder,
} from '@/types/leads'

interface UseSolarLeadsOptions {
  page: number
  limit: number
  sortBy: string
  sortOrder: SortOrder
  filters: LeadFilters
  userRole: string
  userName: string
}

interface UseSolarLeadsReturn {
  leads: SolarLead[] | null
  loading: boolean
  error: Error | null
  pagination: PaginationInfo | null
  refetch: () => Promise<void>
}

export function useSolarLeads(
  options: UseSolarLeadsOptions
): UseSolarLeadsReturn {
  const { page, limit, sortBy, sortOrder, filters, userRole, userName } =
    options

  const [leads, setLeads] = useState<SolarLead[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [pagination, setPagination] = useState<PaginationInfo | null>(null)

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          page,
          limit,
          sortBy,
          sortOrder,
          filters,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch leads')
      }

      const result = await response.json()
      setLeads(result.data)
      setPagination(result.pagination)
    } catch (err) {
      console.error('useSolarLeads - Fetch error:', err)
      setError(err instanceof Error ? err : new Error('Unknown error'))
    } finally {
      setLoading(false)
    }
  }, [page, limit, sortBy, sortOrder, filters])

  // Initial fetch
  useEffect(() => {
    fetchLeads()
  }, [fetchLeads])

  // Real-time subscription
  useEffect(() => {
    const supabase = createBrowserClient()

    console.log('useSolarLeads - Setting up real-time subscription')

    const channel = supabase
      .channel('solar_leads_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'solar',
          table: 'solar_leads',
        },
        (payload) => {
          console.log('useSolarLeads - Real-time update:', payload)
          // Refetch data when changes occur
          fetchLeads()
        }
      )
      .subscribe()

    return () => {
      console.log('useSolarLeads - Cleaning up subscription')
      supabase.removeChannel(channel)
    }
  }, [fetchLeads])

  return {
    leads,
    loading,
    error,
    pagination,
    refetch: fetchLeads,
  }
}
