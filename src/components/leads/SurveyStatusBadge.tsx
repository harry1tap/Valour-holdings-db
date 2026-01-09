/**
 * SurveyStatusBadge Component
 * Displays survey status with dropdown to change it
 */

'use client'

import { useState } from 'react'
import { Check, AlertCircle, DollarSign, MoreVertical } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface SurveyStatusBadgeProps {
  leadId: string
  currentStatus: string | null
  surveyBookedDate: string | null
  onStatusChange?: () => void
}

export function SurveyStatusBadge({
  leadId,
  currentStatus,
  surveyBookedDate,
  onStatusChange,
}: SurveyStatusBadgeProps) {
  const [isUpdating, setIsUpdating] = useState(false)

  // Only show if survey is booked
  if (!surveyBookedDate) {
    return <span className="text-muted-foreground text-sm">-</span>
  }

  const handleStatusChange = async (
    newStatus: 'Good Survey' | 'Bad Survey' | 'Sold Survey' | null
  ) => {
    setIsUpdating(true)
    try {
      const response = await fetch(`/api/leads/${leadId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ survey_status: newStatus }),
      })

      if (!response.ok) {
        throw new Error('Failed to update status')
      }

      // Trigger refetch in parent
      onStatusChange?.()
    } catch (error) {
      console.error('Error updating survey status:', error)
      alert('Failed to update survey status')
    } finally {
      setIsUpdating(false)
    }
  }

  const getStatusConfig = () => {
    switch (currentStatus) {
      case 'Good Survey':
        return {
          label: 'Good',
          variant: 'default' as const,
          icon: <Check className="h-3 w-3" />,
        }
      case 'Bad Survey':
        return {
          label: 'Bad',
          variant: 'destructive' as const,
          icon: <AlertCircle className="h-3 w-3" />,
        }
      case 'Sold Survey':
        return {
          label: 'Sold',
          variant: 'default' as const,
          icon: <DollarSign className="h-3 w-3" />,
        }
      default:
        return {
          label: 'Pending',
          variant: 'outline' as const,
          icon: null,
        }
    }
  }

  const config = getStatusConfig()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn('gap-1 h-7', isUpdating && 'opacity-50')}
          disabled={isUpdating}
        >
          <Badge variant={config.variant} className="gap-1">
            {config.icon}
            {config.label}
          </Badge>
          <MoreVertical className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleStatusChange('Good Survey')}>
          <Check className="h-4 w-4 mr-2 text-green-500" />
          Good Survey
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleStatusChange('Bad Survey')}>
          <AlertCircle className="h-4 w-4 mr-2 text-red-500" />
          Bad Survey
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleStatusChange('Sold Survey')}>
          <DollarSign className="h-4 w-4 mr-2 text-blue-500" />
          Sold Survey
        </DropdownMenuItem>
        {currentStatus && (
          <>
            <DropdownMenuItem
              onClick={() => handleStatusChange(null)}
              className="text-muted-foreground"
            >
              Clear Status
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
