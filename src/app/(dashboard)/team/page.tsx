/**
 * Team Performance Page
 * View staff performance metrics
 * Only visible to Admin and Account Manager roles
 */

import { createServerClient } from '@/lib/supabase/server'
import { TeamContent } from '@/components/team/TeamContent'
import { DateRangeFilter } from '@/components/dashboard/DateRangeFilter'
import { getThisMonth, parseDateParam } from '@/lib/utils/date'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import type { UserProfile } from '@/types/database'

interface TeamPageProps {
  searchParams: {
    dateFrom?: string
    dateTo?: string
  }
}

export default async function TeamPage({ searchParams }: TeamPageProps) {
  // Get authenticated user profile server-side
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Don't redirect - middleware handles auth
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

  // Handle profile lookup failure
  if (error || !profile) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Profile Error</AlertTitle>
          <AlertDescription>
            Unable to load user profile. Please contact support.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // Role-based access control - only Admin and Account Managers can view team page
  if (profile.role === 'field_rep') {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            Only Administrators and Account Managers can view the Team Performance page.
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
        <h1 className="text-3xl font-bold tracking-tight">Team Performance</h1>
        <p className="text-muted-foreground">
          View performance metrics and analytics for your team members
        </p>
      </div>

      {/* Date Range Filter */}
      <DateRangeFilter dateFrom={dateFrom} dateTo={dateTo} />

      {/* Team Content - All metrics, charts, and tables */}
      <TeamContent
        userRole={profile.role}
        userName={profile.full_name}
        dateFrom={dateFrom}
        dateTo={dateTo}
      />
    </div>
  )
}
