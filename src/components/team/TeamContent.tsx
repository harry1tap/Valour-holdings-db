/**
 * TeamContent Component
 * Main orchestrator for team performance page - fetches data and distributes to child components
 */

'use client'

import { useStaffPerformance } from '@/lib/hooks/useStaffPerformance'
import { TeamMetricsGrid } from './TeamMetricsGrid'
import { TeamComparisonChart } from './TeamComparisonChart'
import { StaffPerformanceTable } from '@/components/dashboard/StaffPerformanceTable'
import type { UserRole } from '@/types/database'

interface TeamContentProps {
  userRole: UserRole
  userName: string
  dateFrom: Date
  dateTo: Date
}

export function TeamContent({
  userRole,
  userName,
  dateFrom,
  dateTo,
}: TeamContentProps) {
  // Fetch staff performance data
  const { data: staffData, loading, error } = useStaffPerformance({
    dateFrom,
    dateTo,
    userRole,
    userName,
  })

  return (
    <div className="space-y-6">
      {/* Team Overview Metrics */}
      <TeamMetricsGrid data={staffData} loading={loading} />

      {/* Team Comparison Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TeamComparisonChart
          title="Leads by Staff Member"
          data={staffData}
          dataKey="total_leads"
          loading={loading}
        />
        <TeamComparisonChart
          title="Conversion Rate by Staff"
          data={staffData}
          dataKey="conversion_rate"
          loading={loading}
        />
      </div>

      {/* Additional comparison charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TeamComparisonChart
          title="Good Surveys by Staff"
          data={staffData}
          dataKey="good_surveys"
          loading={loading}
        />
        <TeamComparisonChart
          title="Sold Surveys by Staff"
          data={staffData}
          dataKey="sold_surveys"
          loading={loading}
        />
      </div>

      {/* Staff Performance Table */}
      <StaffPerformanceTable
        dateFrom={dateFrom}
        dateTo={dateTo}
        userRole={userRole}
        userName={userName}
      />
    </div>
  )
}
