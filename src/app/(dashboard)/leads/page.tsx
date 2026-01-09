/**
 * Leads Page
 * List and search solar leads with full CRUD operations
 */

import { createServerClient } from '@/lib/supabase/server'
import { LeadsContent } from '@/components/leads/LeadsContent'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import type { UserProfile } from '@/types/database'

export default async function LeadsPage() {
  // Create server client for authentication
  const supabase = await createServerClient()

  // Verify user is authenticated
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Leads</h1>
          <p className="text-muted-foreground">
            View and manage solar installation leads
          </p>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Authentication Error</AlertTitle>
          <AlertDescription>
            You must be logged in to view leads.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // Get user profile for role-based access
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single() as { data: Pick<UserProfile, 'role' | 'full_name'> | null; error: Error | null }

  if (profileError || !profile) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Leads</h1>
          <p className="text-muted-foreground">
            View and manage solar installation leads
          </p>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Profile Error</AlertTitle>
          <AlertDescription>
            Unable to load your profile. Please contact support.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Leads Management</h1>
        <p className="text-muted-foreground">
          Manage and track solar installation leads
        </p>
      </div>

      <LeadsContent userRole={profile.role} userName={profile.full_name} />
    </div>
  )
}
