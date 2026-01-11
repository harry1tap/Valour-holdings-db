/**
 * Migration: Convert NULL Survey_Status to 'Pending' where survey is booked
 *
 * Purpose:
 * - This migration updates existing surveys that have a booked date but no status
 * - Changes Survey_Status from NULL to 'Pending' (explicit status value)
 * - Ensures consistent data model after implementing 'Pending' as a real status
 *
 * When to run:
 * - Run AFTER updating application code to support 'Pending' status
 * - Run BEFORE updating metrics calculations to use 'Pending' instead of NULL
 *
 * This script is idempotent (safe to run multiple times)
 */

-- Migration: Convert NULL Survey_Status to 'Pending' where survey is booked
UPDATE solar.solar_leads
SET "Survey_Status" = 'Pending'
WHERE "Survey_Booked_Date" IS NOT NULL
  AND "Survey_Status" IS NULL;

-- Log how many rows were updated
DO $$
DECLARE
  updated_count INT;
BEGIN
  -- Get the number of rows that were updated
  GET DIAGNOSTICS updated_count = ROW_COUNT;

  -- Log the result
  RAISE NOTICE 'Migration complete: Updated % surveys from NULL to Pending status', updated_count;

  -- Show current counts for verification
  RAISE NOTICE 'Current Pending surveys: %', (
    SELECT COUNT(*)
    FROM solar.solar_leads
    WHERE "Survey_Status" = 'Pending'
  );

  RAISE NOTICE 'Remaining NULL survey statuses with booked dates: %', (
    SELECT COUNT(*)
    FROM solar.solar_leads
    WHERE "Survey_Booked_Date" IS NOT NULL
      AND "Survey_Status" IS NULL
  );
END $$;
