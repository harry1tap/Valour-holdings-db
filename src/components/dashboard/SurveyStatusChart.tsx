/**
 * SurveyStatusChart Component
 * Donut chart showing breakdown of survey statuses
 */

'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import type { DashboardMetrics } from '@/types/metrics'
import { formatNumber } from '@/lib/utils/formatting'

interface SurveyStatusChartProps {
  metrics: DashboardMetrics | null
  loading: boolean
}

const COLORS = {
  good: '#10b981', // Green
  bad: '#ef4444',  // Red
  sold: '#3b82f6', // Blue
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{
    value: number
    name: string
  }>
}

interface LegendProps {
  payload?: ReadonlyArray<{
    value: number
    color?: string
    payload?: {
      value?: number
      name?: string
    }
  }>
}

interface LegendEntry {
  value: number
  color?: string
  payload?: {
    value?: number
    name?: string
  }
}

export function SurveyStatusChart({ metrics, loading }: SurveyStatusChartProps) {
  if (loading || !metrics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Survey Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <div className="text-muted-foreground">Loading chart...</div>
        </CardContent>
      </Card>
    )
  }

  const totalSurveys = metrics.good_surveys + metrics.bad_surveys + metrics.sold_surveys

  // No data
  if (totalSurveys === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Survey Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No Survey Data</AlertTitle>
            <AlertDescription>
              No surveys found for the selected date range.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  const data = [
    { name: 'Good Surveys', value: metrics.good_surveys, fill: COLORS.good },
    { name: 'Bad Surveys', value: metrics.bad_surveys, fill: COLORS.bad },
    { name: 'Sold Surveys', value: metrics.sold_surveys, fill: COLORS.sold },
  ].filter(item => item.value > 0) // Only show non-zero values

  // Custom label to show in center
  const renderCenterLabel = () => (
    <text
      x="50%"
      y="50%"
      textAnchor="middle"
      dominantBaseline="middle"
      className="fill-foreground"
    >
      <tspan x="50%" dy="-0.5em" fontSize="32" fontWeight="bold">
        {formatNumber(totalSurveys)}
      </tspan>
      <tspan x="50%" dy="1.5em" fontSize="14" className="fill-muted-foreground">
        Total Surveys
      </tspan>
    </text>
  )

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
      const data = payload[0]
      const percentage = ((data.value / totalSurveys) * 100).toFixed(1)
      return (
        <div className="bg-card border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm text-muted-foreground">
            {formatNumber(data.value)} ({percentage}%)
          </p>
        </div>
      )
    }
    return null
  }

  // Custom legend
  const renderLegend = (props: LegendProps) => {
    const { payload } = props
    return (
      <div className="flex flex-wrap justify-center gap-4 mt-4">
        {payload?.map((entry: LegendEntry, index: number) => {
          const percentage = ((entry.value / totalSurveys) * 100).toFixed(1)
          return (
            <div key={`legend-${index}`} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm">
                <span className="font-medium">{entry.value}</span>
                <span className="text-muted-foreground"> {entry.payload?.name}</span>
                <span className="text-muted-foreground text-xs ml-1">({percentage}%)</span>
              </span>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Survey Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend content={renderLegend as never} />
            {renderCenterLabel()}
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
