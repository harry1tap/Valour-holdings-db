/**
 * PATCH /api/leads/[id]/status
 * Update survey status for a lead
 */

import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

interface StatusUpdateRequest {
  survey_status: 'Good Survey' | 'Bad Survey' | 'Sold Survey' | null
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { survey_status }: StatusUpdateRequest = await request.json()

    // Validate survey status
    const validStatuses = ['Good Survey', 'Bad Survey', 'Sold Survey', null]
    if (!validStatuses.includes(survey_status)) {
      return NextResponse.json(
        { error: 'Invalid survey status' },
        { status: 400 }
      )
    }

    // Convert string ID to integer
    const leadId = parseInt(params.id, 10)

    if (isNaN(leadId)) {
      return NextResponse.json(
        { error: 'Invalid lead ID' },
        { status: 400 }
      )
    }

    // Update survey status using RPC function
    const { data, error } = await supabase.rpc('update_survey_status', {
      p_lead_id: leadId,
      p_survey_status: survey_status,
    } as never)

    if (error) {
      console.error('Error updating survey status:', {
        error,
        leadId,
        survey_status,
        userId: user.id,
      })

      // Check for specific error types
      if (error.message.includes('Invalid survey status')) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }

      if (error.message.includes('Lead not found')) {
        return NextResponse.json({ error: error.message }, { status: 404 })
      }

      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in PATCH /api/leads/[id]/status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
