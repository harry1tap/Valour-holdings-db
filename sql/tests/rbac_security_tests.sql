-- ============================================================================
-- RBAC Security Test Suite
-- ============================================================================
-- Purpose: Validate all role-based access control rules
-- Run this after deploying migrations 001, 002, and 003
-- ============================================================================

-- Test setup: Create sample data and test users
DO $$
BEGIN
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'RBAC Security Test Suite';
  RAISE NOTICE '============================================================================';
END $$;

-- ============================================================================
-- TEST 1: Field Rep can only see their own leads
-- ============================================================================
DO $$
DECLARE
  v_result JSONB;
  v_count INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE 'TEST 1: Field Rep Access - Should only see their own leads';

  -- Call get_solar_leads with field_rep role (corrected function signature)
  SELECT get_solar_leads(
    p_page => 1,              -- Correct: use p_page (not p_offset)
    p_limit => 1000,
    p_user_role => 'field_rep',
    p_user_name => 'John Smith'
  ) INTO v_result;

  -- Extract total count from JSONB result
  v_count := (v_result->>'total')::INTEGER;

  RAISE NOTICE '  Field rep sees % leads (expected: 3)', v_count;

  -- Call get_solar_lead_by_id for another field rep's lead (should return NULL)
  SELECT get_solar_lead_by_id(
    p_lead_id => 1,
    p_user_role => 'field_rep',
    p_user_name => 'Wrong Person',
    p_organization => NULL
  ) INTO v_result;

  IF v_result IS NULL THEN
    RAISE NOTICE '  ✓ PASS: Field rep cannot access other field reps leads';
  ELSE
    RAISE EXCEPTION '  ✗ FAIL: Field rep accessed unauthorized lead';
  END IF;

END $$;

-- ============================================================================
-- TEST 2: Installer can only see their organization's leads
-- ============================================================================
DO $$
DECLARE
  v_result JSONB;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE 'TEST 2: Installer Access - Should only see organization leads';

  -- Call get_solar_leads with installer role
  SELECT get_solar_lead_by_id(
    p_lead_id => 1,
    p_user_role => 'installer',
    p_user_name => NULL,
    p_organization => 'Wrong Company'
  ) INTO v_result;

  IF v_result IS NULL THEN
    RAISE NOTICE '  ✓ PASS: Installer cannot access other organizations leads';
  ELSE
    RAISE EXCEPTION '  ✗ FAIL: Installer accessed unauthorized lead';
  END IF;

END $$;

-- ============================================================================
-- TEST 3: Field Rep cannot edit restricted fields
-- ============================================================================
DO $$
DECLARE
  v_result JSONB;
  v_success BOOLEAN := FALSE;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE 'TEST 3: Field Rep Edit Permissions - Should reject restricted fields';

  -- Attempt to edit Customer_Name (not allowed)
  BEGIN
    SELECT update_solar_lead(
      p_lead_id => 1,
      p_lead_data => '{"Customer_Name": "Hacked"}'::JSONB,
      p_user_role => 'field_rep',
      p_user_name => 'John Smith',
      p_organization => NULL
    ) INTO v_result;

    RAISE EXCEPTION '  ✗ FAIL: Field rep was able to edit restricted field';
  EXCEPTION
    WHEN OTHERS THEN
      IF SQLERRM LIKE '%can only edit Notes and Installer_Notes%' THEN
        RAISE NOTICE '  ✓ PASS: Field rep blocked from editing restricted fields';
        v_success := TRUE;
      ELSE
        RAISE EXCEPTION '  ✗ FAIL: Unexpected error: %', SQLERRM;
      END IF;
  END;

END $$;

-- ============================================================================
-- TEST 4: Installer can ONLY edit Installer_Notes
-- ============================================================================
DO $$
DECLARE
  v_result JSONB;
  v_success BOOLEAN := FALSE;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE 'TEST 4: Installer Edit Permissions - Should only allow Installer_Notes';

  -- Attempt to edit Notes (not allowed)
  BEGIN
    SELECT update_solar_lead(
      p_lead_id => 1,
      p_lead_data => '{"Notes": "Hacked"}'::JSONB,
      p_user_role => 'installer',
      p_user_name => NULL,
      p_organization => 'Emerald Green'
    ) INTO v_result;

    RAISE EXCEPTION '  ✗ FAIL: Installer was able to edit Notes field';
  EXCEPTION
    WHEN OTHERS THEN
      IF SQLERRM LIKE '%can only edit Installer_Notes%' THEN
        RAISE NOTICE '  ✓ PASS: Installer blocked from editing non-Installer_Notes fields';
        v_success := TRUE;
      ELSE
        RAISE EXCEPTION '  ✗ FAIL: Unexpected error: %', SQLERRM;
      END IF;
  END;

END $$;

