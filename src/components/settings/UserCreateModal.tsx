/**
 * User Create Modal Component
 * Form for inviting new users with validation (admin only)
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
import { useState } from 'react'
import type { UserRole } from '@/types/database'

// Form validation schema
const userCreateSchema = z
  .object({
    email: z.string().email('Valid email address required'),
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

type UserCreateFormData = z.infer<typeof userCreateSchema>

interface UserCreateModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => Promise<void>
}

export function UserCreateModal({
  open,
  onClose,
  onSuccess,
}: UserCreateModalProps) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<UserCreateFormData>({
    resolver: zodResolver(userCreateSchema),
  })

  const selectedRole = watch('role')

  const onSubmit = async (data: UserCreateFormData) => {
    setSaving(true)
    setError(null)

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create user')
      }

      reset()
      await onSuccess() // Trigger parent refetch
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user')
    } finally {
      setSaving(false)
    }
  }

  const handleClose = () => {
    reset()
    setError(null)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Invite New User</DialogTitle>
          <DialogDescription>
            Send an email invitation to create a new user account. The user will
            receive a magic link to set their password and log in.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Email */}
          <div>
            <Label htmlFor="email">
              Email Address <span className="text-destructive">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              {...register('email')}
              placeholder="user@example.com"
            />
            {errors.email && (
              <p className="text-sm text-destructive mt-1">
                {errors.email.message}
              </p>
            )}
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
            <Select onValueChange={(value) => setValue('role', value as UserRole)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a role..." />
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
                  Sending Invitation...
                </>
              ) : (
                'Send Invitation'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
