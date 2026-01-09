/**
 * Formatting utility functions for displaying metrics
 */

/**
 * Format a number with commas as thousand separators
 * Example: 1234 → "1,234"
 */
export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return '0'

  return new Intl.NumberFormat('en-GB', {
    maximumFractionDigits: 0,
  }).format(value)
}

/**
 * Format a number as a percentage with 2 decimal places
 * Example: 12.3456 → "12.35%"
 */
export function formatPercentage(value: number | null | undefined): string {
  if (value === null || value === undefined) return '0.00%'

  return `${value.toFixed(2)}%`
}

/**
 * Format a number as GBP currency
 * Example: 123.45 → "£123.45"
 * Handles null, undefined, and NaN values gracefully
 */
export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) return '£0.00'

  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

/**
 * Format a large number with K/M suffix
 * Example: 1500 → "1.5K", 1500000 → "1.5M"
 */
export function formatCompactNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return '0'

  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`
  }

  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`
  }

  return value.toString()
}

/**
 * Get a color class for a trend value
 * Positive = green, Negative = red, Zero = gray
 */
export function getTrendColor(value: number): string {
  if (value > 0) return 'text-success'
  if (value < 0) return 'text-danger'
  return 'text-muted-foreground'
}

/**
 * Get an arrow icon for a trend direction
 * Returns: '↑' for up, '↓' for down, '→' for neutral
 */
export function getTrendArrow(value: number): string {
  if (value > 0) return '↑'
  if (value < 0) return '↓'
  return '→'
}
