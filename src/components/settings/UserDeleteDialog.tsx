/**
 * User Delete Dialog Component
 * Confirmation dialog for deactivating users (admin only)
 */

'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Loader2 } from 'lucide-react'
import { useState } from 'react'
import type { UserProfile } from '@/types/database'

interface UserDeleteDialogProps {
  user: UserProfile | null
  open: boolean
  onClose: () => void
  onSuccess: () => Promise<void>
}

export function UserDeleteDialog({
  user,
  open,
  onClose,
  onSuccess,
}: UserDeleteDialogProps) {
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleConfirm = async () => {
    if (!user) return

    setDeleting(true)
    setError(null)

    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to deactivate user')
      }

      await onSuccess() // Trigger parent refetch
      handleClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to deactivate user')
    } finally {
      setDeleting(false)
    }
  }

  const handleClose = () => {
    setError(null)
    onClose()
  }

  if (!user) return null

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Deactivate User</DialogTitle>
          <DialogDescription>
            This action will prevent the user from logging in but will preserve
            their data.
          </DialogDescription>
        </DialogHeader>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Are you sure you want to deactivate <strong>{user.full_name}</strong>{' '}
            ({user.email})?
            <br />
            <br />
            This will prevent them from logging in, but their data will be
            preserved. You can reactivate this user later if needed.
          </AlertDescription>
        </Alert>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={deleting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            disabled={deleting}
          >
            {deleting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Deactivating...
              </>
            ) : (
              'Deactivate User'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
