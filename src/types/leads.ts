/**
 * Lead-specific types and interfaces
 */

import type { SolarLead } from './database'

// Filter interface for lead queries
export interface LeadFilters {
  search?: string
  status?: string
  surveyStatus?: string
  accountManager?: string
  fieldRep?: string
  dateFrom?: Date
  dateTo?: Date
  postcode?: string
}

// Pagination info returned from API
export interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
}

// Sort order type
export type SortOrder = 'asc' | 'desc'

// Standardized lead source values
export const LEAD_SOURCES = ['Online', 'Field'] as const
export type LeadSource = typeof LEAD_SOURCES[number]

// Export SolarLead for convenience
export type { SolarLead }
