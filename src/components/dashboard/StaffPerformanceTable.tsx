/**
 * StaffPerformanceTable Component
 * Displays per-staff performance metrics in a sortable table
 */

'use client'

import { useState, useMemo } from 'react'
import { useStaffPerformance } from '@/lib/hooks/useStaffPerformance'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { AlertCircle, ArrowUpDown, RefreshCw } from 'lucide-react'
import { formatNumber, formatPercentage } from '@/lib/utils/formatting'
import type { UserRole } from '@/types/database'
import type { StaffPerformance } from '@/types/metrics'
import { cn } from '@/lib/utils/cn'

interface StaffPerformanceTableProps {
  dateFrom: Date
  dateTo: Date
  userRole: UserRole
  userName: string
}

type SortColumn = keyof StaffPerformance
type SortDirection = 'asc' | 'desc'

export function StaffPerformanceTable({
  dateFrom,
  dateTo,
  userRole,
  userName,
}: StaffPerformanceTableProps) {
  const { data, loading, error, refetch } = useStaffPerformance({
    dateFrom,
    dateTo,
    userRole,
    userName,
  })

  const [sortColumn, setSortColumn] = useState<SortColumn>('total_leads')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  // Sorting logic
  const sortedData = useMemo(() => {
    if (!data) return []

    return [...data].sort((a, b) => {
      const aValue = a[sortColumn]
      const bValue = b[sortColumn]

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue
      }

      // String comparison for staff_name
      const aStr = String(aValue)
      const bStr = String(bValue)
      return sortDirection === 'asc'
        ? aStr.localeCompare(bStr)
        : bStr.localeCompare(aStr)
    })
  }, [data, sortColumn, sortDirection])

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('desc')
    }
  }

  // Error state
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Staff Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error Loading Staff Performance</AlertTitle>
            <AlertDescription className="mt-2">
              <p className="mb-2">Failed to load staff performance data: {error.message}</p>
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Staff Performance</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          // Loading skeleton
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : sortedData.length === 0 ? (
          // Empty state
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No Data</AlertTitle>
            <AlertDescription>
              No staff performance data found for the selected date range.
            </AlertDescription>
          </Alert>
        ) : (
          // Table with data
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 font-medium"
                      onClick={() => handleSort('staff_name')}
                    >
                      Staff Name
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 font-medium"
                      onClick={() => handleSort('total_leads')}
                    >
                      Total Leads
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 font-medium"
                      onClick={() => handleSort('good_surveys')}
                    >
                      Good Surveys
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 font-medium"
                      onClick={() => handleSort('bad_surveys')}
                    >
                      Bad Surveys
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 font-medium"
                      onClick={() => handleSort('sold_surveys')}
                    >
                      Sold
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 font-medium"
                      onClick={() => handleSort('conversion_rate')}
                    >
                      Conversion %
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedData.map((staff) => (
                  <TableRow
                    key={staff.staff_name}
                    className={cn(
                      userRole === 'field_rep' && staff.staff_name === userName && 'bg-primary/5'
                    )}
                  >
                    <TableCell className="font-medium">
                      {staff.staff_name}
                      {userRole === 'field_rep' && staff.staff_name === userName && (
                        <span className="ml-2 text-xs text-muted-foreground">(You)</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">{formatNumber(staff.total_leads)}</TableCell>
                    <TableCell className="text-right text-success">{formatNumber(staff.good_surveys)}</TableCell>
                    <TableCell className="text-right text-danger">{formatNumber(staff.bad_surveys)}</TableCell>
                    <TableCell className="text-right text-primary">{formatNumber(staff.sold_surveys)}</TableCell>
                    <TableCell className="text-right font-medium">{formatPercentage(staff.conversion_rate)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
