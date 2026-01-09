/**
 * User Detail Modal Component
 * Form for editing existing user details (admin only)
 */

'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Loader2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import type { UserProfile, UserRole } from '@/types/database'

// Form validation schema
const userUpdateSchema = z
  .object({
    full_name: z.string().min(2, 'Name must be at least 2 characters'),
    role: z.enum(['admin', 'account_manager', 'field_rep']),
    account_manager_name: z.string().optional(),
  })
  .refine(
    (data) => {
      // Account Manager required for Field Reps
      if (data.role === 'field_rep') {
        return !!data.account_manager_name && data.account_manager_name.length > 0
      }
      return true
    },
    {
      message: 'Account Manager is required for Field Reps',
      path: ['account_manager_name'],
    }
  )

type UserUpdateFormData = z.infer<typeof userUpdateSchema>

interface UserDetailModalProps {
  user: UserProfile | null
  open: boolean
  onClose: () => void
  onSuccess: () => Promise<void>
}

export function UserDetailModal({
  user,
  open,
  onClose,
  onSuccess,
}: UserDetailModalProps) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<UserUpdateFormData>({
    resolver: zodResolver(userUpdateSchema),
  })

  const selectedRole = watch('role')

  // Pre-fill form when user changes
  useEffect(() => {
    if (user) {
      setValue('full_name', user.full_name)
      setValue('role', user.role)
      setValue('account_manager_name', user.account_manager_name || '')
    }
  }, [user, setValue])

  const onSubmit = async (data: UserUpdateFormData) => {
    if (!user) return

    setSaving(true)
    setError(null)

    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update user')
      }

      await onSuccess() // Trigger parent refetch
      handleClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user')
    } finally {
      setSaving(false)
    }
  }

  const handleClose = () => {
    reset()
    setError(null)
    onClose()
  }

  if (!user) return null

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            Update user account details. Email addresses cannot be changed.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Email (read-only) */}
          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={user.email}
              disabled
              className="bg-muted"
            />
            <p className="text-sm text-muted-foreground mt-1">
              Email addresses cannot be changed
            </p>
          </div>

          {/* Full Name */}
          <div>
            <Label htmlFor="full_name">
              Full Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="full_name"
              {...register('full_name')}
              placeholder="John Doe"
            />
            {errors.full_name && (
              <p className="text-sm text-destructive mt-1">
                {errors.full_name.message}
              </p>
            )}
          </div>

          {/* Role */}
          <div>
            <Label htmlFor="role">
              Role <span className="text-destructive">*</span>
            </Label>
            <Select
              defaultValue={user.role}
              onValueChange={(value) => setValue('role', value as UserRole)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="account_manager">Account Manager</SelectItem>
                <SelectItem value="field_rep">Field Rep</SelectItem>
              </SelectContent>
            </Select>
            {errors.role && (
              <p className="text-sm text-destructive mt-1">
                {errors.role.message}
              </p>
            )}
          </div>

          {/* Account Manager (conditional - only for Field Reps) */}
          {selectedRole === 'field_rep' && (
            <div>
              <Label htmlFor="account_manager_name">
                Account Manager <span className="text-destructive">*</span>
              </Label>
              <Input
                id="account_manager_name"
                {...register('account_manager_name')}
                placeholder="Enter Account Manager name"
              />
              {errors.account_manager_name && (
                <p className="text-sm text-destructive mt-1">
                  {errors.account_manager_name.message}
                </p>
              )}
              <p className="text-sm text-muted-foreground mt-1">
                Required for Field Rep role
              </p>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update User'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
