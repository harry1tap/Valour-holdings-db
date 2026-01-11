-- ============================================================================
-- Migration: Attach trigger to solar.solar_leads table
-- Date: 2026-01-10
-- Purpose: Attach status change webhook trigger to solar_leads table
-- ============================================================================

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_status_webhook ON solar.solar_leads;

-- Create the trigger
CREATE TRIGGER trigger_status_webhook
  AFTER UPDATE ON solar.solar_leads
  FOR EACH ROW
  EXECUTE FUNCTION notify_status_change_solar();

-- Verification
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'trigger_status_webhook'
  ) THEN
    RAISE NOTICE 'SUCCESS: trigger_status_webhook created and attached to solar.solar_leads';
  ELSE
    RAISE EXCEPTION 'FAILURE: Trigger not found';
  END IF;
END $$;

-- Display trigger info
DO $$
DECLARE
  v_trigger_def TEXT;
BEGIN
  SELECT pg_get_triggerdef(oid)
  INTO v_trigger_def
  FROM pg_trigger
  WHERE tgname = 'trigger_status_webhook';

  RAISE NOTICE 'Trigger definition: %', v_trigger_def;
END $$;
