/**
 * Leads Page
 * List and search solar leads
 *
 * TODO Phase 3:
 * - Add LeadTable component
 * - Add search and filters
 * - Add pagination
 * - Add LeadDetailModal
 * - Add real-time updates
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function LeadsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Leads</h1>
        <p className="text-muted-foreground">
          View and manage solar installation leads
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Leads Management</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Coming in Phase 3: Lead table with search, filters, and detail view
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
