/**
 * MetricCard Component
 * Displays a single metric with optional trend indicator
 */

import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils/cn'
import { getTrendArrow, getTrendColor } from '@/lib/utils/formatting'

export interface MetricCardProps {
  label: string
  value: string | number
  trend?: {
    value: number
    direction: 'up' | 'down'
  }
  variant?: 'default' | 'success' | 'danger' | 'info'
  icon?: React.ReactNode
  loading?: boolean
}

export function MetricCard({
  label,
  value,
  trend,
  variant = 'default',
  icon,
  loading = false,
}: MetricCardProps) {
  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-4 w-32 mb-4" />
          <Skeleton className="h-12 w-24" />
        </CardContent>
      </Card>
    )
  }

  const variantStyles = {
    default: 'border-l-4 border-l-muted-foreground',
    success: 'border-l-4 border-l-success',
    danger: 'border-l-4 border-l-danger',
    info: 'border-l-4 border-l-primary',
  }

  const iconColors = {
    default: 'text-muted-foreground',
    success: 'text-success',
    danger: 'text-danger',
    info: 'text-primary',
  }

  return (
    <Card className={cn('hover:shadow-md transition-shadow', variantStyles[variant])}>
      <CardContent className="p-6">
        {/* Label with optional icon */}
        <div className="flex items-center gap-2 mb-3">
          {icon && <div className={cn('w-5 h-5', iconColors[variant])}>{icon}</div>}
          <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
        </div>

        {/* Value and Trend */}
        <div className="flex items-end justify-between">
          <div className="text-4xl font-bold">{value}</div>

          {trend && (
            <div
              className={cn(
                'text-sm font-medium flex items-center gap-1',
                getTrendColor(trend.direction === 'up' ? trend.value : -trend.value)
              )}
            >
              <span>{getTrendArrow(trend.direction === 'up' ? trend.value : -trend.value)}</span>
              <span>{Math.abs(trend.value).toFixed(1)}%</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
