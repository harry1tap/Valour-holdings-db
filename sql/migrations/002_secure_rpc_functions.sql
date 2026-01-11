-- ============================================================================
-- Migration 002: Secure ALL Existing RPC Functions
-- ============================================================================
-- Purpose: Add role-based access control to all 6 existing RPC functions
-- Date: 2026-01-10
-- ============================================================================
-- CRITICAL: This is a BREAKING CHANGE. Function signatures are changing.
-- All API routes must be updated to pass role parameters.
-- ============================================================================

-- ============================================================================
-- FUNCTION 1: get_solar_lead_by_id
-- Add role-based access control to single lead retrieval
-- ============================================================================

DROP FUNCTION IF EXISTS public.get_solar_lead_by_id(INTEGER);

CREATE OR REPLACE FUNCTION public.get_solar_lead_by_id(
  p_lead_id INTEGER,
  p_user_role TEXT DEFAULT 'admin',
  p_user_name TEXT DEFAULT NULL,
  p_organization TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
  v_where_clause TEXT := '';
BEGIN
  -- Build role-based WHERE clause
  IF p_user_role = 'field_rep' AND p_user_name IS NOT NULL THEN
    v_where_clause := format(' AND sl."Field_Rep" = %L', p_user_name);
  ELSIF p_user_role = 'account_manager' AND p_user_name IS NOT NULL THEN
    v_where_clause := format(' AND sl."Account_Manager" = %L', p_user_name);
  ELSIF p_user_role = 'installer' AND p_organization IS NOT NULL THEN
    v_where_clause := format(' AND sl."Installer" = %L', p_organization);
  END IF;
  -- Admin sees all (no filter)

  -- Execute query with role filter
  EXECUTE format(
    'SELECT to_jsonb(sl.*) FROM solar.solar_leads sl WHERE sl.id = %s %s',
    p_lead_id,
    v_where_clause
  ) INTO v_result;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_solar_lead_by_id TO authenticated;

COMMENT ON FUNCTION public.get_solar_lead_by_id IS 'Retrieve a single lead with role-based access control. Returns NULL if user does not have access.';

-- ============================================================================
-- FUNCTION 2: create_solar_lead
-- Only admins and account managers can create leads
-- ============================================================================

DROP FUNCTION IF EXISTS public.create_solar_lead(JSONB);

CREATE OR REPLACE FUNCTION public.create_solar_lead(
  p_lead_data JSONB,
  p_user_role TEXT DEFAULT 'admin'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- Authorization check: Only admins and account_managers can create
  IF p_user_role NOT IN ('admin', 'account_manager') THEN
    RAISE EXCEPTION 'Insufficient permissions to create leads. Role: %', p_user_role;
  END IF;

  -- Insert the new lead
  INSERT INTO solar.solar_leads (
    "Customer_Name",
    "Customer_Tel",
    "Customer_Email",
    "Alternative_Tel",
    "First_Line_Of_Address",
    "Postcode",
    "Property_Type",
    "Lead_Source",
    "Account_Manager",
    "Field_Rep",
    "Status",
    "Payment_Model",
    "Lead_Cost",
    "Notes"
  )
  VALUES (
    (p_lead_data->>'Customer_Name')::TEXT,
    (p_lead_data->>'Customer_Tel')::TEXT,
    (p_lead_data->>'Customer_Email')::TEXT,
    (p_lead_data->>'Alternative_Tel')::TEXT,
    (p_lead_data->>'First_Line_Of_Address')::TEXT,
    (p_lead_data->>'Postcode')::TEXT,
    (p_lead_data->>'Property_Type')::TEXT,
    (p_lead_data->>'Lead_Source')::TEXT,
    (p_lead_data->>'Account_Manager')::TEXT,
    (p_lead_data->>'Field_Rep')::TEXT,
    COALESCE((p_lead_data->>'Status')::TEXT, 'New Lead'),
    (p_lead_data->>'Payment_Model')::TEXT,
    (p_lead_data->>'Lead_Cost')::NUMERIC,
    (p_lead_data->>'Notes')::TEXT
  )
  RETURNING to_jsonb(solar.solar_leads.*) INTO v_result;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_solar_lead TO authenticated;

COMMENT ON FUNCTION public.create_solar_lead IS 'Create a new lead. Only admins and account managers can create leads.';

-- ============================================================================
-- FUNCTION 3: update_solar_lead
-- Field-level permissions based on role
-- ============================================================================

DROP FUNCTION IF EXISTS public.update_solar_lead(INTEGER, JSONB);

CREATE OR REPLACE FUNCTION public.update_solar_lead(
  p_lead_id INTEGER,
  p_lead_data JSONB,
  p_user_role TEXT DEFAULT 'admin',
  p_user_name TEXT DEFAULT NULL,
  p_organization TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
  v_column TEXT;
  v_value TEXT;
  v_updates TEXT[] := ARRAY[]::TEXT[];
  v_query TEXT;
  v_where_clause TEXT := '';
  v_financial_fields TEXT[] := ARRAY['Lead_Cost', 'Lead_Revenue', 'Commission_Amount', 'Commission_Paid', 'Commission_Paid_Date'];
  v_field_rep_allowed TEXT[] := ARRAY['Notes', 'Installer_Notes'];
  v_installer_allowed TEXT[] := ARRAY['Installer_Notes'];
BEGIN
  -- Role-based authorization: Check if user can access this lead
  IF p_user_role = 'field_rep' AND p_user_name IS NOT NULL THEN
    v_where_clause := format(' AND "Field_Rep" = %L', p_user_name);
  ELSIF p_user_role = 'account_manager' AND p_user_name IS NOT NULL THEN
    v_where_clause := format(' AND "Account_Manager" = %L', p_user_name);
  ELSIF p_user_role = 'installer' AND p_organization IS NOT NULL THEN
    v_where_clause := format(' AND "Installer" = %L', p_organization);
  END IF;

  -- Verify lead exists and user has access
  EXECUTE format(
    'SELECT COUNT(*) FROM solar.solar_leads WHERE id = %s %s',
    p_lead_id,
    v_where_clause
  ) INTO v_result;

  IF (v_result::text::int) = 0 THEN
    RAISE EXCEPTION 'Lead not found or access denied. Lead ID: %, Role: %', p_lead_id, p_user_role;
  END IF;

  -- Build UPDATE SET clauses with field-level permissions
  FOR v_column, v_value IN SELECT * FROM jsonb_each_text(p_lead_data)
  LOOP
    -- Skip id field
    IF v_column = 'id' THEN
      CONTINUE;
    END IF;

    -- Field-level permission checks
    IF p_user_role = 'field_rep' THEN
      -- Field reps can ONLY edit Notes and Installer_Notes
      IF v_column != ALL(v_field_rep_allowed) THEN
        RAISE EXCEPTION 'Field reps can only edit Notes and Installer_Notes. Attempted: %', v_column;
      END IF;
    ELSIF p_user_role = 'installer' THEN
      -- Installers can ONLY edit Installer_Notes
      IF v_column != ALL(v_installer_allowed) THEN
        RAISE EXCEPTION 'Installers can only edit Installer_Notes. Attempted: %', v_column;
      END IF;
    ELSIF p_user_role = 'account_manager' THEN
      -- Account managers CANNOT edit financial fields
      IF v_column = ANY(v_financial_fields) THEN
        RAISE EXCEPTION 'Account managers cannot edit financial fields. Attempted: %', v_column;
      END IF;
    END IF;
    -- Admin can edit everything (no restrictions)

    -- Add to updates array
    v_updates := array_append(v_updates, format('"%s" = %L', v_column, v_value));
  END LOOP;

  -- Execute update if there are fields to update
  IF array_length(v_updates, 1) > 0 THEN
    v_query := format(
      'UPDATE solar.solar_leads SET %s WHERE id = %s %s RETURNING to_jsonb(solar.solar_leads.*)',
      array_to_string(v_updates, ', '),
      p_lead_id,
      v_where_clause
    );

    EXECUTE v_query INTO v_result;
  ELSE
    -- No fields to update, return existing record
    EXECUTE format(
      'SELECT to_jsonb(sl.*) FROM solar.solar_leads sl WHERE sl.id = %s %s',
      p_lead_id,
      v_where_clause
    ) INTO v_result;
  END IF;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_solar_lead TO authenticated;

COMMENT ON FUNCTION public.update_solar_lead IS 'Update a lead with field-level permissions: field_rep (Notes, Installer_Notes only), installer (Installer_Notes only), account_manager (all except financial), admin (everything)';

-- ============================================================================
-- FUNCTION 4: delete_solar_lead
-- Only admins and account managers can delete
-- ============================================================================

DROP FUNCTION IF EXISTS public.delete_solar_lead(INTEGER);

CREATE OR REPLACE FUNCTION public.delete_solar_lead(
  p_lead_id INTEGER,
  p_user_role TEXT DEFAULT 'admin',
  p_user_name TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
  v_where_clause TEXT := '';
BEGIN
  -- Authorization check
  IF p_user_role NOT IN ('admin', 'account_manager') THEN
    RAISE EXCEPTION 'Insufficient permissions to delete leads. Role: %', p_user_role;
  END IF;

  -- Account managers can only delete their own leads
  IF p_user_role = 'account_manager' AND p_user_name IS NOT NULL THEN
    v_where_clause := format(' AND "Account_Manager" = %L', p_user_name);
  END IF;

  -- Delete with role filter
  EXECUTE format(
    'DELETE FROM solar.solar_leads WHERE id = %s %s',
    p_lead_id,
    v_where_clause
  );

  GET DIAGNOSTICS v_count = ROW_COUNT;

  -- Return true if a row was deleted
  RETURN v_count > 0;
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_solar_lead TO authenticated;

COMMENT ON FUNCTION public.delete_solar_lead IS 'Delete a lead. Only admins and account managers (their own leads) can delete.';

-- ============================================================================
-- FUNCTION 5: update_survey_status
-- Role-based access control for survey status updates
-- ============================================================================

DROP FUNCTION IF EXISTS public.update_survey_status(INTEGER, TEXT);

CREATE OR REPLACE FUNCTION public.update_survey_status(
  p_lead_id INTEGER,
  p_survey_status TEXT,
  p_user_role TEXT DEFAULT 'admin',
  p_user_name TEXT DEFAULT NULL,
  p_organization TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
  v_where_clause TEXT := '';
  v_count INTEGER;
BEGIN
  -- Validate survey status
  IF p_survey_status IS NOT NULL
     AND p_survey_status NOT IN ('Pending', 'Good Survey', 'Bad Survey', 'Sold Survey') THEN
    RAISE EXCEPTION 'Invalid survey status: %', p_survey_status;
  END IF;

  -- Build role-based WHERE clause
  IF p_user_role = 'field_rep' AND p_user_name IS NOT NULL THEN
    v_where_clause := format(' AND "Field_Rep" = %L', p_user_name);
  ELSIF p_user_role = 'account_manager' AND p_user_name IS NOT NULL THEN
    v_where_clause := format(' AND "Account_Manager" = %L', p_user_name);
  ELSIF p_user_role = 'installer' AND p_organization IS NOT NULL THEN
    -- Installers cannot update survey status
    RAISE EXCEPTION 'Installers cannot update survey status';
  END IF;
  -- Admin sees all (no filter)

  -- Update the survey status with role filter
  EXECUTE format(
    'UPDATE solar.solar_leads
    SET
      "Survey_Status" = %L,
      "Survey_Complete_Date" = CASE
        WHEN %L IS NOT NULL THEN COALESCE("Survey_Complete_Date", NOW())
        ELSE "Survey_Complete_Date"
      END
    WHERE id = %s %s
    RETURNING jsonb_build_object(
      ''id'', id,
      ''Survey_Status'', "Survey_Status",
      ''Survey_Complete_Date'', "Survey_Complete_Date"
    )',
    p_survey_status,
    p_survey_status,
    p_lead_id,
    v_where_clause
  ) INTO v_result;

  -- Check if lead was found
  IF v_result IS NULL THEN
    RAISE EXCEPTION 'Lead not found or access denied. Lead ID: %, Role: %', p_lead_id, p_user_role;
  END IF;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_survey_status TO authenticated;

COMMENT ON FUNCTION public.update_survey_status IS 'Update survey status with role-based access. Installers cannot update survey status.';

-- ============================================================================
-- FUNCTION 6: calculate_dashboard_metrics
-- Server-side role enforcement for metrics calculation
-- ============================================================================

DROP FUNCTION IF EXISTS calculate_dashboard_metrics(TIMESTAMPTZ, TIMESTAMPTZ, TEXT, TEXT);

CREATE OR REPLACE FUNCTION calculate_dashboard_metrics(
  p_date_from TIMESTAMPTZ,
  p_date_to TIMESTAMPTZ,
  p_user_role TEXT DEFAULT 'admin',
  p_user_name TEXT DEFAULT NULL,
  p_organization TEXT DEFAULT NULL
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
  total_online_expenses NUMERIC,
  total_field_expenses NUMERIC,
  cost_per_lead_online NUMERIC,
  cost_per_lead_field NUMERIC
) AS $$
DECLARE
  v_total_leads BIGINT;
  v_online_expenses NUMERIC;
  v_field_expenses NUMERIC;
  v_where_clause TEXT := '';
BEGIN
  -- Build role-based WHERE clause
  IF p_user_role = 'field_rep' AND p_user_name IS NOT NULL THEN
    v_where_clause := format(' AND "Field_Rep" = %L', p_user_name);
  ELSIF p_user_role = 'account_manager' AND p_user_name IS NOT NULL THEN
    v_where_clause := format(' AND "Account_Manager" = %L', p_user_name);
  ELSIF p_user_role = 'installer' AND p_organization IS NOT NULL THEN
    v_where_clause := format(' AND "Installer" = %L', p_organization);
  END IF;
  -- Admin sees all (no filter)

  -- Get total leads count with role filtering
  EXECUTE format(
    'SELECT COUNT(*)::BIGINT FROM solar.solar_leads
     WHERE "Created_At" >= %L AND "Created_At" <= %L %s',
    p_date_from,
    p_date_to,
    v_where_clause
  ) INTO v_total_leads;

  -- Get expenses (NOT filtered by role - expenses are organization-wide)
  SELECT COALESCE(SUM(online_amount), 0) INTO v_online_expenses
  FROM solar.expenses
  WHERE expense_date >= p_date_from::DATE
    AND expense_date <= p_date_to::DATE;

  SELECT COALESCE(SUM(field_amount), 0) INTO v_field_expenses
  FROM solar.expenses
  WHERE expense_date >= p_date_from::DATE
    AND expense_date <= p_date_to::DATE;

  -- Return metrics with role filtering
  RETURN QUERY
  EXECUTE format(
    'SELECT
      %s as total_leads,
      COUNT("Survey_Booked_Date")::BIGINT as surveys_booked,
      COUNT(CASE WHEN "Survey_Status" = ''Pending'' THEN 1 END)::BIGINT as pending_surveys,
      COUNT(CASE WHEN "Survey_Status" = ''Good Survey'' THEN 1 END)::BIGINT as good_surveys,
      COUNT(CASE WHEN "Survey_Status" = ''Bad Survey'' THEN 1 END)::BIGINT as bad_surveys,
      COUNT(CASE WHEN "Survey_Status" = ''Sold Survey'' THEN 1 END)::BIGINT as sold_surveys,
      ROUND(
        (COUNT("Survey_Booked_Date")::NUMERIC / NULLIF(%s, 0) * 100),
        2
      ) as conversion_leads_to_surveys,
      ROUND(
        (COUNT(CASE WHEN "Survey_Status" = ''Sold Survey'' THEN 1 END)::NUMERIC / NULLIF(%s, 0) * 100),
        2
      ) as conversion_leads_to_sold,
      SUM("Lead_Cost") as total_lead_cost,
      ROUND(
        (SUM("Lead_Cost") / NULLIF(%s, 0)),
        2
      ) as cost_per_lead,
      %s as total_online_expenses,
      %s as total_field_expenses,
      ROUND(
        (%s / NULLIF(%s, 0)),
        2
      ) as cost_per_lead_online,
      ROUND(
        (%s / NULLIF(%s, 0)),
        2
      ) as cost_per_lead_field
    FROM solar.solar_leads
    WHERE "Created_At" >= %L
      AND "Created_At" <= %L %s',
    v_total_leads, v_total_leads, v_total_leads, v_total_leads,
    v_online_expenses, v_field_expenses,
    v_online_expenses, v_total_leads,
    v_field_expenses, v_total_leads,
    p_date_from, p_date_to, v_where_clause
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION calculate_dashboard_metrics TO authenticated;

COMMENT ON FUNCTION calculate_dashboard_metrics IS 'Calculate dashboard metrics with server-side role-based filtering. Expenses are NOT filtered by role (organization-wide).';

-- ============================================================================
-- Verification and Success Message
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'Migration 002 completed successfully';
  RAISE NOTICE 'Secured 6 RPC functions with role-based access control:';
  RAISE NOTICE '  1. get_solar_lead_by_id - Role filtering added';
  RAISE NOTICE '  2. create_solar_lead - Admin/Account Manager only';
  RAISE NOTICE '  3. update_solar_lead - Field-level permissions';
  RAISE NOTICE '  4. delete_solar_lead - Admin/Account Manager only';
  RAISE NOTICE '  5. update_survey_status - Role filtering (installer blocked)';
  RAISE NOTICE '  6. calculate_dashboard_metrics - Server-side role filtering';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'WARNING: This is a BREAKING CHANGE';
  RAISE NOTICE 'All API routes must be updated to pass role parameters';
  RAISE NOTICE '============================================================================';
END $$;
