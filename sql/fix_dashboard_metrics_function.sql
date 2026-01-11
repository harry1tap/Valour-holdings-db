-- ============================================================================
-- FIX: Consolidate calculate_dashboard_metrics function
-- ============================================================================
-- Issue: Multiple conflicting versions causing "structure does not match" error
-- Solution: Drop all possible versions, then create the unified one
-- ============================================================================

-- Drop ALL possible versions with explicit signatures
-- Version 1: 5 parameters (Migration 002)
DROP FUNCTION IF EXISTS public.calculate_dashboard_metrics(DATE, DATE, TEXT, TEXT, TEXT);

-- Version 2: 4 parameters (from update scripts)
DROP FUNCTION IF EXISTS public.calculate_dashboard_metrics(DATE, DATE, TEXT, TEXT);

-- Version 3: Try with lowercase 'date' type
DROP FUNCTION IF EXISTS public.calculate_dashboard_metrics(date, date, text, text, text);
DROP FUNCTION IF EXISTS public.calculate_dashboard_metrics(date, date, text, text);

-- Create unified version with correct signature and all columns
CREATE OR REPLACE FUNCTION public.calculate_dashboard_metrics(
  p_date_from DATE,
  p_date_to DATE,
  p_user_role TEXT,
  p_user_name TEXT,
  p_organization TEXT
)
RETURNS TABLE(
  total_leads BIGINT,
  surveys_booked BIGINT,
  pending_surveys BIGINT,
  good_surveys BIGINT,
  bad_surveys BIGINT,
  sold_surveys BIGINT,
  conversion_leads_to_surveys NUMERIC,
  conversion_leads_to_sold NUMERIC,
  total_lead_cost NUMERIC,
  cost_per_lead NUMERIC,
  total_online_expenses NUMERIC,
  total_field_expenses NUMERIC,
  cost_per_lead_online NUMERIC,
  cost_per_lead_field NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_where_clause TEXT := '';
BEGIN
  -- Role-based filtering
  IF p_user_role = 'field_rep' AND p_user_name IS NOT NULL THEN
    v_where_clause := format(' AND "Field_Rep" = %L', p_user_name);
  ELSIF p_user_role = 'account_manager' AND p_user_name IS NOT NULL THEN
    v_where_clause := format(' AND "Account_Manager" = %L', p_user_name);
  ELSIF p_user_role = 'installer' AND p_organization IS NOT NULL THEN
    v_where_clause := format(' AND "Installer" = %L', p_organization);
  END IF;

  RETURN QUERY EXECUTE format('
    WITH lead_metrics AS (
      SELECT
        COUNT(*) as total_leads,
        COUNT(*) FILTER (WHERE "Status" IN (''Survey Booked'', ''Survey Complete'', ''Install Complete'')) as surveys_booked,
        COUNT(*) FILTER (WHERE "Survey_Status" = ''Pending'' OR ("Status" IN (''Survey Booked'', ''Survey Complete'') AND "Survey_Status" IS NULL)) as pending_surveys,
        COUNT(*) FILTER (WHERE "Survey_Status" = ''Good Survey'') as good_surveys,
        COUNT(*) FILTER (WHERE "Survey_Status" = ''Bad Survey'') as bad_surveys,
        COUNT(*) FILTER (WHERE "Survey_Status" = ''Sold Survey'') as sold_surveys,
        COALESCE(SUM("Lead_Cost"), 0) as total_lead_cost
      FROM solar.solar_leads
      WHERE "Created_At"::date BETWEEN $1 AND $2 %s
    ),
    expense_metrics AS (
      SELECT
        COALESCE(SUM(amount) FILTER (WHERE category = ''online''), 0) as total_online_expenses,
        COALESCE(SUM(amount) FILTER (WHERE category = ''field''), 0) as total_field_expenses
      FROM solar.expenses
      WHERE date BETWEEN $1 AND $2
    )
    SELECT
      lm.total_leads::BIGINT,
      lm.surveys_booked::BIGINT,
      lm.pending_surveys::BIGINT,
      lm.good_surveys::BIGINT,
      lm.bad_surveys::BIGINT,
      lm.sold_surveys::BIGINT,
      CASE
        WHEN lm.total_leads > 0
        THEN ROUND((lm.surveys_booked::numeric / lm.total_leads::numeric * 100), 2)
        ELSE 0
      END as conversion_leads_to_surveys,
      CASE
        WHEN lm.total_leads > 0
        THEN ROUND((lm.sold_surveys::numeric / lm.total_leads::numeric * 100), 2)
        ELSE 0
      END as conversion_leads_to_sold,
      ROUND(lm.total_lead_cost, 2) as total_lead_cost,
      CASE
        WHEN lm.total_leads > 0
        THEN ROUND(lm.total_lead_cost / lm.total_leads, 2)
        ELSE 0
      END as cost_per_lead,
      ROUND(em.total_online_expenses, 2) as total_online_expenses,
      ROUND(em.total_field_expenses, 2) as total_field_expenses,
      CASE
        WHEN lm.total_leads > 0
        THEN ROUND(em.total_online_expenses / lm.total_leads, 2)
        ELSE 0
      END as cost_per_lead_online,
      CASE
        WHEN lm.total_leads > 0
        THEN ROUND(em.total_field_expenses / lm.total_leads, 2)
        ELSE 0
      END as cost_per_lead_field
    FROM lead_metrics lm
    CROSS JOIN expense_metrics em
  ', v_where_clause)
  USING p_date_from, p_date_to;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.calculate_dashboard_metrics TO authenticated;

-- Verify the fix
DO $$
BEGIN
  RAISE NOTICE '============================================================================';
  RAISE NOTICE '✓ calculate_dashboard_metrics function fixed';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'Parameters: p_date_from, p_date_to, p_user_role, p_user_name, p_organization';
  RAISE NOTICE 'Returns: 14 columns including CPL split and pending surveys';
  RAISE NOTICE '';
  RAISE NOTICE 'Columns returned:';
  RAISE NOTICE '  1. total_leads';
  RAISE NOTICE '  2. surveys_booked';
  RAISE NOTICE '  3. pending_surveys';
  RAISE NOTICE '  4. good_surveys';
  RAISE NOTICE '  5. bad_surveys';
  RAISE NOTICE '  6. sold_surveys';
  RAISE NOTICE '  7. conversion_leads_to_surveys';
  RAISE NOTICE '  8. conversion_leads_to_sold';
  RAISE NOTICE '  9. total_lead_cost';
  RAISE NOTICE ' 10. cost_per_lead';
  RAISE NOTICE ' 11. total_online_expenses';
  RAISE NOTICE ' 12. total_field_expenses';
  RAISE NOTICE ' 13. cost_per_lead_online';
  RAISE NOTICE ' 14. cost_per_lead_field';
  RAISE NOTICE '============================================================================';
END $$;
