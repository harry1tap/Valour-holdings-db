-- ============================================================================
-- Add CHECK constraint to Lead_Source column
-- ============================================================================
-- This enforces standardized values of "Online" or "Field" for Lead_Source
-- NULL values are allowed for leads without a defined source
-- ============================================================================

-- Add constraint to enforce "Online" or "Field" values
ALTER TABLE solar.solar_leads
ADD CONSTRAINT lead_source_check
CHECK ("Lead_Source" IS NULL OR "Lead_Source" IN ('Online', 'Field'));

-- Add comment for documentation
COMMENT ON COLUMN solar.solar_leads."Lead_Source" IS 'Lead source channel: Online or Field (NULL allowed)';
