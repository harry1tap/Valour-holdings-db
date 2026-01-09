/**
 * ConversionFunnelChart Component
 * Bar chart showing conversion funnel from leads to sold
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
  LabelList,
} from 'recharts'
import type { DashboardMetrics } from '@/types/metrics'
import { formatNumber } from '@/lib/utils/formatting'

interface ConversionFunnelChartProps {
  metrics: DashboardMetrics | null
  loading: boolean
}

const COLORS = ['#3b82f6', '#60a5fa', '#93c5fd', '#10b981']

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{
    payload: {
      stage: string
      count: number
      percentage: number
      label: string
    }
  }>
}

export function ConversionFunnelChart({ metrics, loading }: ConversionFunnelChartProps) {
  if (loading || !metrics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Conversion Funnel</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <div className="text-muted-foreground">Loading chart...</div>
        </CardContent>
      </Card>
    )
  }

  // No data
  if (metrics.total_leads === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Conversion Funnel</CardTitle>
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

  // Calculate percentages relative to total leads
  const calculatePercentage = (value: number) => {
    if (metrics.total_leads === 0) return '0.0'
    return ((value / metrics.total_leads) * 100).toFixed(1)
  }

  const data = [
    {
      stage: 'Total Leads',
      count: metrics.total_leads,
      percentage: 100,
      label: `${formatNumber(metrics.total_leads)} (100%)`,
    },
    {
      stage: 'Surveys Booked',
      count: metrics.surveys_booked,
      percentage: parseFloat(calculatePercentage(metrics.surveys_booked)),
      label: `${formatNumber(metrics.surveys_booked)} (${calculatePercentage(metrics.surveys_booked)}%)`,
    },
    {
      stage: 'Good Surveys',
      count: metrics.good_surveys,
      percentage: parseFloat(calculatePercentage(metrics.good_surveys)),
      label: `${formatNumber(metrics.good_surveys)} (${calculatePercentage(metrics.good_surveys)}%)`,
    },
    {
      stage: 'Sold',
      count: metrics.sold_surveys,
      percentage: parseFloat(calculatePercentage(metrics.sold_surveys)),
      label: `${formatNumber(metrics.sold_surveys)} (${calculatePercentage(metrics.sold_surveys)}%)`,
    },
  ]

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-card border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{data.stage}</p>
          <p className="text-sm text-muted-foreground">
            Count: {formatNumber(data.count)}
          </p>
          <p className="text-sm text-muted-foreground">
            Conversion: {data.percentage}%
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Conversion Funnel</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 20, right: 100, bottom: 20, left: 100 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="stage"
              width={120}
              tick={{ fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="count" radius={[0, 8, 8, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
              <LabelList
                dataKey="label"
                position="right"
                style={{ fontSize: 12, fontWeight: 500 }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-4 text-sm text-muted-foreground text-center">
          Shows the conversion flow from initial leads through to sold surveys
        </div>
      </CardContent>
    </Card>
  )
}
