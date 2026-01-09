/**
 * Dashboard Page
 * Main dashboard with real-time metrics and visualizations
 */

import { createServerClient } from '@/lib/supabase/server'
import { DashboardContent } from '@/components/dashboard/DashboardContent'
import { DateRangeFilter } from '@/components/dashboard/DateRangeFilter'
import { getThisMonth, parseDateParam } from '@/lib/utils/date'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import type { UserProfile } from '@/types/database'

interface DashboardPageProps {
  searchParams: {
    dateFrom?: string
    dateTo?: string
  }
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  // Get authenticated user profile server-side
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  console.log('Dashboard: User check', {
    hasUser: !!user,
    userId: user?.id
  })

  // Don't redirect - middleware handles auth
  // If no user somehow, show error instead
  if (!user) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Authentication Error</AlertTitle>
          <AlertDescription>
            Unable to load user session. Please try logging out and back in.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const { data: profile, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single() as { data: UserProfile | null; error: Error | null }

  console.log('Dashboard: Profile check', {
    hasProfile: !!profile,
    error: error?.message
  })

  // Handle profile lookup failure gracefully
  if (error || !profile) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Profile Error</AlertTitle>
          <AlertDescription>
            Unable to load user profile: {error?.message || 'Profile not found'}
            <br />
            <br />
            User ID: {user.id}
            <br />
            This user may not have a profile record in the database.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // Parse date params or use default (This Month)
  const defaultRange = getThisMonth()
  const dateFrom = parseDateParam(searchParams.dateFrom) ?? defaultRange.from
  const dateTo = parseDateParam(searchParams.dateTo) ?? defaultRange.to

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Real-time solar lead analytics and performance metrics
        </p>
      </div>

      {/* Date Range Filter */}
      <DateRangeFilter dateFrom={dateFrom} dateTo={dateTo} />

      {/* Dashboard Content - All metrics, charts, and tables */}
      <DashboardContent
        userRole={profile.role}
        userName={profile.full_name}
        dateFrom={dateFrom}
        dateTo={dateTo}
      />
    </div>
  )
}
