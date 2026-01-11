-- ============================================================================
-- Migration 003: Create Missing RPC Functions
-- ============================================================================
-- Purpose: Create 2 new RPC functions that were referenced but not implemented
-- Date: 2026-01-10
-- ============================================================================

-- ============================================================================
-- Drop existing functions if they exist (handles signature changes)
-- ============================================================================

-- Drop old get_staff_performance (3 parameter version from docs)
DROP FUNCTION IF EXISTS get_staff_performance(TIMESTAMPTZ, TIMESTAMPTZ, TEXT);

-- Drop new get_staff_performance (5 parameter version) if partially created
DROP FUNCTION IF EXISTS get_staff_performance(TIMESTAMPTZ, TIMESTAMPTZ, TEXT, TEXT, TEXT);

-- Drop get_metrics_trend - try all possible type variations
DROP FUNCTION IF EXISTS get_metrics_trend(timestamp with time zone, timestamp with time zone, text, text, text, text);
DROP FUNCTION IF EXISTS get_metrics_trend(timestamptz, timestamptz, text, text, text, text);
DROP FUNCTION IF EXISTS get_metrics_trend(timestamp with time zone, timestamp with time zone, text);
DROP FUNCTION IF EXISTS get_metrics_trend(timestamptz, timestamptz, text);

-- Nuclear option: Drop all versions of get_metrics_trend regardless of signature
DO $$
DECLARE
    func_record RECORD;
BEGIN
    FOR func_record IN
        SELECT oid::regprocedure AS func_signature
        FROM pg_proc
        WHERE proname = 'get_metrics_trend'
    LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS ' || func_record.func_signature;
        RAISE NOTICE 'Dropped function: %', func_record.func_signature;
    END LOOP;
END $$;

-- ============================================================================
-- FUNCTION 1: get_staff_performance
-- Server-side role enforcement for staff performance metrics
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
  RETURN QUERY
  EXECUTE format(
    'SELECT
      "Field_Rep" as staff_name,
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
      AND "Field_Rep" IS NOT NULL %s
    GROUP BY "Field_Rep"
    ORDER BY sold_surveys DESC',
    p_date_from,
    p_date_to,
    v_where_clause
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_staff_performance TO authenticated;

COMMENT ON FUNCTION get_staff_performance IS 'Get field rep performance metrics with role-based filtering. Installers cannot view. Field reps see only their own data. Account managers see their team. Admin sees all.';

-- ============================================================================
-- FUNCTION 2: get_metrics_trend
-- Time-series metrics with role-based filtering
-- ============================================================================

CREATE OR REPLACE FUNCTION get_metrics_trend(
  p_date_from TIMESTAMPTZ,
  p_date_to TIMESTAMPTZ,
  p_user_role TEXT DEFAULT 'admin',
  p_user_name TEXT DEFAULT NULL,
  p_organization TEXT DEFAULT NULL,
  p_interval TEXT DEFAULT 'day'
)
RETURNS TABLE (
  date TEXT,
  value BIGINT
) AS $$
DECLARE
  v_where_clause TEXT := '';
  v_date_trunc_format TEXT;
BEGIN
  -- Validate interval
  IF p_interval NOT IN ('day', 'week', 'month') THEN
    RAISE EXCEPTION 'Invalid interval. Must be: day, week, or month';
  END IF;

  v_date_trunc_format := p_interval;

  -- Build role-based WHERE clause
  IF p_user_role = 'field_rep' AND p_user_name IS NOT NULL THEN
    v_where_clause := format(' AND "Field_Rep" = %L', p_user_name);
  ELSIF p_user_role = 'account_manager' AND p_user_name IS NOT NULL THEN
    v_where_clause := format(' AND "Account_Manager" = %L', p_user_name);
  ELSIF p_user_role = 'installer' AND p_organization IS NOT NULL THEN
    v_where_clause := format(' AND "Installer" = %L', p_organization);
  END IF;
  -- Admin sees all (no filter)

  -- Return time-series data
  RETURN QUERY
  EXECUTE format(
    'SELECT
      TO_CHAR(DATE_TRUNC(%L, "Created_At"), ''YYYY-MM-DD'') as date,
      COUNT(*)::BIGINT as value
    FROM solar.solar_leads
    WHERE "Created_At" >= %L
      AND "Created_At" <= %L %s
    GROUP BY DATE_TRUNC(%L, "Created_At")
    ORDER BY DATE_TRUNC(%L, "Created_At")',
    v_date_trunc_format,
    p_date_from,
    p_date_to,
    v_where_clause,
    v_date_trunc_format,
    v_date_trunc_format
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_metrics_trend TO authenticated;

COMMENT ON FUNCTION get_metrics_trend IS 'Get time-series lead trend data with role-based filtering. Supports day/week/month intervals.';

-- ============================================================================
-- Verification and Success Message
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'Migration 003 completed successfully';
  RAISE NOTICE 'Created 2 new RPC functions with role-based access control:';
  RAISE NOTICE '  1. get_staff_performance - Staff metrics (installer blocked)';
  RAISE NOTICE '  2. get_metrics_trend - Time-series data';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'All SQL migrations complete!';
  RAISE NOTICE 'Next: Update TypeScript types and API routes';
  RAISE NOTICE '============================================================================';
END $$;
