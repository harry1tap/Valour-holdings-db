-- ============================================================================
-- Migration 001: Add Installer Role Support
-- ============================================================================
-- Purpose: Add the "installer" role to the system with organization-based filtering
-- Date: 2026-01-10
-- ============================================================================

-- Add organization column to user_profiles for installer role
-- This stores the installer's organization name (e.g., "Emerald Green")
-- It will be matched against the Installer column in solar_leads table
ALTER TABLE public.user_profiles
ADD COLUMN organization TEXT NULL;

-- Update role constraint to include 'installer'
-- First drop BOTH existing role constraints (inline and named)
-- The inline CHECK constraint was auto-generated as 'user_profiles_role_check'
ALTER TABLE public.user_profiles
DROP CONSTRAINT IF EXISTS user_profiles_role_check;

-- Drop the named constraint
ALTER TABLE public.user_profiles
DROP CONSTRAINT IF EXISTS valid_role;

-- Add new constraint with 'installer' role
ALTER TABLE public.user_profiles
ADD CONSTRAINT valid_role
CHECK (role IN ('admin', 'account_manager', 'field_rep', 'installer'));

-- Update field_rep constraint to allow installer role without account_manager_name
-- Installers don't need an account manager assigned
ALTER TABLE public.user_profiles
DROP CONSTRAINT IF EXISTS field_rep_requires_am;

ALTER TABLE public.user_profiles
ADD CONSTRAINT field_rep_requires_am
CHECK (
  role != 'field_rep' OR account_manager_name IS NOT NULL
);

-- Add constraint for installer requiring organization
-- Every installer user must have an organization specified
ALTER TABLE public.user_profiles
ADD CONSTRAINT installer_requires_org
CHECK (
  role != 'installer' OR organization IS NOT NULL
);

-- Add index for organization lookups
-- This improves performance when filtering by installer organization
CREATE INDEX idx_user_profiles_organization
ON public.user_profiles(organization)
WHERE organization IS NOT NULL;

-- Add index on Installer column in solar_leads if not exists
-- This improves performance when filtering leads by installer
CREATE INDEX IF NOT EXISTS idx_solar_leads_installer
ON solar.solar_leads("Installer");

-- Add helpful comments
COMMENT ON COLUMN public.user_profiles.organization IS 'Organization name for installer role - matches Installer column in solar_leads';

-- Verification message
DO $$
BEGIN
  RAISE NOTICE 'Migration 001 completed successfully';
  RAISE NOTICE 'Added installer role with organization-based filtering';
  RAISE NOTICE 'New column: user_profiles.organization';
  RAISE NOTICE 'Updated constraint: valid_role includes installer';
  RAISE NOTICE 'New constraint: installer_requires_org';
  RAISE NOTICE 'Created indexes: idx_user_profiles_organization, idx_solar_leads_installer';
END $$;
