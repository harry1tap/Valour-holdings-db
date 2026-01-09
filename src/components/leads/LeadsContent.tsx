/**
 * Leads Content Component
 * Client wrapper for leads management with state management
 */

'use client'

import { useState } from 'react'
import { useSolarLeads } from '@/lib/hooks/useSolarLeads'
import { LeadFilters } from './LeadFilters'
import { LeadsTable } from './LeadsTable'
import { Pagination } from './Pagination'
import { LeadDetailModal } from './LeadDetailModal'
import { LeadCreateModal } from './LeadCreateModal'
import type { LeadFilters as LeadFiltersType, SortOrder } from '@/types/leads'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

interface LeadsContentProps {
  userRole: string
  userName: string
}

export function LeadsContent({ userRole, userName }: LeadsContentProps) {
  // State management
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(25)
  const [sortBy, setSortBy] = useState('Created_At')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [filters, setFilters] = useState<LeadFiltersType>({})
  const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  // Fetch leads using hook
  const { leads, loading, error, pagination, refetch } = useSolarLeads({
    page,
    limit,
    sortBy,
    sortOrder,
    filters,
    userRole,
    userName,
  })

  // Handle sorting
  const handleSort = (column: string) => {
    if (sortBy === column) {
      // Toggle sort order
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      // New column, default to descending
      setSortBy(column)
      setSortOrder('desc')
    }
  }

  // Handle filter changes (reset to page 1)
  const handleFiltersChange = (newFilters: LeadFiltersType) => {
    setFilters(newFilters)
    setPage(1)
  }

  // Handle limit change (reset to page 1)
  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit)
    setPage(1)
  }

  return (
    <div className="space-y-6">
      {/* Header with filters and add button */}
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1">
          <LeadFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            userRole={userRole}
          />
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Lead
        </Button>
      </div>

      {/* Leads table */}
      <LeadsTable
        leads={leads}
        loading={loading}
        error={error}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
        onRowClick={setSelectedLeadId}
        onRefetch={refetch}
        userRole={userRole}
      />

      {/* Pagination */}
      {pagination && (
        <Pagination
          currentPage={page}
          totalPages={pagination.totalPages}
          totalItems={pagination.total}
          itemsPerPage={limit}
          onPageChange={setPage}
          onLimitChange={handleLimitChange}
        />
      )}

      {/* Lead Detail Modal */}
      <LeadDetailModal
        leadId={selectedLeadId}
        isOpen={selectedLeadId !== null}
        onClose={() => setSelectedLeadId(null)}
        onSave={refetch}
        userRole={userRole}
      />

      {/* Lead Create Modal */}
      <LeadCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={refetch}
        userRole={userRole}
      />
    </div>
  )
}
