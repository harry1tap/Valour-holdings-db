/**
 * LeadsTrendChart Component
 * Line chart showing leads trend over time
 */

'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { AlertCircle, RefreshCw } from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts'
import { useMetricsTrend } from '@/lib/hooks/useMetricsTrend'
import { formatDateForDisplay } from '@/lib/utils/date'
import { formatNumber } from '@/lib/utils/formatting'
import type { UserRole } from '@/types/database'

interface LeadsTrendChartProps {
  dateFrom: Date
  dateTo: Date
  userRole: UserRole
  userName: string
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{
    payload: {
      date: string
      value: number
    }
  }>
}

export function LeadsTrendChart({
  dateFrom,
  dateTo,
  userRole,
  userName,
}: LeadsTrendChartProps) {
  const { data, loading, error, refetch } = useMetricsTrend({
    dateFrom,
    dateTo,
    userRole,
    userName,
    interval: 'day',
  })

  // Error state
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Leads Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error Loading Chart</AlertTitle>
            <AlertDescription className="mt-2">
              <p className="mb-2">Failed to load leads trend: {error.message}</p>
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
        </CardContent>
      </Card>
    )
  }

  if (loading || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Leads Trend</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <div className="text-muted-foreground">Loading chart...</div>
        </CardContent>
      </Card>
    )
  }

  // No data
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Leads Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No Data</AlertTitle>
            <AlertDescription>
              No leads found for the selected date range.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  // Get theme-aware chart colors
  const getChartGridColor = () => {
    if (typeof window === 'undefined') return '#e5e7eb'
    const isDark = document.documentElement.classList.contains('dark')
    return isDark ? '#374151' : '#e5e7eb' // dark:gray-700 : gray-200
  }

  const getChartAxisColor = () => {
    if (typeof window === 'undefined') return '#9ca3af'
    const isDark = document.documentElement.classList.contains('dark')
    return isDark ? '#9ca3af' : '#6b7280' // dark:gray-400 : gray-500
  }

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-card border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{formatDateForDisplay(new Date(data.date))}</p>
          <p className="text-sm text-muted-foreground">
            Leads: {formatNumber(data.value)}
          </p>
        </div>
      )
    }
    return null
  }

  // Format date for X-axis
  const formatXAxis = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Leads Trend</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart
            data={data}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={getChartGridColor()} />
            <XAxis
              dataKey="date"
              tickFormatter={formatXAxis}
              tick={{ fontSize: 12 }}
              stroke={getChartAxisColor()}
            />
            <YAxis
              tickFormatter={formatNumber}
              tick={{ fontSize: 12 }}
              stroke={getChartAxisColor()}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#3b82f6"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorLeads)"
            />
          </AreaChart>
        </ResponsiveContainer>
        <div className="mt-4 text-sm text-muted-foreground text-center">
          Daily lead count over the selected time period
        </div>
      </CardContent>
    </Card>
  )
}
