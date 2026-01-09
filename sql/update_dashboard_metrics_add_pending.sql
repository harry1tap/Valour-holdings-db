-- ============================================================================
-- Update calculate_dashboard_metrics function to include pending_surveys
-- ============================================================================

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
  cost_per_lead NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_leads,
    COUNT("Survey_Booked_Date")::BIGINT as surveys_booked,
    COUNT(CASE WHEN "Survey_Booked_Date" IS NOT NULL AND "Survey_Status" IS NULL THEN 1 END)::BIGINT as pending_surveys,
    COUNT(CASE WHEN "Survey_Status" = 'Good Survey' THEN 1 END)::BIGINT as good_surveys,
    COUNT(CASE WHEN "Survey_Status" = 'Bad Survey' THEN 1 END)::BIGINT as bad_surveys,
    COUNT(CASE WHEN "Survey_Status" = 'Sold Survey' THEN 1 END)::BIGINT as sold_surveys,
    ROUND(
      (COUNT("Survey_Booked_Date")::NUMERIC / NULLIF(COUNT(*), 0) * 100),
      2
    ) as conversion_leads_to_surveys,
    ROUND(
      (COUNT(CASE WHEN "Survey_Status" = 'Sold Survey' THEN 1 END)::NUMERIC / NULLIF(COUNT(*), 0) * 100),
      2
    ) as conversion_leads_to_sold,
    SUM("Lead_Cost") as total_lead_cost,
    ROUND(
      (SUM("Lead_Cost") / NULLIF(COUNT(*), 0)),
      2
    ) as cost_per_lead
  FROM solar.solar_leads
  WHERE "Created_At" >= p_date_from
    AND "Created_At" <= p_date_to
    AND (p_account_manager IS NULL OR "Account_Manager" = p_account_manager)
    AND (p_field_rep IS NULL OR "Field_Rep" = p_field_rep);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION calculate_dashboard_metrics TO authenticated;
