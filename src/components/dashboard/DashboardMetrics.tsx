/**
 * DashboardMetrics Component
 * Displays the grid of 9 core metrics
 */

'use client'

import { MetricCard } from './MetricCard'
import { SplitCPLCard } from './SplitCPLCard'
import { useDashboardMetrics } from '@/lib/hooks/useDashboardMetrics'
import { formatNumber, formatPercentage, formatCurrency } from '@/lib/utils/formatting'
import type { UserRole } from '@/types/database'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { AlertCircle, RefreshCw } from 'lucide-react'

interface DashboardMetricsProps {
  userRole: UserRole
  userName: string
  dateFrom: Date
  dateTo: Date
}

export function DashboardMetrics({
  userRole,
  userName,
  dateFrom,
  dateTo,
}: DashboardMetricsProps) {
  const { metrics, loading, error, refetch } = useDashboardMetrics({
    dateFrom,
    dateTo,
    userRole,
    userName,
  })

  // Error state
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error Loading Metrics</AlertTitle>
        <AlertDescription className="mt-2">
          <p className="mb-2">Failed to load dashboard metrics: {error.message}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="mt-2"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  // Loading state
  if (loading || !metrics) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(9)].map((_, i) => (
          <MetricCard key={i} label="" value="" loading={true} />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Metrics Grid - 3 columns on large screens, 2 on tablet, 1 on mobile */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {/* Metric 1: Total Leads */}
        <MetricCard
          label="TOTAL LEADS"
          value={formatNumber(metrics.total_leads)}
          variant="default"
        />

        {/* Metric 2: Surveys Booked */}
        <MetricCard
          label="SURVEYS BOOKED"
          value={formatNumber(metrics.surveys_booked)}
          variant="info"
        />

        {/* Metric 3: Pending Surveys */}
        <MetricCard
          label="PENDING SURVEYS"
          value={formatNumber(metrics.pending_surveys)}
          variant="default"
        />

        {/* Metric 4: Good Surveys */}
        <MetricCard
          label="GOOD SURVEYS"
          value={formatNumber(metrics.good_surveys)}
          variant="success"
        />

        {/* Metric 4: Bad Surveys */}
        <MetricCard
          label="BAD SURVEYS"
          value={formatNumber(metrics.bad_surveys)}
          variant="danger"
        />

        {/* Metric 5: Sold Surveys */}
        <MetricCard
          label="SOLD SURVEYS"
          value={formatNumber(metrics.sold_surveys)}
          variant="info"
        />

        {/* Metric 6: Conversion Rate - Leads to Surveys */}
        <MetricCard
          label="CONVERSION TO SURVEYS"
          value={formatPercentage(metrics.conversion_leads_to_surveys)}
          variant="default"
        />

        {/* Metric 7: Conversion Rate - Leads to Sold */}
        <MetricCard
          label="CONVERSION TO SOLD"
          value={formatPercentage(metrics.conversion_leads_to_sold)}
          variant="default"
        />

        {/* Metric 8: Split CPL Card (spans 2 columns) - Hidden for Account Managers */}
        {userRole !== 'account_manager' && (
          <SplitCPLCard
            cplOnline={metrics.cost_per_lead_online}
            cplField={metrics.cost_per_lead_field}
            loading={false}
          />
        )}
      </div>

      {/* Empty state if no leads */}
      {metrics.total_leads === 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No Leads Found</AlertTitle>
          <AlertDescription>
            No leads found for the selected date range. Try selecting a different time period.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
