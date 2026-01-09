-- ============================================================================
-- Migrate existing Lead_Source data to standardized values
-- ============================================================================
-- This script standardizes existing Lead_Source values to "Online" or "Field"
-- Run this BEFORE adding the CHECK constraint
-- ============================================================================

-- Show current Lead_Source values before migration
SELECT
  "Lead_Source",
  COUNT(*) as count
FROM solar.solar_leads
WHERE "Lead_Source" IS NOT NULL
GROUP BY "Lead_Source"
ORDER BY count DESC;

-- Update existing Lead_Source values to standardized format
UPDATE solar.solar_leads
SET "Lead_Source" = CASE
  -- Online sources
  WHEN "Lead_Source" ILIKE '%online%' THEN 'Online'
  WHEN "Lead_Source" ILIKE '%google%' THEN 'Online'
  WHEN "Lead_Source" ILIKE '%facebook%' THEN 'Online'
  WHEN "Lead_Source" ILIKE '%digital%' THEN 'Online'
  WHEN "Lead_Source" ILIKE '%web%' THEN 'Online'
  WHEN "Lead_Source" ILIKE '%internet%' THEN 'Online'
  WHEN "Lead_Source" ILIKE '%social%' THEN 'Online'

  -- Field sources
  WHEN "Lead_Source" ILIKE '%field%' THEN 'Field'
  WHEN "Lead_Source" ILIKE '%door%' THEN 'Field'
  WHEN "Lead_Source" ILIKE '%canvass%' THEN 'Field'
  WHEN "Lead_Source" ILIKE '%street%' THEN 'Field'
  WHEN "Lead_Source" ILIKE '%direct%' THEN 'Field'
  WHEN "Lead_Source" ILIKE '%face%' THEN 'Field'

  -- Keep NULL for ambiguous sources
  ELSE NULL
END
WHERE "Lead_Source" IS NOT NULL;

-- Show updated Lead_Source values after migration
SELECT
  "Lead_Source",
  COUNT(*) as count
FROM solar.solar_leads
GROUP BY "Lead_Source"
ORDER BY count DESC;

-- Show leads that were set to NULL (ambiguous sources)
SELECT
  id,
  "Customer_Name",
  "Lead_Source",
  "Created_At"
FROM solar.solar_leads
WHERE "Lead_Source" IS NULL
ORDER BY "Created_At" DESC
LIMIT 10;
