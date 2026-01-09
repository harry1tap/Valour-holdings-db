/**
 * Split CPL Card Component
 * Displays CPL for Online and Field channels side-by-side
 */

'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency } from '@/lib/utils/formatting'

interface SplitCPLCardProps {
  cplOnline: number
  cplField: number
  loading?: boolean
}

export function SplitCPLCard({
  cplOnline,
  cplField,
  loading = false,
}: SplitCPLCardProps) {
  if (loading) {
    return (
      <Card className="col-span-1 md:col-span-2">
        <CardContent className="p-6">
          <Skeleton className="h-4 w-32 mb-4" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="col-span-1 md:col-span-2 border-l-4 border-l-primary hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          COST PER LEAD (SPLIT)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {/* Online CPL */}
          <div className="flex flex-col items-center justify-center p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm font-medium text-muted-foreground mb-2">
              Online
            </p>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {formatCurrency(cplOnline)}
            </p>
          </div>

          {/* Field CPL */}
          <div className="flex flex-col items-center justify-center p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
            <p className="text-sm font-medium text-muted-foreground mb-2">
              Field
            </p>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">
              {formatCurrency(cplField)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
