/**
 * RPC Functions for Leads Management
 *
 * These functions provide CRUD operations for the solar.solar_leads table
 * with role-based access control, filtering, pagination, and sorting.
 *
 * Run this in Supabase SQL Editor to create all functions at once.
 */

-- ============================================================================
-- Function 1: get_solar_leads
-- Fetches paginated leads list with filters and role-based access
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_solar_leads(
  p_page INTEGER DEFAULT 1,
  p_limit INTEGER DEFAULT 25,
  p_sort_by TEXT DEFAULT 'Created_At',
  p_sort_order TEXT DEFAULT 'desc',
  p_search TEXT DEFAULT NULL,
  p_status TEXT DEFAULT NULL,
  p_survey_status TEXT DEFAULT NULL,
  p_account_manager TEXT DEFAULT NULL,
  p_field_rep TEXT DEFAULT NULL,
  p_date_from TIMESTAMPTZ DEFAULT NULL,
  p_date_to TIMESTAMPTZ DEFAULT NULL,
  p_postcode TEXT DEFAULT NULL,
  p_user_role TEXT DEFAULT 'admin',
  p_user_name TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_offset INTEGER;
  v_total INTEGER;
  v_data JSONB;
  v_where_clauses TEXT[] := ARRAY[]::TEXT[];
  v_query TEXT;
  v_count_query TEXT;
BEGIN
  -- Calculate offset for pagination
  v_offset := (p_page - 1) * p_limit;

  -- Build WHERE clauses based on filters

  -- Role-based access control
  IF p_user_role = 'field_rep' AND p_user_name IS NOT NULL THEN
    v_where_clauses := array_append(v_where_clauses, format('sl."Field_Rep" = %L', p_user_name));
  ELSIF p_user_role = 'account_manager' AND p_user_name IS NOT NULL THEN
    v_where_clauses := array_append(v_where_clauses, format('sl."Account_Manager" = %L', p_user_name));
  END IF;
  -- Admin sees all (no filter)

  -- Search filter (across multiple fields)
  IF p_search IS NOT NULL THEN
    v_where_clauses := array_append(v_where_clauses, format(
      '(sl."Customer_Name" ILIKE %L OR sl."Customer_Email" ILIKE %L OR sl."Customer_Tel" ILIKE %L OR sl."Postcode" ILIKE %L)',
      '%' || p_search || '%',
      '%' || p_search || '%',
      '%' || p_search || '%',
      '%' || p_search || '%'
    ));
  END IF;

  -- Status filter
  IF p_status IS NOT NULL THEN
    v_where_clauses := array_append(v_where_clauses, format('sl."Status" = %L', p_status));
  END IF;

  -- Survey Status filter
  IF p_survey_status IS NOT NULL THEN
    v_where_clauses := array_append(v_where_clauses, format('sl."Survey_Status" = %L', p_survey_status));
  END IF;

  -- Account Manager filter
  IF p_account_manager IS NOT NULL THEN
    v_where_clauses := array_append(v_where_clauses, format('sl."Account_Manager" = %L', p_account_manager));
  END IF;

  -- Field Rep filter
  IF p_field_rep IS NOT NULL THEN
    v_where_clauses := array_append(v_where_clauses, format('sl."Field_Rep" = %L', p_field_rep));
  END IF;

  -- Date From filter
  IF p_date_from IS NOT NULL THEN
    v_where_clauses := array_append(v_where_clauses, format('sl."Created_At" >= %L', p_date_from));
  END IF;

  -- Date To filter
  IF p_date_to IS NOT NULL THEN
    v_where_clauses := array_append(v_where_clauses, format('sl."Created_At" <= %L', p_date_to));
  END IF;

  -- Postcode filter
  IF p_postcode IS NOT NULL THEN
    v_where_clauses := array_append(v_where_clauses, format('sl."Postcode" ILIKE %L', '%' || p_postcode || '%'));
  END IF;

  -- Build complete WHERE clause
  IF array_length(v_where_clauses, 1) > 0 THEN
    v_where_clauses := ARRAY['WHERE ' || array_to_string(v_where_clauses, ' AND ')];
  ELSE
    v_where_clauses := ARRAY[]::TEXT[];
  END IF;

  -- Count total matching rows
  v_count_query := format(
    'SELECT COUNT(*) FROM solar.solar_leads sl %s',
    array_to_string(v_where_clauses, ' ')
  );
  EXECUTE v_count_query INTO v_total;

  -- Build main query with sorting and pagination
  v_query := format(
    'SELECT jsonb_agg(to_jsonb(sl.*)) FROM (
      SELECT * FROM solar.solar_leads sl
      %s
      ORDER BY sl."%s" %s
      LIMIT %s OFFSET %s
    ) sl',
    array_to_string(v_where_clauses, ' '),
    p_sort_by,
    UPPER(p_sort_order),
    p_limit,
    v_offset
  );

  -- Execute query and get results
  EXECUTE v_query INTO v_data;

  -- Return combined result as JSONB
  RETURN jsonb_build_object(
    'data', COALESCE(v_data, '[]'::jsonb),
    'total', v_total
  );
