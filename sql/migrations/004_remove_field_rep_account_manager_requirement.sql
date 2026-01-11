-- ============================================================================
-- Migration 004: Remove Field Rep Account Manager Requirement & Fix Team Performance
-- ============================================================================
-- Purpose:
-- 1. Remove the requirement for field reps to have an account manager assigned
-- 2. Fix Team Performance totals to include unassigned leads
-- Date: 2026-01-11
-- ============================================================================

-- ============================================================================
-- PART 1: Drop the database constraint requiring account_manager_name for field reps
-- ============================================================================

ALTER TABLE public.user_profiles
DROP CONSTRAINT IF EXISTS field_rep_requires_am;

-- Add comment to document the change
COMMENT ON COLUMN public.user_profiles.account_manager_name IS 'Optional account manager assignment. Previously required for field_reps, now optional for all roles. Field rep filtering is done by matching full_name to Field_Rep column in solar_leads.';

-- ============================================================================
-- PART 2: Update get_staff_performance function to include unassigned leads
-- ============================================================================

CREATE OR REPLACE FUNCTION get_staff_performance(
  p_date_from TIMESTAMPTZ,
  p_date_to TIMESTAMPTZ,
  p_user_role TEXT DEFAULT 'admin',
  p_user_name TEXT DEFAULT NULL,
  p_account_manager TEXT DEFAULT NULL
)
RETURNS TABLE (
  staff_name TEXT,
  total_leads BIGINT,
  good_surveys BIGINT,
  bad_surveys BIGINT,
  sold_surveys BIGINT,
  conversion_rate NUMERIC
) AS $$
DECLARE
  v_where_clause TEXT := '';
BEGIN
  -- Role-based filtering
  -- Installers cannot view staff performance
  IF p_user_role = 'installer' THEN
    RAISE EXCEPTION 'Installers cannot view staff performance';
  END IF;

  -- Field reps can only see their own performance
  IF p_user_role = 'field_rep' AND p_user_name IS NOT NULL THEN
    v_where_clause := format(' AND "Field_Rep" = %L', p_user_name);
  END IF;

  -- Account managers can only see their team's performance
  IF p_user_role = 'account_manager' AND p_user_name IS NOT NULL THEN
    v_where_clause := format(' AND "Account_Manager" = %L', p_user_name);
  END IF;

  -- Optional filter by account manager (for admin viewing specific team)
  IF p_account_manager IS NOT NULL THEN
    v_where_clause := v_where_clause || format(' AND "Account_Manager" = %L', p_account_manager);
  END IF;

  -- Return field rep performance
  -- CHANGED: Removed "AND Field_Rep IS NOT NULL" filter
  -- CHANGED: Use COALESCE to show NULL field reps as "Unassigned"
  RETURN QUERY
  EXECUTE format(
    'SELECT
      COALESCE("Field_Rep", ''Unassigned'') as staff_name,
      COUNT(*)::BIGINT as total_leads,
      COUNT(CASE WHEN "Survey_Status" = ''Good Survey'' THEN 1 END)::BIGINT as good_surveys,
      COUNT(CASE WHEN "Survey_Status" = ''Bad Survey'' THEN 1 END)::BIGINT as bad_surveys,
      COUNT(CASE WHEN "Survey_Status" = ''Sold Survey'' THEN 1 END)::BIGINT as sold_surveys,
      ROUND(
        (COUNT(CASE WHEN "Survey_Status" = ''Sold Survey'' THEN 1 END)::NUMERIC / NULLIF(COUNT(*), 0) * 100),
        2
      ) as conversion_rate
    FROM solar.solar_leads
    WHERE "Created_At" >= %L
      AND "Created_At" <= %L
      %s
    GROUP BY "Field_Rep"
    ORDER BY sold_surveys DESC',
    p_date_from,
    p_date_to,
    v_where_clause
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- No need to re-grant - function signature unchanged
COMMENT ON FUNCTION get_staff_performance IS 'Get field rep performance metrics with role-based filtering. Now includes unassigned leads as "Unassigned" row. Installers cannot view. Field reps see only their own data. Account managers see their team. Admin sees all.';

-- ============================================================================
-- Verification Query (run manually to test)
-- ============================================================================

-- Check if constraint was dropped
-- SELECT conname, contype, pg_get_constraintdef(oid)
-- FROM pg_constraint
-- WHERE conrelid = 'public.user_profiles'::regclass
--   AND conname = 'field_rep_requires_am';
-- Expected: 0 rows (constraint should not exist)

-- Test the updated function
-- SELECT * FROM get_staff_performance(
--   '2025-01-01'::TIMESTAMPTZ,
--   '2025-01-31'::TIMESTAMPTZ,
--   'admin',
--   NULL,
--   NULL
-- );
-- Expected: Should now include "Unassigned" row if there are leads without Field_Rep
