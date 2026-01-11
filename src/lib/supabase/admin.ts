/**
 * Supabase Admin Client
 * Use this ONLY for admin operations that require service role permissions
 *
 * WARNING: This client bypasses Row Level Security (RLS) policies
 * Only use in API routes that verify admin permissions first
 */

import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

/**
 * Creates an admin client with service role key
 * This client can:
 * - Use admin.inviteUserByEmail()
 * - Bypass RLS policies
 * - Perform any database operation
 *
 * SECURITY: Always verify user is admin before using this client!
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error(
      'Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY'
    )
  }

  return createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
