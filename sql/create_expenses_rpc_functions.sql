-- ============================================================================
-- RPC Functions for Expense Management
-- ============================================================================
-- These functions provide operations for the solar.expenses table
-- Run this in Supabase SQL Editor to create the functions
-- ============================================================================

-- ============================================================================
-- Function: insert_expense
-- Purpose: Insert a new expense record (called by n8n via API)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.insert_expense(p_expense_data JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- Validate required fields
  IF p_expense_data->>'expense_date' IS NULL THEN
    RAISE EXCEPTION 'expense_date is required';
  END IF;

  IF p_expense_data->>'category' IS NULL THEN
    RAISE EXCEPTION 'category is required';
  END IF;

  IF p_expense_data->>'description' IS NULL THEN
    RAISE EXCEPTION 'description is required';
  END IF;

  IF p_expense_data->>'total_amount' IS NULL THEN
    RAISE EXCEPTION 'total_amount is required';
  END IF;

  IF p_expense_data->>'online_amount' IS NULL THEN
    RAISE EXCEPTION 'online_amount is required';
  END IF;

  IF p_expense_data->>'field_amount' IS NULL THEN
    RAISE EXCEPTION 'field_amount is required';
  END IF;

  -- Insert the expense
  -- Note: description_embedding is optional and can be added via n8n workflow
  INSERT INTO solar.expenses (
    expense_date,
    category,
    description,
    total_amount,
    online_amount,
    field_amount,
    created_by,
    notes,
    description_embedding
  )
  VALUES (
    (p_expense_data->>'expense_date')::DATE,
    (p_expense_data->>'category')::TEXT,
    (p_expense_data->>'description')::TEXT,
    (p_expense_data->>'total_amount')::NUMERIC,
    (p_expense_data->>'online_amount')::NUMERIC,
    (p_expense_data->>'field_amount')::NUMERIC,
    COALESCE((p_expense_data->>'created_by')::TEXT, 'n8n'),
    (p_expense_data->>'notes')::TEXT,
    -- Parse embedding array from JSON if provided
    CASE
      WHEN p_expense_data->>'description_embedding' IS NOT NULL
      THEN (p_expense_data->>'description_embedding')::vector(1536)
      ELSE NULL
    END
  )
  RETURNING to_jsonb(solar.expenses.*) INTO v_result;

  RETURN v_result;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.insert_expense TO anon, authenticated;

-- ============================================================================
-- Function: get_expenses
-- Purpose: Retrieve expenses with filtering (optional, for future UI)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_expenses(
  p_date_from DATE DEFAULT NULL,
  p_date_to DATE DEFAULT NULL,
  p_category TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_agg(to_jsonb(e.*))
  INTO v_result
  FROM solar.expenses e
  WHERE
    (p_date_from IS NULL OR e.expense_date >= p_date_from)
    AND (p_date_to IS NULL OR e.expense_date <= p_date_to)
    AND (p_category IS NULL OR e.category = p_category)
  ORDER BY e.expense_date DESC, e.created_at DESC;

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_expenses TO authenticated;

-- ============================================================================
-- Success message
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Expense RPC functions created successfully!';
  RAISE NOTICE 'Functions created:';
  RAISE NOTICE '  1. public.insert_expense()';
  RAISE NOTICE '  2. public.get_expenses()';
END $$;
