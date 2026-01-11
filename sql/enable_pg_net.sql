-- ============================================================================
-- Migration: Enable pg_net extension for async HTTP requests
-- Date: 2026-01-10
-- Purpose: Enable Supabase pg_net extension for webhook functionality
-- ============================================================================

-- Enable the extension (already available in Supabase)
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Grant usage to postgres and authenticated users
GRANT USAGE ON SCHEMA extensions TO postgres, authenticated;

-- Verification
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pg_net'
  ) THEN
    RAISE NOTICE 'SUCCESS: pg_net extension enabled';
  ELSE
    RAISE EXCEPTION 'FAILURE: pg_net extension not found';
  END IF;
END $$;