END;
$$;

-- ============================================================================
-- Function 2: get_solar_lead_by_id
-- Fetches a single lead by ID
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_solar_lead_by_id(p_lead_id INTEGER)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT to_jsonb(sl.*)
  INTO v_result
  FROM solar.solar_leads sl
  WHERE sl.id = p_lead_id;

  RETURN v_result;
END;
$$;

-- ============================================================================
-- Function 3: create_solar_lead
-- Creates a new lead record
-- ============================================================================

CREATE OR REPLACE FUNCTION public.create_solar_lead(p_lead_data JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
BEGIN
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
    COALESCE((p_lead_data->>'Status')::TEXT, 'New'),
    (p_lead_data->>'Payment_Model')::TEXT,
    (p_lead_data->>'Lead_Cost')::NUMERIC,
    (p_lead_data->>'Notes')::TEXT
  )
  RETURNING to_jsonb(solar.solar_leads.*) INTO v_result;

  RETURN v_result;
END;
$$;

-- ============================================================================
-- Function 4: update_solar_lead
-- Updates an existing lead record
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_solar_lead(
  p_lead_id INTEGER,
  p_lead_data JSONB
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
BEGIN
  -- Build UPDATE SET clauses dynamically for provided fields
  FOR v_column, v_value IN SELECT * FROM jsonb_each_text(p_lead_data)
  LOOP
    -- Skip id field
    IF v_column = 'id' THEN
      CONTINUE;
    END IF;

    -- Add to updates array with proper quoting for case-sensitive column names
    v_updates := array_append(v_updates, format('"%s" = %L', v_column, v_value));
  END LOOP;

  -- Build and execute update query
  IF array_length(v_updates, 1) > 0 THEN
    v_query := format(
      'UPDATE solar.solar_leads SET %s WHERE id = %s RETURNING to_jsonb(solar.solar_leads.*)',
      array_to_string(v_updates, ', '),
      p_lead_id
    );

    EXECUTE v_query INTO v_result;
  ELSE
    -- No fields to update, just return the existing record
    SELECT to_jsonb(sl.*)
    INTO v_result
    FROM solar.solar_leads sl
    WHERE sl.id = p_lead_id;
  END IF;

  RETURN v_result;
END;
$$;

-- ============================================================================
-- Function 5: delete_solar_lead
-- Deletes a lead record by ID
-- ============================================================================

CREATE OR REPLACE FUNCTION public.delete_solar_lead(p_lead_id INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM solar.solar_leads
  WHERE id = p_lead_id;

  -- Return true if a row was deleted
  RETURN FOUND;
END;
$$;

-- ============================================================================
-- Function 6: update_survey_status
-- Update the survey status for a lead
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_survey_status(
  p_lead_id INTEGER,
  p_survey_status TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- Validate survey status
  IF p_survey_status IS NOT NULL
     AND p_survey_status NOT IN ('Pending', 'Good Survey', 'Bad Survey', 'Sold Survey') THEN
    RAISE EXCEPTION 'Invalid survey status: %', p_survey_status;
  END IF;

  -- Update the survey status
  UPDATE solar.solar_leads
  SET
    Survey_Status = p_survey_status,
    Survey_Complete_Date = CASE
      WHEN p_survey_status IS NOT NULL THEN COALESCE(Survey_Complete_Date, NOW())
      ELSE Survey_Complete_Date
    END
  WHERE id = p_lead_id
  RETURNING jsonb_build_object(
    'id', id,
    'Survey_Status', Survey_Status,
    'Survey_Complete_Date', Survey_Complete_Date
  )
  INTO v_result;

  -- Check if lead was found
  IF v_result IS NULL THEN
    RAISE EXCEPTION 'Lead not found with id: %', p_lead_id;
  END IF;

  RETURN v_result;
END;
$$;

-- ============================================================================
-- Grant execute permissions on all functions
-- ============================================================================

GRANT EXECUTE ON FUNCTION public.get_solar_leads TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_solar_lead_by_id TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_solar_lead TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_solar_lead TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.delete_solar_lead TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_survey_status TO anon, authenticated;

-- ============================================================================
-- Success message
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'All RPC functions for leads management created successfully!';
  RAISE NOTICE 'Functions created:';
  RAISE NOTICE '  1. public.get_solar_leads()';
  RAISE NOTICE '  2. public.get_solar_lead_by_id()';
  RAISE NOTICE '  3. public.create_solar_lead()';
  RAISE NOTICE '  4. public.update_solar_lead()';
  RAISE NOTICE '  5. public.delete_solar_lead()';
  RAISE NOTICE '  6. public.update_survey_status()';
END $$;
