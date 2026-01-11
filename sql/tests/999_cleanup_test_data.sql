-- ============================================================================
-- Cleanup Test Data Script for RBAC Security Tests
-- ============================================================================
-- Purpose: Remove all test users and leads created by 000_setup_test_data.sql
-- Run this after completing security tests to clean up test data
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'Cleaning up RBAC test data...';
  RAISE NOTICE '============================================================================';
END $$;

-- ============================================================================
-- Count records before deletion
-- ============================================================================

DO $$
DECLARE
  v_user_count INTEGER;
  v_lead_count INTEGER;
BEGIN
  -- Count test users
  SELECT COUNT(*) INTO v_user_count
  FROM public.user_profiles
  WHERE email LIKE '%test-rbac%';

  -- Count test leads
  SELECT COUNT(*) INTO v_lead_count
  FROM solar.solar_leads
  WHERE id IN (1, 2, 3, 4, 5);

  RAISE NOTICE '';
  RAISE NOTICE 'Found % test users to delete', v_user_count;
  RAISE NOTICE 'Found % test leads to delete', v_lead_count;
  RAISE NOTICE '';
END $$;

-- ============================================================================
-- Delete Test Leads
-- ============================================================================

DELETE FROM solar.solar_leads
WHERE id IN (1, 2, 3, 4, 5);

-- ============================================================================
-- Delete Test Users
-- ============================================================================

DELETE FROM public.user_profiles
WHERE email LIKE '%test-rbac%';

-- ============================================================================
-- Verification
-- ============================================================================

DO $$
DECLARE
  v_remaining_users INTEGER;
  v_remaining_leads INTEGER;
BEGIN
  -- Count remaining test users
  SELECT COUNT(*) INTO v_remaining_users
  FROM public.user_profiles
  WHERE email LIKE '%test-rbac%';

  -- Count remaining test leads
  SELECT COUNT(*) INTO v_remaining_leads
  FROM solar.solar_leads
  WHERE id IN (1, 2, 3, 4, 5);

  IF v_remaining_users = 0 AND v_remaining_leads = 0 THEN
    RAISE NOTICE '============================================================================';
    RAISE NOTICE '✓ Cleanup Complete!';
    RAISE NOTICE '============================================================================';
    RAISE NOTICE 'All test data has been successfully removed';
    RAISE NOTICE '  - 0 test users remaining';
    RAISE NOTICE '  - 0 test leads remaining';
    RAISE NOTICE '============================================================================';
  ELSE
    RAISE WARNING '============================================================================';
    RAISE WARNING '⚠ Cleanup Incomplete!';
    RAISE WARNING '============================================================================';
    RAISE WARNING '% test users still remain', v_remaining_users;
    RAISE WARNING '% test leads still remain', v_remaining_leads;
    RAISE WARNING '';
    RAISE WARNING 'This may indicate:';
    RAISE WARNING '  1. Foreign key constraints preventing deletion';
    RAISE WARNING '  2. Additional test data was created outside the test suite';
    RAISE WARNING '  3. Permissions issue';
    RAISE WARNING '============================================================================';
  END IF;
END $$;

-- ============================================================================
-- Re-enable Foreign Key Constraint (Optional)
-- ============================================================================
-- Note: This will only succeed if all remaining user_profiles.id values
-- exist in auth.users. Since we're deleting test users, this should work.
-- If it fails, the constraint remains dropped (acceptable for test env).
-- ============================================================================

DO $$
BEGIN
  -- Attempt to re-enable FK constraint
  ALTER TABLE public.user_profiles
  ADD CONSTRAINT user_profiles_id_fkey
    FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

  RAISE NOTICE '';
  RAISE NOTICE '✓ Foreign key constraint user_profiles_id_fkey re-enabled';
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING '';
    RAISE WARNING '⚠ Could not re-enable user_profiles_id_fkey constraint';
    RAISE WARNING 'This may be because other non-test profiles have invalid IDs';
    RAISE WARNING 'To manually re-enable, run:';
    RAISE WARNING 'ALTER TABLE public.user_profiles ADD CONSTRAINT user_profiles_id_fkey';
    RAISE WARNING 'FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;';
END $$;
