/**
 * Lead Detail Modal Component
 * View and edit full lead details with role-based permissions
 */

'use client'

import { useEffect, useState } from 'react'
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
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Loader2, Pencil, Save, X } from 'lucide-react'
import { format } from 'date-fns'
import type { SolarLead } from '@/types/leads'

interface LeadDetailModalProps {
  leadId: number | null
  isOpen: boolean
  onClose: () => void
  onSave: () => Promise<void>
  userRole: string
}

export function LeadDetailModal({
  leadId,
  isOpen,
  onClose,
  onSave,
  userRole,
}: LeadDetailModalProps) {
  const [lead, setLead] = useState<SolarLead | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editedLead, setEditedLead] = useState<Partial<SolarLead>>({})

  // Fetch lead data when modal opens
  useEffect(() => {
    if (isOpen && leadId) {
      fetchLead()
    } else {
      // Reset state when modal closes
      setLead(null)
      setIsEditing(false)
      setEditedLead({})
      setError(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, leadId])

  const fetchLead = async () => {
    if (!leadId) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/leads/${leadId}`, {
        method: 'GET',
      })

      if (!response.ok) {
        throw new Error('Failed to fetch lead')
      }

      const result = await response.json()
      if (result.data) {
        setLead(result.data)
        setEditedLead(result.data)
      } else {
        setError('Lead not found')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!lead || !leadId) return

    setSaving(true)
    setError(null)

    try {
      const response = await fetch('/api/leads', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: leadId, ...editedLead }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update lead')
      }

      const result = await response.json()
      setLead(result.data)
      setEditedLead(result.data)
      setIsEditing(false)
      await onSave() // Trigger parent refetch
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!leadId || !confirm('Are you sure you want to delete this lead?'))
      return

    setSaving(true)
    setError(null)

    try {
      const response = await fetch(`/api/leads?id=${leadId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete lead')
      }

      await onSave() // Trigger parent refetch
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete lead')
    } finally {
      setSaving(false)
    }
  }

  const canEdit = (field: string) => {
    if (userRole === 'admin') return true
    if (userRole === 'field_rep') {
      return field === 'Notes' || field === 'Installer_Notes'
    }
    if (userRole === 'installer') {
      // Installers can ONLY edit Installer_Notes
      return field === 'Installer_Notes'
    }
    if (userRole === 'account_manager') {
      // Account managers can't edit financial fields
      const financialFields = [
        'Lead_Cost',
        'Lead_Revenue',
        'Commission_Amount',
        'Commission_Paid',
      ]
      return !financialFields.includes(field)
    }
    return false
  }

  const canDelete = userRole === 'admin' || userRole === 'account_manager'

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl">
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (!lead) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error || 'Lead not found'}
            </AlertDescription>
          </Alert>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>
              {isEditing ? 'Edit Lead' : 'Lead Details'}
            </DialogTitle>
            <div className="flex gap-2">
              {!isEditing ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  {canDelete && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleDelete}
                      disabled={saving}
                    >
                      Delete
                    </Button>
                  )}
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsEditing(false)
                      setEditedLead(lead)
                      setError(null)
                    }}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSave} disabled={saving}>
                    {saving ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Save
                  </Button>
                </>
              )}
            </div>
          </div>
          <DialogDescription>
            Lead ID: {lead.id} | Created:{' '}
            {lead.Created_At && format(new Date(lead.Created_At), 'PPP')}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-6 py-4">
          {/* Customer Information */}
          <div>
            <h3 className="font-semibold mb-3">Customer Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Customer Name</Label>
                {isEditing && canEdit('Customer_Name') ? (
                  <Input
                    value={editedLead.Customer_Name || ''}
                    onChange={(e) =>
                      setEditedLead({
                        ...editedLead,
                        Customer_Name: e.target.value,
                      })
                    }
                  />
                ) : (
                  <p className="text-sm mt-1">{lead.Customer_Name}</p>
                )}
              </div>
              <div>
                <Label>Phone</Label>
                {isEditing && canEdit('Customer_Tel') ? (
                  <Input
                    value={editedLead.Customer_Tel || ''}
                    onChange={(e) =>
                      setEditedLead({
                        ...editedLead,
                        Customer_Tel: e.target.value,
                      })
                    }
                  />
                ) : (
                  <p className="text-sm mt-1">{lead.Customer_Tel}</p>
                )}
              </div>
              <div>
                <Label>Email</Label>
                {isEditing && canEdit('Customer_Email') ? (
                  <Input
                    value={editedLead.Customer_Email || ''}
                    onChange={(e) =>
                      setEditedLead({
                        ...editedLead,
                        Customer_Email: e.target.value,
                      })
                    }
                  />
                ) : (
                  <p className="text-sm mt-1">{lead.Customer_Email || '-'}</p>
                )}
              </div>
              <div>
                <Label>Alternative Phone</Label>
                {isEditing && canEdit('Alternative_Tel') ? (
                  <Input
                    value={editedLead.Alternative_Tel || ''}
                    onChange={(e) =>
                      setEditedLead({
                        ...editedLead,
                        Alternative_Tel: e.target.value,
                      })
                    }
                  />
                ) : (
                  <p className="text-sm mt-1">{lead.Alternative_Tel || '-'}</p>
                )}
              </div>
              <div className="col-span-2">
                <Label>Address</Label>
                {isEditing && canEdit('First_Line_Of_Address') ? (
                  <Input
                    value={editedLead.First_Line_Of_Address || ''}
                    onChange={(e) =>
                      setEditedLead({
                        ...editedLead,
                        First_Line_Of_Address: e.target.value,
                      })
                    }
                  />
                ) : (
                  <p className="text-sm mt-1">{lead.First_Line_Of_Address}</p>
                )}
              </div>
              <div>
                <Label>Postcode</Label>
                {isEditing && canEdit('Postcode') ? (
                  <Input
                    value={editedLead.Postcode || ''}
                    onChange={(e) =>
                      setEditedLead({
                        ...editedLead,
                        Postcode: e.target.value,
                      })
                    }
                  />
                ) : (
                  <p className="text-sm mt-1">{lead.Postcode}</p>
                )}
              </div>
              <div>
                <Label>Property Type</Label>
                <p className="text-sm mt-1">{lead.Property_Type || '-'}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Lead Information */}
          <div>
            <h3 className="font-semibold mb-3">Lead Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Status</Label>
                {isEditing && canEdit('Status') ? (
                  <Select
                    value={editedLead.Status || ''}
                    onValueChange={(value) =>
                      setEditedLead({ ...editedLead, Status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="New Lead">New Lead</SelectItem>
                      <SelectItem value="Survey Booked">
                        Survey Booked
                      </SelectItem>
                      <SelectItem value="Survey Complete">
                        Survey Complete
                      </SelectItem>
                      <SelectItem value="Install Complete">
                        Install Complete
                      </SelectItem>
                      <SelectItem value="Fall Off">Fall Off</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm mt-1">{lead.Status || '-'}</p>
                )}
              </div>
              <div>
                <Label>Survey Status</Label>
                <p className="text-sm mt-1">{lead.Survey_Status || '-'}</p>
              </div>
              <div>
                <Label>Lead Source</Label>
                <p className="text-sm mt-1">{lead.Lead_Source || '-'}</p>
              </div>
              <div>
                <Label>Payment Model</Label>
                <p className="text-sm mt-1">{lead.Payment_Model || '-'}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Staff Assignment */}
          <div>
            <h3 className="font-semibold mb-3">Staff Assignment</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Account Manager</Label>
                <p className="text-sm mt-1">{lead.Account_Manager || '-'}</p>
              </div>
              <div>
                <Label>Field Rep</Label>
                <p className="text-sm mt-1">{lead.Field_Rep || '-'}</p>
              </div>
              <div>
                <Label>Installer</Label>
                <p className="text-sm mt-1">{lead.Installer || '-'}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Notes */}
          <div>
            <h3 className="font-semibold mb-3">Notes</h3>
            <div className="space-y-4">
              <div>
                <Label>Notes</Label>
                {isEditing && canEdit('Notes') ? (
                  <textarea
                    value={editedLead.Notes || ''}
                    onChange={(e) =>
                      setEditedLead({ ...editedLead, Notes: e.target.value })
                    }
                    className="w-full min-h-[100px] px-3 py-2 text-sm border rounded-md"
                  />
                ) : (
                  <p className="text-sm mt-1 whitespace-pre-wrap">
                    {lead.Notes || '-'}
                  </p>
                )}
              </div>
              <div>
                <Label>Installer Notes</Label>
                {isEditing && canEdit('Installer_Notes') ? (
                  <textarea
                    value={editedLead.Installer_Notes || ''}
                    onChange={(e) =>
                      setEditedLead({
                        ...editedLead,
                        Installer_Notes: e.target.value,
                      })
                    }
                    className="w-full min-h-[100px] px-3 py-2 text-sm border rounded-md"
                  />
                ) : (
                  <p className="text-sm mt-1 whitespace-pre-wrap">
                    {lead.Installer_Notes || '-'}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
