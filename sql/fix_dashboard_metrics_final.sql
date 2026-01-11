-- ============================================================================
-- FIX: Drop both versions of calculate_dashboard_metrics with exact signatures
-- ============================================================================

-- Drop version 1: date parameters (OID 20799)
DROP FUNCTION IF EXISTS public.calculate_dashboard_metrics(
  p_date_from date,
  p_date_to date,
  p_user_role text,
  p_user_name text,
  p_organization text
);

-- Drop version 2: timestamp with time zone parameters with defaults (OID 20752)
DROP FUNCTION IF EXISTS public.calculate_dashboard_metrics(
  p_date_from timestamp with time zone,
  p_date_to timestamp with time zone,
  p_user_role text,
  p_user_name text,
  p_organization text
);

-- Now create the unified version with DATE parameters (matches API call)
CREATE FUNCTION public.calculate_dashboard_metrics(
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
        COUNT(*) FILTER (WHERE "Survey_Booked_Date" IS NOT NULL) as surveys_booked,
        COUNT(*) FILTER (WHERE "Survey_Status" = ''Pending'') as pending_surveys,
        COUNT(*) FILTER (WHERE "Survey_Status" = ''Good Survey'') as good_surveys,
        COUNT(*) FILTER (WHERE "Survey_Status" = ''Bad Survey'') as bad_surveys,
        COUNT(*) FILTER (WHERE "Survey_Status" = ''Sold Survey'') as sold_surveys,
        COALESCE(SUM("Lead_Cost"), 0) as total_lead_cost
      FROM solar.solar_leads
      WHERE "Created_At"::date BETWEEN $1 AND $2 %s
    ),
    expense_metrics AS (
      SELECT
        COALESCE(SUM(online_amount), 0) as total_online_expenses,
        COALESCE(SUM(field_amount), 0) as total_field_expenses
      FROM solar.expenses
      WHERE expense_date BETWEEN $1 AND $2
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
GRANT EXECUTE ON FUNCTION public.calculate_dashboard_metrics(DATE, DATE, TEXT, TEXT, TEXT) TO authenticated;

-- Verify the fix
DO $$
BEGIN
  RAISE NOTICE '============================================================================';
  RAISE NOTICE '✓ calculate_dashboard_metrics function fixed';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'Dropped 2 conflicting versions:';
  RAISE NOTICE '  1. Version with date parameters (OID 20799)';
  RAISE NOTICE '  2. Version with timestamp parameters (OID 20752)';
  RAISE NOTICE '';
  RAISE NOTICE 'Created unified version:';
  RAISE NOTICE '  Parameters: DATE, DATE, TEXT, TEXT, TEXT';
  RAISE NOTICE '  Returns: 14 columns including CPL split and pending surveys';
  RAISE NOTICE '============================================================================';
END $$;
