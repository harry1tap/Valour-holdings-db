-- ============================================================================
-- Migration: Add Contact_ID column to solar.solar_leads
-- Date: 2026-01-10
-- Purpose: Track external Contact_ID for CRM integration (backend only)
-- ============================================================================

-- Add the Contact_ID column
ALTER TABLE solar.solar_leads
ADD COLUMN IF NOT EXISTS "Contact_ID" TEXT NULL;

-- Add index for efficient lookups (for future queries)
CREATE INDEX IF NOT EXISTS idx_solar_leads_contact_id
ON solar.solar_leads("Contact_ID")
WHERE "Contact_ID" IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN solar.solar_leads."Contact_ID" IS
  'External CRM Contact ID - not displayed in dashboard';

-- Verification query
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'solar'
    AND table_name = 'solar_leads'
    AND column_name = 'Contact_ID'
  ) THEN
    RAISE NOTICE 'SUCCESS: Contact_ID column added to solar.solar_leads';
  ELSE
    RAISE EXCEPTION 'FAILURE: Contact_ID column not found';
  END IF;
END $$;