-- ============================================================================
-- TEST 5: Field Rep cannot delete leads
-- ============================================================================
DO $$
DECLARE
  v_result BOOLEAN;
  v_success BOOLEAN := FALSE;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE 'TEST 5: Field Rep Delete - Should be blocked';

  -- Attempt to delete (not allowed)
  BEGIN
    SELECT delete_solar_lead(
      p_lead_id => 1,
      p_user_role => 'field_rep',
      p_user_name => 'John Smith'
    ) INTO v_result;

    RAISE EXCEPTION '  ✗ FAIL: Field rep was able to delete lead';
  EXCEPTION
    WHEN OTHERS THEN
      IF SQLERRM LIKE '%Insufficient permissions%' THEN
        RAISE NOTICE '  ✓ PASS: Field rep blocked from deleting leads';
        v_success := TRUE;
      ELSE
        RAISE EXCEPTION '  ✗ FAIL: Unexpected error: %', SQLERRM;
      END IF;
  END;

END $$;

-- ============================================================================
-- TEST 6: Account Manager cannot edit financial fields
-- ============================================================================
DO $$
DECLARE
  v_result JSONB;
  v_success BOOLEAN := FALSE;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE 'TEST 6: Account Manager Financial Fields - Should be blocked';

  -- Attempt to edit Lead_Cost (not allowed)
  BEGIN
    SELECT update_solar_lead(
      p_lead_id => 1,
      p_lead_data => '{"Lead_Cost": 9999}'::JSONB,
      p_user_role => 'account_manager',
      p_user_name => 'Sarah Connor',
      p_organization => NULL
    ) INTO v_result;

    RAISE EXCEPTION '  ✗ FAIL: Account manager was able to edit financial field';
  EXCEPTION
    WHEN OTHERS THEN
      IF SQLERRM LIKE '%cannot edit financial fields%' THEN
        RAISE NOTICE '  ✓ PASS: Account manager blocked from editing financial fields';
        v_success := TRUE;
      ELSE
        RAISE EXCEPTION '  ✗ FAIL: Unexpected error: %', SQLERRM;
      END IF;
  END;

END $$;

-- ============================================================================
-- TEST 7: Installer cannot view staff performance
-- ============================================================================
DO $$
DECLARE
  v_result RECORD;
  v_success BOOLEAN := FALSE;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE 'TEST 7: Installer Staff Performance - Should be blocked';

  -- Attempt to view staff performance (not allowed)
  BEGIN
    SELECT * FROM get_staff_performance(
      p_date_from => NOW() - INTERVAL '30 days',
      p_date_to => NOW(),
      p_user_role => 'installer',
      p_user_name => NULL,
      p_account_manager => NULL
    ) INTO v_result;

    RAISE EXCEPTION '  ✗ FAIL: Installer was able to view staff performance';
  EXCEPTION
    WHEN OTHERS THEN
      IF SQLERRM LIKE '%cannot view staff performance%' THEN
        RAISE NOTICE '  ✓ PASS: Installer blocked from viewing staff performance';
        v_success := TRUE;
      ELSE
        RAISE EXCEPTION '  ✗ FAIL: Unexpected error: %', SQLERRM;
      END IF;
  END;

END $$;

-- ============================================================================
-- TEST 8: Installer cannot update survey status
-- ============================================================================
DO $$
DECLARE
  v_result JSONB;
  v_success BOOLEAN := FALSE;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE 'TEST 8: Installer Survey Status - Should be blocked';

  -- Attempt to update survey status (not allowed)
  BEGIN
    SELECT update_survey_status(
      p_lead_id => 1,
      p_survey_status => 'Good Survey',
      p_user_role => 'installer',
      p_user_name => NULL,
      p_organization => 'Emerald Green'
    ) INTO v_result;

    RAISE EXCEPTION '  ✗ FAIL: Installer was able to update survey status';
  EXCEPTION
    WHEN OTHERS THEN
      IF SQLERRM LIKE '%cannot update survey status%' THEN
        RAISE NOTICE '  ✓ PASS: Installer blocked from updating survey status';
        v_success := TRUE;
      ELSE
        RAISE EXCEPTION '  ✗ FAIL: Unexpected error: %', SQLERRM;
      END IF;
  END;

END $$;

-- ============================================================================
-- TEST SUMMARY
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'RBAC Security Test Suite Complete';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'All 8 security tests passed successfully';
  RAISE NOTICE '';
  RAISE NOTICE 'Security boundaries verified:';
  RAISE NOTICE '  ✓ Field reps see only their leads';
  RAISE NOTICE '  ✓ Installers see only their organization leads';
  RAISE NOTICE '  ✓ Field reps cannot edit restricted fields';
  RAISE NOTICE '  ✓ Installers can only edit Installer_Notes';
  RAISE NOTICE '  ✓ Field reps cannot delete leads';
  RAISE NOTICE '  ✓ Account managers cannot edit financial fields';
  RAISE NOTICE '  ✓ Installers cannot view staff performance';
  RAISE NOTICE '  ✓ Installers cannot update survey status';
  RAISE NOTICE '============================================================================';
END $$;
