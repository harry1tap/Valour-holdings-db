/**
 * API Route: Expenses
 * Handles expense insertion from n8n workflow or UI
 * POST /api/expenses - Create new expense
 * GET /api/expenses - Retrieve expenses (optional, for future UI)
 */

import { createServerClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    console.log('API /expenses - Request:', body)

    // Create server client
    const supabase = await createServerClient()

    // Check for API key authentication (for n8n)
    const apiKey = request.headers.get('x-api-key')
    const expectedApiKey = process.env.N8N_API_KEY

    // If API key is provided, verify it (for n8n automation)
    if (apiKey) {
      if (!expectedApiKey || apiKey !== expectedApiKey) {
        console.error('API /expenses - Invalid API key')
        return NextResponse.json(
          { error: 'Invalid API key' },
          { status: 401 }
        )
      }
      console.log('API /expenses - Authenticated via API key')
    } else {
      // Otherwise, verify user is authenticated (for UI)
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError || !user) {
        console.error('API /expenses - Auth error:', authError)
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      // Check user role (only admins can create expenses via UI)
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profileError || !profile) {
        console.error('API /expenses - Profile error:', profileError)
        return NextResponse.json(
          { error: 'Profile not found' },
          { status: 404 }
        )
      }

      if (profile.role !== 'admin') {
        return NextResponse.json(
          { error: 'Insufficient permissions to create expenses' },
          { status: 403 }
        )
      }

      console.log('API /expenses - Authenticated via user session')
    }

    // Validate required fields
    const requiredFields = [
      'expense_date',
      'category',
      'description',
      'total_amount',
      'online_amount',
      'field_amount',
    ]

    for (const field of requiredFields) {
      if (body[field] === undefined || body[field] === null) {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 }
        )
      }
    }

    // Validate amounts
    const total = parseFloat(body.total_amount)
    const online = parseFloat(body.online_amount)
    const field = parseFloat(body.field_amount)

    if (isNaN(total) || isNaN(online) || isNaN(field)) {
      return NextResponse.json(
        { error: 'Invalid amount values' },
        { status: 400 }
      )
    }

    if (total < 0 || online < 0 || field < 0) {
      return NextResponse.json(
        { error: 'Amounts cannot be negative' },
        { status: 400 }
      )
    }

    // Validate that online + field = total (with small tolerance for floating point)
    if (Math.abs(online + field - total) > 0.01) {
      return NextResponse.json(
        { error: 'online_amount + field_amount must equal total_amount' },
        { status: 400 }
      )
    }

    // Insert expense using RPC function
    const { data, error } = await supabase.rpc('insert_expense', {
      p_expense_data: body,
    } as never)

    if (error) {
      console.error('API /expenses - RPC error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('API /expenses - Success')

    return NextResponse.json({ data }, { status: 201 })
  } catch (err) {
    console.error('API /expenses - Unexpected error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET endpoint to retrieve expenses (optional, for future UI)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    // Verify user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get query parameters for filtering
    const searchParams = request.nextUrl.searchParams
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const category = searchParams.get('category')

    // Call get_expenses RPC function
    const { data, error } = await supabase.rpc('get_expenses', {
      p_date_from: dateFrom || null,
      p_date_to: dateTo || null,
      p_category: category || null,
    } as never)

    if (error) {
      console.error('API /expenses GET - Error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (err) {
    console.error('API /expenses GET - Unexpected error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
