-- ============================================================================
-- Fix permissions for calculate_dashboard_metrics function
-- ============================================================================
-- Grant necessary permissions to authenticated users to access solar schema tables

-- Grant SELECT permission on solar_leads table
-- This allows the authenticated role to read lead data
GRANT SELECT ON solar.solar_leads TO authenticated;

-- Grant SELECT permission on expenses table
-- This allows the authenticated role to read expense data for CPL calculations
GRANT SELECT ON solar.expenses TO authenticated;

-- Grant EXECUTE permission on the metrics function (if not already granted)
GRANT EXECUTE ON FUNCTION calculate_dashboard_metrics(TIMESTAMPTZ, TIMESTAMPTZ, TEXT, TEXT) TO authenticated;

-- Verify grants were applied successfully
DO $$
BEGIN
  RAISE NOTICE 'Permissions granted successfully to authenticated role';
  RAISE NOTICE 'Tables: solar.solar_leads, solar.expenses';
  RAISE NOTICE 'Function: calculate_dashboard_metrics';
END $$;
