/**
 * Lead Create Modal Component
 * Form for creating new leads with validation
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
import { LEAD_SOURCES } from '@/types/leads'
import { useState } from 'react'

// Form validation schema
const leadSchema = z.object({
  Customer_Name: z.string().min(2, 'Name must be at least 2 characters'),
  Customer_Tel: z
    .string()
    .regex(/^[0-9\s\+\-\(\)]+$/, 'Valid phone number required'),
  Customer_Email: z
    .string()
    .email('Valid email required')
    .optional()
    .or(z.literal('')),
  Alternative_Tel: z.string().optional(),
  First_Line_Of_Address: z.string().min(3, 'Address required'),
  Postcode: z
    .string()
    .regex(
      /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i,
      'Valid UK postcode required'
    ),
  Property_Type: z.string().optional(),
  Lead_Source: z.string().optional(),
  Account_Manager: z.string().optional(),
  Field_Rep: z.string().optional(),
  Status: z.string().optional(),
  Payment_Model: z.string().optional(),
  Lead_Cost: z.number().optional(),
  Notes: z.string().optional(),
})

type LeadFormData = z.infer<typeof leadSchema>

interface LeadCreateModalProps {
  isOpen: boolean
  onClose: () => void
  onCreate: () => Promise<void>
  userRole: string
}

export function LeadCreateModal({
  isOpen,
  onClose,
  onCreate,
  userRole,
}: LeadCreateModalProps) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<LeadFormData>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      Status: 'New',
    },
  })

  const onSubmit = async (data: LeadFormData) => {
    setSaving(true)
    setError(null)

    try {
      const response = await fetch('/api/leads/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create lead')
      }

      reset()
      await onCreate() // Trigger parent refetch
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create lead')
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
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Lead</DialogTitle>
          <DialogDescription>
            Fill in the details below to create a new solar lead.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Customer Information */}
          <div>
            <h3 className="font-semibold mb-3">Customer Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="Customer_Name">
                  Customer Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="Customer_Name"
                  {...register('Customer_Name')}
                  placeholder="John Doe"
                />
                {errors.Customer_Name && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.Customer_Name.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="Customer_Tel">
                  Phone Number <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="Customer_Tel"
                  {...register('Customer_Tel')}
                  placeholder="07700 900123"
                />
                {errors.Customer_Tel && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.Customer_Tel.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="Customer_Email">Email</Label>
                <Input
                  id="Customer_Email"
                  type="email"
                  {...register('Customer_Email')}
                  placeholder="john@example.com"
                />
                {errors.Customer_Email && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.Customer_Email.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="Alternative_Tel">Alternative Phone</Label>
                <Input
                  id="Alternative_Tel"
                  {...register('Alternative_Tel')}
                  placeholder="Optional"
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="First_Line_Of_Address">
                  Address <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="First_Line_Of_Address"
                  {...register('First_Line_Of_Address')}
                  placeholder="123 Main Street"
                />
                {errors.First_Line_Of_Address && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.First_Line_Of_Address.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="Postcode">
                  Postcode <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="Postcode"
                  {...register('Postcode')}
                  placeholder="SW1A 1AA"
                />
                {errors.Postcode && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.Postcode.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="Property_Type">Property Type</Label>
                <Select
                  onValueChange={(value) => setValue('Property_Type', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Detached">Detached</SelectItem>
                    <SelectItem value="Semi-Detached">Semi-Detached</SelectItem>
                    <SelectItem value="Terraced">Terraced</SelectItem>
                    <SelectItem value="Flat">Flat</SelectItem>
                    <SelectItem value="Bungalow">Bungalow</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Lead Information */}
          <div>
            <h3 className="font-semibold mb-3">Lead Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="Lead_Source">Lead Source</Label>
                <Select
                  onValueChange={(value) => setValue('Lead_Source', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select source..." />
                  </SelectTrigger>
                  <SelectContent>
                    {LEAD_SOURCES.map((source) => (
                      <SelectItem key={source} value={source}>
                        {source}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="Status">Status</Label>
                <Select
                  defaultValue="New"
                  onValueChange={(value) => setValue('Status', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="New">New</SelectItem>
                    <SelectItem value="Contacted">Contacted</SelectItem>
                    <SelectItem value="Qualified">Qualified</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="Payment_Model">Payment Model</Label>
                <Input
                  id="Payment_Model"
                  {...register('Payment_Model')}
                  placeholder="e.g., Cash, Finance"
                />
              </div>

              <div>
                <Label htmlFor="Lead_Cost">Lead Cost (£)</Label>
                <Input
                  id="Lead_Cost"
                  type="number"
                  step="0.01"
                  {...register('Lead_Cost', { valueAsNumber: true })}
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          {/* Staff Assignment */}
          <div>
            <h3 className="font-semibold mb-3">Staff Assignment</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="Account_Manager">Account Manager</Label>
                <Input
                  id="Account_Manager"
                  {...register('Account_Manager')}
                  placeholder="Enter name"
                />
              </div>

              <div>
                <Label htmlFor="Field_Rep">Field Rep</Label>
                <Input
                  id="Field_Rep"
                  {...register('Field_Rep')}
                  placeholder="Enter name"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <h3 className="font-semibold mb-3">Notes</h3>
            <div>
              <Label htmlFor="Notes">Notes</Label>
              <textarea
                id="Notes"
                {...register('Notes')}
                placeholder="Add any additional notes..."
                className="w-full min-h-[100px] px-3 py-2 text-sm border rounded-md"
              />
            </div>
          </div>

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
                  Creating...
                </>
              ) : (
                'Create Lead'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
