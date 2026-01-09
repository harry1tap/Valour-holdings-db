/**
 * Type definitions for dashboard metrics
 * Matches the output from Supabase database functions
 */

/**
 * Dashboard metrics returned from calculate_dashboard_metrics() function
 */
export interface DashboardMetrics {
  total_leads: number
  surveys_booked: number
  pending_surveys: number
  good_surveys: number
  bad_surveys: number
  sold_surveys: number
  conversion_leads_to_surveys: number  // Percentage
  conversion_leads_to_sold: number      // Percentage
  total_lead_cost: number
  cost_per_lead: number
  // CPL split fields
  total_online_expenses: number
  total_field_expenses: number
  cost_per_lead_online: number
  cost_per_lead_field: number
}

/**
 * Staff performance metrics returned from get_staff_performance() function
 */
export interface StaffPerformance {
  staff_name: string
  total_leads: number
  good_surveys: number
  bad_surveys: number
  sold_surveys: number
  conversion_rate: number  // Percentage
}

/**
 * Date range for filtering metrics
 */
export interface DateRange {
  from: Date
  to: Date
}

/**
 * Preset date range options
 */
export type DatePreset = 'this-month' | 'last-month' | 'last-quarter' | 'last-year' | 'custom'

/**
 * Date filter option with label and value
 */
export interface DateFilterOption {
  label: string
  value: DatePreset
  getRange: () => DateRange
}

/**
 * Expense input data structure for API
 */
export interface ExpenseInput {
  expense_date: string  // YYYY-MM-DD format
  category: string
  description: string
  total_amount: number
  online_amount: number
  field_amount: number
  created_by?: string
  notes?: string
}

/**
 * Expense categories
 */
export const EXPENSE_CATEGORIES = [
  'Rent',
  'Marketing',
  'Salaries',
  'Utilities',
  'Software',
  'Equipment',
  'Travel',
  'Insurance',
  'Other',
] as const

export type ExpenseCategory = typeof EXPENSE_CATEGORIES[number]
