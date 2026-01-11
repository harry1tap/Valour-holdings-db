-- ============================================================================
-- Update calculate_dashboard_metrics function to include CPL split
-- ============================================================================
-- This adds 4 new columns for expense tracking and split CPL calculation:
-- - total_online_expenses
-- - total_field_expenses
-- - cost_per_lead_online
-- - cost_per_lead_field
-- ============================================================================

-- Drop existing function first (required when changing return type)
DROP FUNCTION IF EXISTS calculate_dashboard_metrics(timestamp with time zone, timestamp with time zone, text, text);

CREATE OR REPLACE FUNCTION calculate_dashboard_metrics(
  p_date_from TIMESTAMPTZ,
  p_date_to TIMESTAMPTZ,
  p_account_manager TEXT DEFAULT NULL,
  p_field_rep TEXT DEFAULT NULL
)
RETURNS TABLE (
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
  -- NEW: CPL split columns
  total_online_expenses NUMERIC,
  total_field_expenses NUMERIC,
  cost_per_lead_online NUMERIC,
  cost_per_lead_field NUMERIC
) AS $$
DECLARE
  v_total_leads BIGINT;
  v_online_expenses NUMERIC;
  v_field_expenses NUMERIC;
BEGIN
  -- Get total leads count for the period (with role-based filtering)
  SELECT COUNT(*)::BIGINT INTO v_total_leads
  FROM solar.solar_leads
  WHERE "Created_At" >= p_date_from
    AND "Created_At" <= p_date_to
    AND (p_account_manager IS NULL OR "Account_Manager" = p_account_manager)
    AND (p_field_rep IS NULL OR "Field_Rep" = p_field_rep);

  -- Get total online expenses for the period (NOT filtered by role)
  SELECT COALESCE(SUM(online_amount), 0) INTO v_online_expenses
  FROM solar.expenses
  WHERE expense_date >= p_date_from::DATE
    AND expense_date <= p_date_to::DATE;

  -- Get total field expenses for the period (NOT filtered by role)
  SELECT COALESCE(SUM(field_amount), 0) INTO v_field_expenses
  FROM solar.expenses
  WHERE expense_date >= p_date_from::DATE
    AND expense_date <= p_date_to::DATE;

  -- Return all metrics including new CPL split fields
  RETURN QUERY
  SELECT
    v_total_leads as total_leads,
    COUNT("Survey_Booked_Date")::BIGINT as surveys_booked,
    COUNT(CASE WHEN "Survey_Status" = 'Pending' THEN 1 END)::BIGINT as pending_surveys,
    COUNT(CASE WHEN "Survey_Status" = 'Good Survey' THEN 1 END)::BIGINT as good_surveys,
    COUNT(CASE WHEN "Survey_Status" = 'Bad Survey' THEN 1 END)::BIGINT as bad_surveys,
    COUNT(CASE WHEN "Survey_Status" = 'Sold Survey' THEN 1 END)::BIGINT as sold_surveys,
    ROUND(
      (COUNT("Survey_Booked_Date")::NUMERIC / NULLIF(v_total_leads, 0) * 100),
      2
    ) as conversion_leads_to_surveys,
    ROUND(
      (COUNT(CASE WHEN "Survey_Status" = 'Sold Survey' THEN 1 END)::NUMERIC / NULLIF(v_total_leads, 0) * 100),
      2
    ) as conversion_leads_to_sold,
    SUM("Lead_Cost") as total_lead_cost,
    ROUND(
      (SUM("Lead_Cost") / NULLIF(v_total_leads, 0)),
      2
    ) as cost_per_lead,
    -- NEW: CPL split metrics
    v_online_expenses as total_online_expenses,
    v_field_expenses as total_field_expenses,
    ROUND(
      (v_online_expenses / NULLIF(v_total_leads, 0)),
      2
    ) as cost_per_lead_online,
    ROUND(
      (v_field_expenses / NULLIF(v_total_leads, 0)),
      2
    ) as cost_per_lead_field
  FROM solar.solar_leads
  WHERE "Created_At" >= p_date_from
    AND "Created_At" <= p_date_to
    AND (p_account_manager IS NULL OR "Account_Manager" = p_account_manager)
    AND (p_field_rep IS NULL OR "Field_Rep" = p_field_rep);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION calculate_dashboard_metrics TO authenticated;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'calculate_dashboard_metrics function updated successfully with CPL split!';
  RAISE NOTICE 'New columns added:';
  RAISE NOTICE '  - total_online_expenses';
  RAISE NOTICE '  - total_field_expenses';
  RAISE NOTICE '  - cost_per_lead_online';
  RAISE NOTICE '  - cost_per_lead_field';
END $$;
