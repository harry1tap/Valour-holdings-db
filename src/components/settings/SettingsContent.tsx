/**
 * Settings Content Component
 * Main orchestrator for user management - manages state and coordinates all child components
 */

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { UserPlus } from 'lucide-react'
import { useUsers } from '@/lib/hooks/useUsers'
import { UsersTable } from './UsersTable'
import { UserCreateModal } from './UserCreateModal'
import { UserDetailModal } from './UserDetailModal'
import { UserDeleteDialog } from './UserDeleteDialog'
import type { UserProfile } from '@/types/database'

export function SettingsContent() {
  // Fetch users data
  const { users, loading, error, refresh } = useUsers()

  // Modal state management
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [userToDeactivate, setUserToDeactivate] = useState<UserProfile | null>(
    null
  )

  // Handler for edit button
  const handleEdit = (user: UserProfile) => {
    setSelectedUser(user)
    setIsDetailModalOpen(true)
  }

  // Handler for deactivate button
  const handleDeactivate = (user: UserProfile) => {
    setUserToDeactivate(user)
  }

  // Handler for activate button (reactivate inactive users)
  const handleActivate = async (user: UserProfile) => {
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: user.full_name,
          role: user.role,
          account_manager_name: user.account_manager_name,
          is_active: true,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to activate user')
      }

      // Refresh users list
      await refresh()
    } catch (err) {
      console.error('Error activating user:', err)
      // Could add toast notification here
    }
  }

  return (
    <div className="space-y-6">
      {/* Header with Invite Button */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">User Management</h2>
          <p className="text-muted-foreground">
            Manage user accounts and permissions
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Invite User
        </Button>
      </div>

      {/* Users Table */}
      <UsersTable
        users={users}
        loading={loading}
        error={error}
        onEdit={handleEdit}
        onDeactivate={handleDeactivate}
        onActivate={handleActivate}
      />

      {/* User Create Modal */}
      <UserCreateModal
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={refresh}
      />

      {/* User Detail Modal (Edit) */}
      <UserDetailModal
        user={selectedUser}
        open={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false)
          setSelectedUser(null)
        }}
        onSuccess={refresh}
      />

      {/* User Delete Dialog (Deactivate) */}
      <UserDeleteDialog
        user={userToDeactivate}
        open={!!userToDeactivate}
        onClose={() => setUserToDeactivate(null)}
        onSuccess={refresh}
      />
    </div>
  )
}
