/**
 * Supabase Browser Client
 * Use this in Client Components (components with 'use client')
 *
 * This client:
 * - Runs in the browser
 * - Uses NEXT_PUBLIC_ environment variables (safe to expose)
 * - Manages session via cookies automatically
 */

import { createBrowserClient as createClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

export function createBrowserClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
