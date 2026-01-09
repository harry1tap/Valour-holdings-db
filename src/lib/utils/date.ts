/**
 * Date utility functions for dashboard filtering
 * Uses date-fns for date calculations
 */

import {
  startOfMonth,
  endOfMonth,
  startOfQuarter,
  endOfQuarter,
  startOfYear,
  endOfYear,
  subMonths,
  subQuarters,
  subYears,
  format,
} from 'date-fns'
import type { DateRange } from '@/types/metrics'

/**
 * Get date range for the current month (from 1st to today)
 */
export function getThisMonth(): DateRange {
  const now = new Date()
  return {
    from: startOfMonth(now),
    to: now,
  }
}

/**
 * Get date range for the previous calendar month
 */
export function getLastMonth(): DateRange {
  const lastMonth = subMonths(new Date(), 1)
  return {
    from: startOfMonth(lastMonth),
    to: endOfMonth(lastMonth),
  }
}

/**
 * Get date range for the previous quarter
 */
export function getLastQuarter(): DateRange {
  const lastQuarter = subQuarters(new Date(), 1)
  return {
    from: startOfQuarter(lastQuarter),
    to: endOfQuarter(lastQuarter),
  }
}

/**
 * Get date range for the previous calendar year
 */
export function getLastYear(): DateRange {
  const lastYear = subYears(new Date(), 1)
  return {
    from: startOfYear(lastYear),
    to: endOfYear(lastYear),
  }
}

/**
 * Format a Date object to PostgreSQL timestamptz format
 * Example: "2026-01-08T12:00:00.000Z"
 */
export function formatDateForDB(date: Date): string {
  return date.toISOString()
}

/**
 * Format a Date object for display
 * Example: "Jan 8, 2026"
 */
export function formatDateForDisplay(date: Date): string {
  return format(date, 'MMM d, yyyy')
}

/**
 * Format a date range for display
 * Example: "Jan 1 - Jan 8, 2026"
 */
export function formatDateRangeForDisplay(range: DateRange): string {
  const fromYear = range.from.getFullYear()
  const toYear = range.to.getFullYear()

  // Same year: "Jan 1 - Feb 5, 2026"
  if (fromYear === toYear) {
    return `${format(range.from, 'MMM d')} - ${format(range.to, 'MMM d, yyyy')}`
  }

  // Different years: "Dec 1, 2025 - Jan 5, 2026"
  return `${format(range.from, 'MMM d, yyyy')} - ${format(range.to, 'MMM d, yyyy')}`
}

/**
 * Parse date string from URL params
 * Returns null if invalid
 */
export function parseDateParam(param: string | undefined): Date | null {
  if (!param) return null

  try {
    const date = new Date(param)
    // Check if valid date
    if (isNaN(date.getTime())) return null
    return date
  } catch {
    return null
  }
}

/**
 * Validate that a date range is valid (from <= to)
 */
export function isValidDateRange(range: DateRange): boolean {
  return range.from <= range.to
}
