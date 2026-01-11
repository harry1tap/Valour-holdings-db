-- ============================================================================
-- Test Data Setup Script for RBAC Security Tests
-- ============================================================================
-- Purpose: Create test users and leads for automated security testing
-- Run this BEFORE running rbac_security_tests.sql
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'Setting up RBAC test data...';
  RAISE NOTICE '============================================================================';
END $$;

-- ============================================================================
-- Clean up existing test data (idempotent)
-- ============================================================================

-- Delete test leads
DELETE FROM solar.solar_leads WHERE id IN (1, 2, 3, 4, 5);

-- Delete test users
DELETE FROM public.user_profiles WHERE email LIKE '%test-rbac%';

-- ============================================================================
-- Temporarily Disable Foreign Key Constraint for Test Data
-- ============================================================================
-- NOTE: user_profiles.id references auth.users(id), but we're using
-- controlled test UUIDs that don't exist in auth.users.
-- This is safe for test environments because:
-- 1. Test data is isolated and deterministic
-- 2. RBAC tests focus on RPC function logic, not auth integrity
-- 3. Production maintains the FK constraint
-- 4. Cleanup script removes all test data
-- ============================================================================

ALTER TABLE public.user_profiles
DROP CONSTRAINT IF EXISTS user_profiles_id_fkey;

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE 'Foreign key constraint disabled for test data setup';
  RAISE NOTICE 'Test users will use controlled UUIDs not present in auth.users';
  RAISE NOTICE '';
END $$;

-- ============================================================================
-- Create Test Users
-- ============================================================================

-- Explicitly specify all columns to ensure correct mapping
INSERT INTO public.user_profiles (
  id,
  email,
  full_name,
  role,
  account_manager_name,
  is_active,
  created_at,
  updated_at,
  created_by,
  organization
)
VALUES
  -- Admin user
  (
    '00000000-0000-0000-0000-000000000001',
    'admin-test-rbac@valour.com',
    'Admin Test User',
    'admin',
    NULL,          -- account_manager_name
    true,          -- is_active
    NOW(),         -- created_at
    NOW(),         -- updated_at
    NULL,          -- created_by
    NULL           -- organization
  ),
  -- Field rep: John Smith (managed by Sarah Connor)
  (
    '00000000-0000-0000-0000-000000000002',
    'john.smith-test-rbac@valour.com',
    'John Smith',
    'field_rep',
    'Sarah Connor',  -- account_manager_name (REQUIRED for field_rep)
    true,            -- is_active
    NOW(),           -- created_at
    NOW(),           -- updated_at
    NULL,            -- created_by
    NULL             -- organization
  ),
  -- Field rep: Jane Doe (managed by Other Manager)
  (
    '00000000-0000-0000-0000-000000000003',
    'jane.doe-test-rbac@valour.com',
    'Jane Doe',
    'field_rep',
    'Other Manager',  -- account_manager_name (REQUIRED for field_rep)
    true,             -- is_active
    NOW(),            -- created_at
    NOW(),            -- updated_at
    NULL,             -- created_by
    NULL              -- organization
  ),
  -- Account Manager: Sarah Connor
  (
    '00000000-0000-0000-0000-000000000004',
    'sarah.connor-test-rbac@valour.com',
    'Sarah Connor',
    'account_manager',
    NULL,          -- account_manager_name
    true,          -- is_active
    NOW(),         -- created_at
    NOW(),         -- updated_at
    NULL,          -- created_by
    NULL           -- organization
  ),
  -- Installer: Emerald Green
  (
    '00000000-0000-0000-0000-000000000005',
    'installer-test-rbac@valour.com',
    'Emerald Installer',
    'installer',
    NULL,             -- account_manager_name
    true,             -- is_active
    NOW(),            -- created_at
    NOW(),            -- updated_at
    NULL,             -- created_by
    'Emerald Green'   -- organization (REQUIRED for installer)
  ),
  -- Account Manager: Other Manager
  (
    '00000000-0000-0000-0000-000000000006',
    'other.manager-test-rbac@valour.com',
    'Other Manager',
    'account_manager',
    NULL,          -- account_manager_name
    true,          -- is_active
    NOW(),         -- created_at
    NOW(),         -- updated_at
    NULL,          -- created_by
    NULL           -- organization
  );

-- ============================================================================
-- Create Test Leads
-- ============================================================================

