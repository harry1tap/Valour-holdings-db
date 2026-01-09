/**
 * Settings Page
 * Admin-only settings and user management
 */

import { createServerClient } from '@/lib/supabase/server'
import { SettingsContent } from '@/components/settings/SettingsContent'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import type { UserProfile } from '@/types/database'

export default async function SettingsPage() {
  // Get authenticated user
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

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

  // Get user profile
  const { data: profile, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single() as { data: UserProfile | null; error: Error | null }

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

  // Admin-only access control
  if (profile.role !== 'admin') {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            Only Administrators can access the Settings page.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage user accounts and system settings
        </p>
      </div>

      {/* Settings Content */}
      <SettingsContent />
    </div>
  )
}
