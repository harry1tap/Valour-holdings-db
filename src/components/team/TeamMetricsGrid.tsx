/**
 * TeamMetricsGrid Component
 * Displays 4 key team-wide overview metrics
 */

'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Calendar, TrendingUp, Trophy } from 'lucide-react'
import { formatNumber, formatPercentage } from '@/lib/utils/formatting'
import type { StaffPerformance } from '@/types/metrics'

interface TeamMetricsGridProps {
  data: StaffPerformance[] | null
  loading: boolean
}

export function TeamMetricsGrid({ data, loading }: TeamMetricsGridProps) {
  if (loading || !data) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Loading...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  // Calculate team-wide metrics
  const totalLeads = data.reduce((sum, staff) => sum + staff.total_leads, 0)
  const totalSurveys = data.reduce(
    (sum, staff) => sum + staff.pending_surveys + staff.good_surveys + staff.bad_surveys + staff.sold_surveys,
    0
  )
  const avgConversion =
    data.length > 0
      ? data.reduce((sum, staff) => sum + staff.conversion_rate, 0) / data.length
      : 0

  // Find top performer (highest conversion rate)
  const topPerformer = data.reduce(
    (top, staff) =>
      staff.conversion_rate > top.conversion_rate ? staff : top,
    data[0] || { staff_name: 'N/A', conversion_rate: 0 }
  )

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Total Team Leads */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Team Leads</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatNumber(totalLeads)}</div>
          <p className="text-xs text-muted-foreground">
            Across {data.length} team {data.length === 1 ? 'member' : 'members'}
          </p>
        </CardContent>
      </Card>

      {/* Total Surveys Booked */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Surveys</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatNumber(totalSurveys)}</div>
          <p className="text-xs text-muted-foreground">
            Pending, Good, Bad, and Sold surveys
          </p>
        </CardContent>
      </Card>

      {/* Team Average Conversion */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg Conversion</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatPercentage(avgConversion)}</div>
          <p className="text-xs text-muted-foreground">
            Team average conversion rate
          </p>
        </CardContent>
      </Card>

      {/* Top Performer */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Top Performer</CardTitle>
          <Trophy className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold truncate" title={topPerformer.staff_name}>
            {topPerformer.staff_name}
          </div>
          <p className="text-xs text-muted-foreground">
            {formatPercentage(topPerformer.conversion_rate)} conversion
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
