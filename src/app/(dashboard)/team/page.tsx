/**
 * Team Performance Page
 * View staff performance metrics
 * Only visible to Admin and Account Manager roles
 *
 * TODO Phase 4:
 * - Add staff performance table
 * - Add comparison charts
 * - Add role-based filtering (Field Reps vs Account Managers)
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function TeamPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Team Performance</h1>
        <p className="text-muted-foreground">
          View performance metrics for your team members
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Team Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Coming in Phase 4: Staff performance comparison and analytics
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
