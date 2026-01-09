/**
 * DateRangeFilter Component
 * Allows users to filter dashboard metrics by date range
 */

'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Calendar } from '@/components/ui/calendar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CalendarIcon } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import {
  formatDateForDisplay,
  formatDateRangeForDisplay,
  getThisMonth,
  getLastMonth,
  getLastQuarter,
  getLastYear,
} from '@/lib/utils/date'
import type { DateRange, DatePreset } from '@/types/metrics'

interface DateRangeFilterProps {
  dateFrom: Date
  dateTo: Date
}

export function DateRangeFilter({ dateFrom, dateTo }: DateRangeFilterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Local state for filter inputs before applying
  const [selectedPreset, setSelectedPreset] = useState<DatePreset>('this-month')
  const [customFrom, setCustomFrom] = useState<Date>(dateFrom)
  const [customTo, setCustomTo] = useState<Date>(dateTo)

  const presets: Record<DatePreset, DateRange> = {
    'this-month': getThisMonth(),
    'last-month': getLastMonth(),
    'last-quarter': getLastQuarter(),
    'last-year': getLastYear(),
    custom: { from: customFrom, to: customTo },
  }

  const handlePresetChange = (preset: DatePreset) => {
    setSelectedPreset(preset)

    if (preset !== 'custom') {
      const range = presets[preset]
      setCustomFrom(range.from)
      setCustomTo(range.to)
    }
  }

  const handleApply = () => {
    const range = selectedPreset === 'custom' ? { from: customFrom, to: customTo } : presets[selectedPreset]

    // Update URL search params
    const params = new URLSearchParams(searchParams.toString())
    params.set('dateFrom', range.from.toISOString().split('T')[0])
    params.set('dateTo', range.to.toISOString().split('T')[0])

    router.push(`?${params.toString()}`)
  }

  return (
    <Card className="p-4">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
        {/* Preset Selector */}
        <div className="flex-1 min-w-[200px]">
          <label className="text-sm font-medium mb-2 block">Date Range</label>
          <Select value={selectedPreset} onValueChange={(value) => handlePresetChange(value as DatePreset)}>
            <SelectTrigger>
              <SelectValue placeholder="Select range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="this-month">This Month</SelectItem>
              <SelectItem value="last-month">Last Month</SelectItem>
              <SelectItem value="last-quarter">Last Quarter</SelectItem>
              <SelectItem value="last-year">Last Year</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* From Date Picker */}
        <div className="flex-1 min-w-[180px]">
          <label className="text-sm font-medium mb-2 block">From</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal',
                  !customFrom && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {customFrom ? formatDateForDisplay(customFrom) : 'Pick a date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={customFrom}
                onSelect={(date) => {
                  if (date) {
                    setCustomFrom(date)
                    setSelectedPreset('custom')
                  }
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* To Date Picker */}
        <div className="flex-1 min-w-[180px]">
          <label className="text-sm font-medium mb-2 block">To</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal',
                  !customTo && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {customTo ? formatDateForDisplay(customTo) : 'Pick a date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={customTo}
                onSelect={(date) => {
                  if (date) {
                    setCustomTo(date)
                    setSelectedPreset('custom')
                  }
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Apply Button */}
        <Button onClick={handleApply} className="sm:mb-0">
          Apply
        </Button>
      </div>

      {/* Display Current Range */}
      <div className="mt-3 text-sm text-muted-foreground">
        Current range: <span className="font-medium">{formatDateRangeForDisplay({ from: dateFrom, to: dateTo })}</span>
      </div>
    </Card>
  )
}
