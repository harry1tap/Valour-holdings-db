/**
 * Users Table Component
 * Displays users in a sortable table with actions (admin only)
 */

'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Pencil, Trash2, Check } from 'lucide-react'
import { format } from 'date-fns'
import type { UserProfile } from '@/types/database'
import { cn } from '@/lib/utils/cn'

interface UsersTableProps {
  users: UserProfile[] | null
  loading: boolean
  error: Error | null
  onEdit: (user: UserProfile) => void
  onDeactivate: (user: UserProfile) => void
  onActivate: (user: UserProfile) => void
}

// Role badge colors
const roleColors: Record<string, string> = {
  admin: 'bg-purple-100 text-purple-800',
  account_manager: 'bg-blue-100 text-blue-800',
  field_rep: 'bg-gray-100 text-gray-800',
  installer: 'bg-orange-100 text-orange-800',
}

// Role display names
const roleLabels: Record<string, string> = {
  admin: 'Admin',
  account_manager: 'Account Manager',
  field_rep: 'Field Rep',
  installer: 'Installer',
}

export function UsersTable({
  users,
  loading,
  error,
  onEdit,
  onDeactivate,
  onActivate,
}: UsersTableProps) {
  // Loading skeleton
  if (loading && !users) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Account Manager</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 8 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell>
                  <div className="h-4 bg-muted animate-pulse rounded" />
                </TableCell>
                <TableCell>
                  <div className="h-4 bg-muted animate-pulse rounded" />
                </TableCell>
                <TableCell>
                  <div className="h-6 bg-muted animate-pulse rounded w-24" />
                </TableCell>
                <TableCell>
                  <div className="h-4 bg-muted animate-pulse rounded" />
                </TableCell>
                <TableCell>
                  <div className="h-6 bg-muted animate-pulse rounded w-16" />
                </TableCell>
                <TableCell>
                  <div className="h-4 bg-muted animate-pulse rounded" />
                </TableCell>
                <TableCell>
                  <div className="h-4 bg-muted animate-pulse rounded" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="rounded-md border border-destructive p-4">
        <p className="text-sm text-destructive">
          Error loading users: {error.message}
        </p>
      </div>
    )
  }

  // Empty state
  if (!users || users.length === 0) {
    return (
      <div className="rounded-md border p-8 text-center">
        <p className="text-muted-foreground mb-2">No users found</p>
        <p className="text-sm text-muted-foreground">
          Click the &quot;Invite User&quot; button to add your first user.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Account Manager</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created Date</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">{user.full_name}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                <Badge
                  variant="secondary"
                  className={cn(
                    roleColors[user.role] || 'bg-gray-100 text-gray-800'
                  )}
                >
                  {roleLabels[user.role] || user.role}
                </Badge>
              </TableCell>
              <TableCell>
                {user.role === 'field_rep'
                  ? user.account_manager_name || '-'
                  : '-'}
              </TableCell>
              <TableCell>
                <Badge
                  variant={user.is_active ? 'default' : 'secondary'}
                  className={
                    user.is_active
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }
                >
                  {user.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </TableCell>
              <TableCell>
                {user.created_at &&
                  format(new Date(user.created_at), 'MMM d, yyyy')}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(user)}
                    title="Edit user"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  {user.is_active ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeactivate(user)}
                      title="Deactivate user"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onActivate(user)}
                      title="Activate user"
                      className="text-green-600 hover:text-green-700 hover:bg-green-50"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
