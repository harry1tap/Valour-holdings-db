/**
 * Leads Table Component
 * Displays solar leads in a sortable, paginated table
 */

'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { ArrowUpDown, Eye, Pencil, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import type { SolarLead, SortOrder } from '@/types/leads'
import { cn } from '@/lib/utils/cn'
import { SurveyStatusBadge } from './SurveyStatusBadge'

interface LeadsTableProps {
  leads: SolarLead[] | null
  loading: boolean
  error: Error | null
  sortBy: string
  sortOrder: SortOrder
  onSort: (column: string) => void
  onRowClick: (leadId: number) => void
  onRefetch: () => void
  userRole: string
}

// Status badge colors
const statusColors: Record<string, string> = {
  'New Lead': 'bg-chart-1/20 text-chart-1 dark:bg-chart-1/30 dark:text-chart-1',
  'Survey Booked': 'bg-chart-2/20 text-chart-2 dark:bg-chart-2/30 dark:text-chart-2',
  'Survey Complete': 'bg-chart-3/20 text-chart-3 dark:bg-chart-3/30 dark:text-chart-3',
  'Install Complete': 'bg-primary text-primary-foreground',
  'Fall Off': 'bg-destructive/20 text-destructive dark:bg-destructive/30 dark:text-destructive',
}

const surveyStatusColors: Record<string, string> = {
  'Good Survey': 'bg-chart-5 text-white dark:bg-chart-5',
  'Bad Survey': 'bg-destructive/20 text-destructive dark:bg-destructive/30 dark:text-destructive',
  'Sold Survey': 'bg-primary text-primary-foreground',
}

export function LeadsTable({
  leads,
  loading,
  error,
  sortBy,
  sortOrder,
  onSort,
  onRowClick,
  onRefetch,
  userRole,
}: LeadsTableProps) {
  // Sortable column header component
  const SortableHeader = ({
    column,
    label,
  }: {
    column: string
    label: string
  }) => (
    <Button
      variant="ghost"
      onClick={() => onSort(column)}
      className="h-auto p-0 hover:bg-transparent"
    >
      {label}
      <ArrowUpDown className="ml-2 h-4 w-4" />
    </Button>
  )

  // Loading skeleton
  if (loading && !leads) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Postcode</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Survey Status</TableHead>
              <TableHead>Account Manager</TableHead>
              <TableHead>Field Rep</TableHead>
              <TableHead>Created Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 10 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell>
                  <div className="h-4 bg-muted animate-pulse rounded" />
                </TableCell>
                <TableCell>
                  <div className="h-4 bg-muted animate-pulse rounded" />
                </TableCell>
                <TableCell>
                  <div className="h-4 bg-muted animate-pulse rounded" />
                </TableCell>
                <TableCell>
                  <div className="h-6 bg-muted animate-pulse rounded" />
                </TableCell>
                <TableCell>
                  <div className="h-6 bg-muted animate-pulse rounded" />
                </TableCell>
                <TableCell>
                  <div className="h-4 bg-muted animate-pulse rounded" />
                </TableCell>
                <TableCell>
                  <div className="h-4 bg-muted animate-pulse rounded" />
                </TableCell>
                <TableCell>
                  <div className="h-4 bg-muted animate-pulse rounded" />
                </TableCell>
                <TableCell>
                  <div className="h-4 bg-muted animate-pulse rounded" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="rounded-md border border-destructive p-4">
        <p className="text-sm text-destructive">
          Error loading leads: {error.message}
        </p>
      </div>
    )
  }

  // Empty state
  if (!leads || leads.length === 0) {
    return (
      <div className="rounded-md border p-8 text-center">
        <p className="text-muted-foreground mb-2">No leads found</p>
        <p className="text-sm text-muted-foreground">
          Try adjusting your filters or add a new lead to get started.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <SortableHeader column="Customer_Name" label="Customer Name" />
            </TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>
              <SortableHeader column="Postcode" label="Postcode" />
            </TableHead>
            <TableHead>
              <SortableHeader column="Status" label="Status" />
            </TableHead>
            <TableHead>Survey Status</TableHead>
            <TableHead>Account Manager</TableHead>
            <TableHead>Field Rep</TableHead>
            <TableHead>
              <SortableHeader column="Created_At" label="Created Date" />
            </TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.map((lead) => (
            <TableRow
              key={lead.id}
              className="cursor-pointer"
              onClick={() => onRowClick(lead.id)}
            >
              <TableCell className="font-medium">
                {lead.Customer_Name}
              </TableCell>
              <TableCell>{lead.Customer_Tel}</TableCell>
              <TableCell>{lead.Postcode}</TableCell>
              <TableCell>
                {lead.Status && (
                  <span
                    className={cn(
                      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                      statusColors[lead.Status] || 'bg-gray-100 text-gray-800'
                    )}
                  >
                    {lead.Status}
                  </span>
                )}
              </TableCell>
              <TableCell onClick={(e) => e.stopPropagation()}>
                <SurveyStatusBadge
                  leadId={lead.id.toString()}
                  currentStatus={lead.Survey_Status}
                  surveyBookedDate={lead.Survey_Booked_Date}
                  onStatusChange={onRefetch}
                />
              </TableCell>
              <TableCell>{lead.Account_Manager}</TableCell>
              <TableCell>{lead.Field_Rep}</TableCell>
              <TableCell>
                {lead.Created_At &&
                  format(new Date(lead.Created_At), 'MMM d, yyyy')}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      onRowClick(lead.id)
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