INSERT INTO solar.solar_leads (
  id,
  "Customer_Name",
  "Customer_Tel",
  "Customer_Email",
  "First_Line_Of_Address",
  "Postcode",
  "Field_Rep",
  "Account_Manager",
  "Installer",
  "Status",
  "Survey_Status",
  "Notes",
  "Installer_Notes",
  "Lead_Cost",
  "Lead_Revenue",
  "Commission_Amount",
  "Created_At",
  "Updated_At"
)
VALUES
  -- Lead 1: Assigned to John Smith, Emerald Green installer
  (
    1,
    'Test Customer 1',
    '1234567890',
    'test1@example.com',
    '123 Test Street',
    'SW1A 1AA',
    'John Smith',
    'Sarah Connor',
    'Emerald Green',
    'New Lead',
    NULL,
    'Test notes for lead 1',
    'Installer notes for lead 1',
    100.00,
    5000.00,
    250.00,
    NOW(),
    NOW()
  ),
  -- Lead 2: Assigned to Jane Doe, Solar Solutions installer
  (
    2,
    'Test Customer 2',
    '0987654321',
    'test2@example.com',
    '456 Demo Avenue',
    'E1 6AN',
    'Jane Doe',
    'Sarah Connor',
    'Solar Solutions',
    'Survey Booked',
    'Good Survey',
    'Test notes for lead 2',
    'Installer notes for lead 2',
    150.00,
    6000.00,
    300.00,
    NOW(),
    NOW()
  ),
  -- Lead 3: Assigned to John Smith, Emerald Green installer
  (
    3,
    'Test Customer 3',
    '5555555555',
    'test3@example.com',
    '789 Sample Road',
    'N1 9AA',
    'John Smith',
    'Sarah Connor',
    'Emerald Green',
    'Survey Complete',
    'Sold Survey',
    'Test notes for lead 3',
    'Installer notes for lead 3',
    120.00,
    7000.00,
    350.00,
    NOW(),
    NOW()
  ),
  -- Lead 4: Assigned to Jane Doe, different account manager
  (
    4,
    'Test Customer 4',
    '4444444444',
    'test4@example.com',
    '321 Example Lane',
    'W1A 0AX',
    'Jane Doe',
    'Other Manager',
    'Solar Solutions',
    'New Lead',
    NULL,
    'Test notes for lead 4',
    'Installer notes for lead 4',
    200.00,
    8000.00,
    400.00,
    NOW(),
    NOW()
  ),
  -- Lead 5: Assigned to John Smith, Emerald Green installer, sold
  (
    5,
    'Test Customer 5',
    '3333333333',
    'test5@example.com',
    '654 Mock Boulevard',
    'SE1 9AA',
    'John Smith',
    'Sarah Connor',
    'Emerald Green',
    'Install Complete',
    'Sold Survey',
    'Test notes for lead 5',
    'Installer notes for lead 5',
    180.00,
    9000.00,
    450.00,
    NOW(),
    NOW()
  );

-- ============================================================================
-- Verification Queries
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
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'Test Data Setup Complete!';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'Created % test users', v_user_count;
  RAISE NOTICE 'Created % test leads', v_lead_count;
  RAISE NOTICE '';
  RAISE NOTICE 'Test Users:';
  RAISE NOTICE '  - Admin Test User (admin)';
  RAISE NOTICE '  - John Smith (field_rep, AM: Sarah Connor) - has 3 leads (1, 3, 5)';
  RAISE NOTICE '  - Jane Doe (field_rep, AM: Other Manager) - has 2 leads (2, 4)';
  RAISE NOTICE '  - Sarah Connor (account_manager) - manages 4 leads (1, 2, 3, 5)';
  RAISE NOTICE '  - Other Manager (account_manager) - manages 1 lead (4)';
  RAISE NOTICE '  - Emerald Installer (installer, Emerald Green) - 3 leads (1, 3, 5)';
  RAISE NOTICE '';
  RAISE NOTICE 'Test Leads:';
  RAISE NOTICE '  - Lead 1: John Smith + Emerald Green';
  RAISE NOTICE '  - Lead 2: Jane Doe + Solar Solutions';
  RAISE NOTICE '  - Lead 3: John Smith + Emerald Green (Sold)';
  RAISE NOTICE '  - Lead 4: Jane Doe + Other Manager + Solar Solutions';
  RAISE NOTICE '  - Lead 5: John Smith + Emerald Green (Sold)';
  RAISE NOTICE '';
  RAISE NOTICE '✓ Ready to run security tests!';
  RAISE NOTICE 'Execute: supabase db execute --file sql/tests/rbac_security_tests.sql';
  RAISE NOTICE '';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'IMPORTANT: Foreign key constraint user_profiles_id_fkey was disabled';
  RAISE NOTICE 'This is intentional for test data. Cleanup with 999_cleanup_test_data.sql';
  RAISE NOTICE 'In production, the constraint remains enabled.';
  RAISE NOTICE '============================================================================';
END $$;
