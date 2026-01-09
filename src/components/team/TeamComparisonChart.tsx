/**
 * TeamComparisonChart Component
 * Bar chart comparing staff members on a specific metric
 */

'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { formatNumber, formatPercentage } from '@/lib/utils/formatting'
import type { StaffPerformance } from '@/types/metrics'

interface TeamComparisonChartProps {
  title: string
  data: StaffPerformance[] | null
  dataKey: keyof StaffPerformance
  loading?: boolean
}

const COLORS = [
  '#3b82f6', // Blue
  '#10b981', // Green
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#84cc16', // Lime
]

export function TeamComparisonChart({
  title,
  data,
  dataKey,
  loading = false,
}: TeamComparisonChartProps) {
  if (loading || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <div className="text-muted-foreground">Loading chart...</div>
        </CardContent>
      </Card>
    )
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No Data</AlertTitle>
            <AlertDescription>
              No staff performance data found for the selected date range.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  // Sort data by the metric value (descending)
  const sortedData = [...data].sort((a, b) => {
    const aValue = Number(a[dataKey]) || 0
    const bValue = Number(b[dataKey]) || 0
    return bValue - aValue
  })

  // Format value based on data key
  const formatValue = (value: number) => {
    if (dataKey === 'conversion_rate') {
      return formatPercentage(value)
    }
    return formatNumber(value)
  }

  // Custom tooltip
  interface CustomTooltipProps {
    active?: boolean
    payload?: Array<{
      payload: StaffPerformance
      value: number
    }>
  }

  const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
      const staff = payload[0].payload
      const value = payload[0].value
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{staff.staff_name}</p>
          <p className="text-sm text-muted-foreground">
            {formatValue(value)}
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={sortedData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="staff_name"
              angle={-45}
              textAnchor="end"
              height={80}
              interval={0}
              tick={{ fontSize: 12 }}
              className="text-muted-foreground"
            />
            <YAxis
              tick={{ fontSize: 12 }}
              className="text-muted-foreground"
              tickFormatter={(value) =>
                dataKey === 'conversion_rate' ? `${value}%` : value.toString()
              }
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey={dataKey} radius={[8, 8, 0, 0]}>
              {sortedData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
