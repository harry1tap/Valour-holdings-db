/**
 * Lead Filters Component
 * Search and filter controls for leads table
 */

'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { CalendarIcon, X } from 'lucide-react'
import { format } from 'date-fns'
import type { LeadFilters } from '@/types/leads'

interface LeadFiltersProps {
  filters: LeadFilters
  onFiltersChange: (filters: LeadFilters) => void
  userRole: string
}

export function LeadFilters({
  filters,
  onFiltersChange,
  userRole,
}: LeadFiltersProps) {
  const [searchInput, setSearchInput] = useState(filters.search || '')

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      onFiltersChange({ ...filters, search: searchInput || undefined })
    }, 500)

    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput])

  // Count active filters
  const activeFilterCount = Object.keys(filters).filter(
    (key) => filters[key as keyof LeadFilters] !== undefined
  ).length

  const clearFilters = () => {
    setSearchInput('')
    onFiltersChange({})
  }

  return (
    <div className="space-y-4">
      {/* Search input */}
      <div className="flex items-center gap-2">
        <Input
          placeholder="Search customer name, email, phone, postcode..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="max-w-md"
        />
        {activeFilterCount > 0 && (
          <Button variant="outline" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4 mr-2" />
            Clear Filters ({activeFilterCount})
          </Button>
        )}
      </div>

      {/* Filter dropdowns and inputs */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Status filter */}
        <Select
          value={filters.status || 'all'}
          onValueChange={(value) =>
            onFiltersChange({
              ...filters,
              status: value === 'all' ? undefined : value,
            })
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="New Lead">New Lead</SelectItem>
            <SelectItem value="Survey Booked">Survey Booked</SelectItem>
            <SelectItem value="Survey Complete">Survey Complete</SelectItem>
            <SelectItem value="Install Complete">Install Complete</SelectItem>
            <SelectItem value="Fall Off">Fall Off</SelectItem>
          </SelectContent>
        </Select>

        {/* Survey Status filter */}
        <Select
          value={filters.surveyStatus || 'all'}
          onValueChange={(value) =>
            onFiltersChange({
              ...filters,
              surveyStatus: value === 'all' ? undefined : value,
            })
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Survey Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Survey Status</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="Good Survey">Good Survey</SelectItem>
            <SelectItem value="Bad Survey">Bad Survey</SelectItem>
            <SelectItem value="Sold Survey">Sold Survey</SelectItem>
          </SelectContent>
        </Select>

        {/* Account Manager filter - only for admins */}
        {userRole === 'admin' && (
          <Input
            placeholder="Account Manager"
            value={filters.accountManager || ''}
            onChange={(e) =>
              onFiltersChange({
                ...filters,
                accountManager: e.target.value || undefined,
              })
            }
            className="w-[180px]"
          />
        )}

        {/* Field Rep filter - for admins and account managers */}
        {(userRole === 'admin' || userRole === 'account_manager') && (
          <Input
            placeholder="Field Rep"
            value={filters.fieldRep || ''}
            onChange={(e) =>
              onFiltersChange({
                ...filters,
                fieldRep: e.target.value || undefined,
              })
            }
            className="w-[180px]"
          />
        )}

        {/* Date From picker */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-[180px] justify-start">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {filters.dateFrom
                ? format(filters.dateFrom, 'MMM d, yyyy')
                : 'Date From'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={filters.dateFrom}
              onSelect={(date) =>
                onFiltersChange({ ...filters, dateFrom: date })
              }
            />
          </PopoverContent>
        </Popover>

        {/* Date To picker */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-[180px] justify-start">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {filters.dateTo
                ? format(filters.dateTo, 'MMM d, yyyy')
                : 'Date To'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={filters.dateTo}
              onSelect={(date) => onFiltersChange({ ...filters, dateTo: date })}
            />
          </PopoverContent>
        </Popover>

        {/* Postcode filter */}
        <Input
          placeholder="Postcode"
          value={filters.postcode || ''}
          onChange={(e) =>
            onFiltersChange({
              ...filters,
              postcode: e.target.value || undefined,
            })
          }
          className="w-[120px]"
        />
      </div>
    </div>
  )
}
