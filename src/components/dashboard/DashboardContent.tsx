/**
 * DashboardContent Component
 * Client wrapper that fetches metrics and distributes to all dashboard components
 */

'use client'

import { useDashboardMetrics } from '@/lib/hooks/useDashboardMetrics'
import { DashboardMetrics } from './DashboardMetrics'
import { LeadsTrendChart } from './LeadsTrendChart'
import { SurveyStatusChart } from './SurveyStatusChart'
import { ConversionFunnelChart } from './ConversionFunnelChart'
import { StaffPerformanceTable } from './StaffPerformanceTable'
import type { UserRole } from '@/types/database'

interface DashboardContentProps {
  userRole: UserRole
  userName: string
  dateFrom: Date
  dateTo: Date
}

export function DashboardContent({
  userRole,
  userName,
  dateFrom,
  dateTo,
}: DashboardContentProps) {
  const { metrics, loading, error, refetch } = useDashboardMetrics({
    dateFrom,
    dateTo,
    userRole,
    userName,
  })

  return (
    <>
      {/* Dashboard Metrics Grid */}
      <DashboardMetrics
        userRole={userRole}
        userName={userName}
        dateFrom={dateFrom}
        dateTo={dateTo}
      />

      {/* Charts Row - Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LeadsTrendChart
          dateFrom={dateFrom}
          dateTo={dateTo}
          userRole={userRole}
          userName={userName}
        />
        <SurveyStatusChart metrics={metrics} loading={loading} />
      </div>

      {/* Conversion Funnel - Full Width */}
      <ConversionFunnelChart metrics={metrics} loading={loading} />

      {/* Staff Performance Table */}
      <StaffPerformanceTable
        dateFrom={dateFrom}
        dateTo={dateTo}
        userRole={userRole}
        userName={userName}
      />
    </>
  )
}
