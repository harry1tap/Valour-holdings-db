# Database Schema Design Document
## Valour Holdings Solar Lead Management Dashboard

**Version:** 1.0  
**Date:** January 8, 2026  
**Database:** PostgreSQL 15+ (Supabase)  
**Schema:** solar, public, auth

---

## 1. Overview

### 1.1 Database Architecture
- **Existing Schema:** `solar.solar_leads` (preserved, no modifications)
- **New Schema:** `public` for user management tables
- **Auth Schema:** Managed by Supabase (auth.users)

### 1.2 Design Principles
- Minimal changes to existing data structure
- Row-Level Security (RLS) for data isolation
- Indexes for performance optimization
- Immutable audit trail for sensitive changes
- Referential integrity with foreign keys

---

## 2. Existing Table (Preserved)

### 2.1 solar.solar_leads

**This table already exists and will NOT be modified.**

```sql
-- Existing table structure (for reference only)
CREATE TABLE solar.solar_leads (
  id SERIAL NOT NULL PRIMARY KEY,
  "Created_At" TIMESTAMPTZ NULL,
  "Customer_Name" TEXT NULL,
  "Customer_Tel" VARCHAR NULL,
  "Alternative_Tel" VARCHAR NULL,
  "Customer_Email" VARCHAR NULL,
  "First_Line_Of_Address" TEXT NULL,
  "Postcode" TEXT NULL,
  "Property_Type" TEXT NULL,
  "Monthly_Electricity_Costs" TEXT NULL,
  "Lead_Source" TEXT NULL,
  "Account_Manager" TEXT NULL DEFAULT 'Rachel Jenkins',
  "Field_Rep" TEXT NULL,
  "Installer" TEXT NULL,
  "Installer_Assigned_Date" DATE NULL,
  "Status" TEXT NULL,
  "Survey_Booked_Date" DATE NULL,
  "Survey_Complete_Date" DATE NULL,
  "Install_Booked_Date" DATE NULL,
  "Paid_Date" DATE NULL,
  "Fall_Off_Stage" TEXT NULL,
  "Fall_Off_Reason" TEXT NULL,
  "Payment_Model" TEXT NULL,
  "Lead_Cost" NUMERIC NULL,
  "Lead_Revenue" NUMERIC NULL,
  "Commission_Amount" NUMERIC NULL,
  "Commission_Paid" TEXT NULL,
  "Commission_Paid_Date" DATE NULL,
  "Notes" TEXT NULL,
  "Installer_Notes" TEXT NULL,
  "Front_Elevation_Image" TEXT NULL,
  "Survey_Status" TEXT NULL
);

-- Existing trigger (preserved)
CREATE TRIGGER trigger_status_webhook
AFTER UPDATE ON solar.solar_leads
FOR EACH ROW
EXECUTE FUNCTION notify_status_change_solar();
```

**Key Fields for Dashboard:**
- `Created_At` - For date filtering
- `Survey_Booked_Date` - Survey booked metric
- `Survey_Complete_Date` - Survey completion metric
- `Survey_Status` - Values: 'Good Survey', 'Bad Survey', 'Sold Survey'
- `Account_Manager` - For Account Manager filtering
- `Field_Rep` - For Field Rep filtering
- `Lead_Cost` - For cost per lead calculation
- `Notes` - Expandable notes in detail view
- `Fall_Off_Reason` - Displayed in detail view

---

## 3. New Tables Required

### 3.1 public.user_profiles

**Purpose:** Store user metadata and role information, extends Supabase auth.users

```sql
-- User profiles table
CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'account_manager', 'field_rep')),
  account_manager_name TEXT NULL, -- Only for field_reps, links to their Account Manager
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) NULL,
  
  CONSTRAINT valid_role CHECK (role IN ('admin', 'account_manager', 'field_rep')),
  CONSTRAINT field_rep_requires_am CHECK (
    role != 'field_rep' OR account_manager_name IS NOT NULL
  )
);

-- Indexes
CREATE INDEX idx_user_profiles_role ON public.user_profiles(role);
CREATE INDEX idx_user_profiles_full_name ON public.user_profiles(full_name);
CREATE INDEX idx_user_profiles_email ON public.user_profiles(email);

-- Updated timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_profiles_updated_at
BEFORE UPDATE ON public.user_profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE public.user_profiles IS 'User profile data and role assignments';
COMMENT ON COLUMN public.user_profiles.account_manager_name IS 'For field_rep role only - links to their Account Manager';
```

**Field Descriptions:**
- `id` - Links to Supabase auth.users.id
- `email` - User email (matches auth.users.email)
- `full_name` - Display name (must match Field_Rep/Account_Manager in solar_leads)
- `role` - User role: admin, account_manager, field_rep
- `account_manager_name` - For Field Reps only, their Account Manager's name
- `is_active` - Soft delete flag
- `created_by` - Admin who created this user
- `created_at` - Account creation timestamp
- `updated_at` - Last modification timestamp

**Example Data:**
```sql
-- Admin user
INSERT INTO public.user_profiles (id, email, full_name, role, is_active) VALUES
('uuid-1', 'admin@valourholdings.com', 'Admin User', 'admin', TRUE);

-- Account Manager
INSERT INTO public.user_profiles (id, email, full_name, role, is_active) VALUES
('uuid-2', 'rachel.jenkins@valourholdings.com', 'Rachel Jenkins', 'account_manager', TRUE);

-- Field Rep
INSERT INTO public.user_profiles (id, email, full_name, role, account_manager_name, is_active) VALUES
('uuid-3', 'john.smith@valourholdings.com', 'John Smith', 'field_rep', 'Rachel Jenkins', TRUE);
```

### 3.2 public.audit_log (Optional but Recommended)

**Purpose:** Track admin actions for compliance and debugging

```sql
CREATE TABLE public.audit_log (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  action TEXT NOT NULL, -- 'CREATE', 'UPDATE', 'DELETE'
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  old_values JSONB NULL,
  new_values JSONB NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_audit_log_user_id ON public.audit_log(user_id);
CREATE INDEX idx_audit_log_created_at ON public.audit_log(created_at DESC);
CREATE INDEX idx_audit_log_table_name ON public.audit_log(table_name);

-- Comments
COMMENT ON TABLE public.audit_log IS 'Audit trail for sensitive data changes';
```

**Usage Example:**
```sql
-- Log when admin updates a lead
INSERT INTO public.audit_log (user_id, action, table_name, record_id, old_values, new_values)
VALUES (
  auth.uid(),
  'UPDATE',
  'solar_leads',
  '123',
  '{"Status": "Survey Booked"}',
  '{"Status": "Survey Complete"}'
);
```

---

## 4. Performance Optimization

### 4.1 Indexes on solar.solar_leads

**Add these indexes for optimal query performance:**

```sql
-- Primary date fields (for date range filtering)
CREATE INDEX IF NOT EXISTS idx_solar_leads_created_at 
ON solar.solar_leads("Created_At");

CREATE INDEX IF NOT EXISTS idx_solar_leads_survey_booked 
ON solar.solar_leads("Survey_Booked_Date") 
WHERE "Survey_Booked_Date" IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_solar_leads_survey_complete 
ON solar.solar_leads("Survey_Complete_Date") 
WHERE "Survey_Complete_Date" IS NOT NULL;

-- Status fields (for filtering)
CREATE INDEX IF NOT EXISTS idx_solar_leads_status 
ON solar.solar_leads("Status");

CREATE INDEX IF NOT EXISTS idx_solar_leads_survey_status 
ON solar.solar_leads("Survey_Status");

-- Assignment fields (for role-based queries)
CREATE INDEX IF NOT EXISTS idx_solar_leads_account_manager 
ON solar.solar_leads("Account_Manager");

CREATE INDEX IF NOT EXISTS idx_solar_leads_field_rep 
ON solar.solar_leads("Field_Rep");

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_solar_leads_created_status 
ON solar.solar_leads("Created_At", "Status");

CREATE INDEX IF NOT EXISTS idx_solar_leads_am_created 
ON solar.solar_leads("Account_Manager", "Created_At");

CREATE INDEX IF NOT EXISTS idx_solar_leads_fr_created 
ON solar.solar_leads("Field_Rep", "Created_At");

-- Search optimization (for Customer_Name and Postcode search)
CREATE INDEX IF NOT EXISTS idx_solar_leads_customer_name_trgm 
ON solar.solar_leads USING gin ("Customer_Name" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_solar_leads_postcode_trgm 
ON solar.solar_leads USING gin ("Postcode" gin_trgm_ops);

-- Enable pg_trgm extension for fuzzy search
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

**Index Usage Explanation:**
- `idx_solar_leads_created_at` - Fast date range queries
- `idx_solar_leads_survey_status` - Filter by Good/Bad/Sold
- `idx_solar_leads_account_manager` - Account Manager queries
- `idx_solar_leads_field_rep` - Field Rep queries
- Composite indexes - Optimize queries with multiple filters
- Trigram indexes - Fuzzy text search for names/postcodes

### 4.2 Materialized View for Dashboard Metrics (Optional)

**For very large datasets (50k+ leads), consider a materialized view:**

```sql
CREATE MATERIALIZED VIEW dashboard_metrics_cache AS
SELECT
  DATE_TRUNC('day', "Created_At") as metric_date,
  "Account_Manager",
  "Field_Rep",
  COUNT(*) as total_leads,
  COUNT("Survey_Booked_Date") as surveys_booked,
  COUNT(CASE WHEN "Survey_Status" = 'Good Survey' THEN 1 END) as good_surveys,
  COUNT(CASE WHEN "Survey_Status" = 'Bad Survey' THEN 1 END) as bad_surveys,
  COUNT(CASE WHEN "Survey_Status" = 'Sold Survey' THEN 1 END) as sold_surveys,
  SUM("Lead_Cost") as total_lead_cost,
  COUNT(CASE WHEN "Survey_Status" = 'Sold Survey' THEN 1 END)::DECIMAL / 
    NULLIF(COUNT(*), 0) * 100 as conversion_rate
FROM solar.solar_leads
WHERE "Created_At" IS NOT NULL
GROUP BY DATE_TRUNC('day', "Created_At"), "Account_Manager", "Field_Rep";

-- Index on materialized view
CREATE INDEX idx_dashboard_cache_date ON dashboard_metrics_cache(metric_date);
CREATE INDEX idx_dashboard_cache_am ON dashboard_metrics_cache("Account_Manager");
CREATE INDEX idx_dashboard_cache_fr ON dashboard_metrics_cache("Field_Rep");

-- Refresh daily at 2am
-- (Set up via Supabase cron or external scheduler)
```

**Refresh Strategy:**
```sql
-- Manual refresh
REFRESH MATERIALIZED VIEW dashboard_metrics_cache;

-- Or use Supabase cron extension
SELECT cron.schedule(
  'refresh-dashboard-metrics',
  '0 2 * * *', -- Daily at 2am
  'REFRESH MATERIALIZED VIEW dashboard_metrics_cache'
);
```

**Note:** Only implement if performance issues occur. Start with regular queries first.

---

## 5. Row-Level Security (RLS) Policies

### 5.1 Enable RLS on Tables

```sql
-- Enable RLS on solar_leads
ALTER TABLE solar.solar_leads ENABLE ROW LEVEL SECURITY;

-- Enable RLS on user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Enable RLS on audit_log
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
```

### 5.2 RLS Policies for solar.solar_leads

**Policy 1: Admins can view all leads**
```sql
CREATE POLICY "Admins can view all leads"
ON solar.solar_leads
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() 
    AND role = 'admin'
    AND is_active = TRUE
  )
);
```

**Policy 2: Account Managers see their assigned leads**
```sql
CREATE POLICY "Account Managers see their leads"
ON solar.solar_leads
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() 
    AND role = 'account_manager'
    AND is_active = TRUE
    AND full_name = solar.solar_leads."Account_Manager"
  )
);
```

**Policy 3: Field Reps see their assigned leads**
```sql
CREATE POLICY "Field Reps see their leads"
ON solar.solar_leads
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() 
    AND role = 'field_rep'
    AND is_active = TRUE
    AND full_name = solar.solar_leads."Field_Rep"
  )
);
```

**Policy 4: Only admins can update leads**
```sql
CREATE POLICY "Only admins can update leads"
ON solar.solar_leads
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() 
    AND role = 'admin'
    AND is_active = TRUE
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() 
    AND role = 'admin'
    AND is_active = TRUE
  )
);
```

**Policy 5: Only admins can insert leads (if needed)**
```sql
CREATE POLICY "Only admins can insert leads"
ON solar.solar_leads
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() 
    AND role = 'admin'
    AND is_active = TRUE
  )
);
```

**Policy 6: No one can delete leads (soft delete only)**
```sql
-- Don't create a DELETE policy = no one can delete
-- If soft delete needed, add a 'deleted_at' column
```

### 5.3 RLS Policies for public.user_profiles

**Policy 1: Users can view their own profile**
```sql
CREATE POLICY "Users can view own profile"
ON public.user_profiles
FOR SELECT
TO authenticated
USING (id = auth.uid());
```

**Policy 2: Admins can view all profiles**
```sql
CREATE POLICY "Admins can view all profiles"
ON public.user_profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.id = auth.uid() 
    AND up.role = 'admin'
    AND up.is_active = TRUE
  )
);
```

**Policy 3: Admins can insert new users**
```sql
CREATE POLICY "Admins can create users"
ON public.user_profiles
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() 
    AND role = 'admin'
    AND is_active = TRUE
  )
);
```

**Policy 4: Admins can update users**
```sql
CREATE POLICY "Admins can update users"
ON public.user_profiles
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() 
    AND role = 'admin'
    AND is_active = TRUE
  )
);
```

**Policy 5: Admins can delete users**
```sql
CREATE POLICY "Admins can delete users"
ON public.user_profiles
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() 
    AND role = 'admin'
    AND is_active = TRUE
  )
  -- Prevent deleting yourself
  AND id != auth.uid()
);
```

### 5.4 RLS Policies for public.audit_log

**Policy 1: Only admins can view audit logs**
```sql
CREATE POLICY "Only admins can view audit logs"
ON public.audit_log
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() 
    AND role = 'admin'
    AND is_active = TRUE
  )
);
```

**Policy 2: System can insert audit logs**
```sql
CREATE POLICY "System can insert audit logs"
ON public.audit_log
FOR INSERT
TO authenticated
WITH CHECK (TRUE);
-- Any authenticated user can create audit logs
-- This allows triggers to work
```

---

## 6. Database Functions

### 6.1 Function: Get User Role

```sql
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT role 
    FROM public.user_profiles 
    WHERE id = auth.uid() 
    AND is_active = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 6.2 Function: Calculate Dashboard Metrics

```sql
CREATE OR REPLACE FUNCTION calculate_dashboard_metrics(
  p_date_from TIMESTAMPTZ,
  p_date_to TIMESTAMPTZ,
  p_account_manager TEXT DEFAULT NULL,
  p_field_rep TEXT DEFAULT NULL
)
RETURNS TABLE (
  total_leads BIGINT,
  surveys_booked BIGINT,
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
```

**Usage:**
```sql
-- All leads this month
SELECT * FROM calculate_dashboard_metrics(
  '2026-01-01'::timestamptz,
  '2026-01-31'::timestamptz,
  NULL,
  NULL
);

-- Specific Account Manager
SELECT * FROM calculate_dashboard_metrics(
  '2026-01-01'::timestamptz,
  '2026-01-31'::timestamptz,
  'Rachel Jenkins',
  NULL
);
```

### 6.3 Function: Get Staff Performance

```sql
CREATE OR REPLACE FUNCTION get_staff_performance(
  p_date_from TIMESTAMPTZ,
  p_date_to TIMESTAMPTZ,
  p_role TEXT DEFAULT 'field_rep'
)
RETURNS TABLE (
  staff_name TEXT,
  total_leads BIGINT,
  good_surveys BIGINT,
  bad_surveys BIGINT,
  sold_surveys BIGINT,
  conversion_rate NUMERIC
) AS $$
BEGIN
  IF p_role = 'field_rep' THEN
    RETURN QUERY
    SELECT
      "Field_Rep" as staff_name,
      COUNT(*)::BIGINT as total_leads,
      COUNT(CASE WHEN "Survey_Status" = 'Good Survey' THEN 1 END)::BIGINT as good_surveys,
      COUNT(CASE WHEN "Survey_Status" = 'Bad Survey' THEN 1 END)::BIGINT as bad_surveys,
      COUNT(CASE WHEN "Survey_Status" = 'Sold Survey' THEN 1 END)::BIGINT as sold_surveys,
      ROUND(
        (COUNT(CASE WHEN "Survey_Status" = 'Sold Survey' THEN 1 END)::NUMERIC / NULLIF(COUNT(*), 0) * 100),
        2
      ) as conversion_rate
    FROM solar.solar_leads
    WHERE "Created_At" >= p_date_from
      AND "Created_At" <= p_date_to
      AND "Field_Rep" IS NOT NULL
    GROUP BY "Field_Rep"
    ORDER BY sold_surveys DESC;
  ELSE
    RETURN QUERY
    SELECT
      "Account_Manager" as staff_name,
      COUNT(*)::BIGINT as total_leads,
      COUNT(CASE WHEN "Survey_Status" = 'Good Survey' THEN 1 END)::BIGINT as good_surveys,
      COUNT(CASE WHEN "Survey_Status" = 'Bad Survey' THEN 1 END)::BIGINT as bad_surveys,
      COUNT(CASE WHEN "Survey_Status" = 'Sold Survey' THEN 1 END)::BIGINT as sold_surveys,
      ROUND(
        (COUNT(CASE WHEN "Survey_Status" = 'Sold Survey' THEN 1 END)::NUMERIC / NULLIF(COUNT(*), 0) * 100),
        2
      ) as conversion_rate
    FROM solar.solar_leads
    WHERE "Created_At" >= p_date_from
      AND "Created_At" <= p_date_to
      AND "Account_Manager" IS NOT NULL
    GROUP BY "Account_Manager"
    ORDER BY sold_surveys DESC;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_staff_performance TO authenticated;
```

---

## 7. Database Migrations

### 7.1 Migration File Structure

```
supabase/migrations/
├── 20260108000001_create_user_profiles.sql
├── 20260108000002_add_solar_leads_indexes.sql
├── 20260108000003_enable_rls_policies.sql
├── 20260108000004_create_database_functions.sql
└── 20260108000005_create_audit_log.sql (optional)
```

### 7.2 Migration 1: Create User Profiles

**File:** `20260108000001_create_user_profiles.sql`

```sql
-- Create user_profiles table
CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'account_manager', 'field_rep')),
  account_manager_name TEXT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) NULL,
  
  CONSTRAINT valid_role CHECK (role IN ('admin', 'account_manager', 'field_rep')),
  CONSTRAINT field_rep_requires_am CHECK (
    role != 'field_rep' OR account_manager_name IS NOT NULL
  )
);

-- Create indexes
CREATE INDEX idx_user_profiles_role ON public.user_profiles(role);
CREATE INDEX idx_user_profiles_full_name ON public.user_profiles(full_name);
CREATE INDEX idx_user_profiles_email ON public.user_profiles(email);

-- Create update trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER update_user_profiles_updated_at
BEFORE UPDATE ON public.user_profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE public.user_profiles IS 'User profile data and role assignments';
COMMENT ON COLUMN public.user_profiles.account_manager_name IS 'For field_rep role only';
```

### 7.3 Migration 2: Add Indexes

**File:** `20260108000002_add_solar_leads_indexes.sql`

```sql
-- Enable pg_trgm extension for search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Date indexes
CREATE INDEX IF NOT EXISTS idx_solar_leads_created_at 
ON solar.solar_leads("Created_At");

CREATE INDEX IF NOT EXISTS idx_solar_leads_survey_booked 
ON solar.solar_leads("Survey_Booked_Date") 
WHERE "Survey_Booked_Date" IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_solar_leads_survey_complete 
ON solar.solar_leads("Survey_Complete_Date") 
WHERE "Survey_Complete_Date" IS NOT NULL;

-- Status indexes
CREATE INDEX IF NOT EXISTS idx_solar_leads_status 
ON solar.solar_leads("Status");

CREATE INDEX IF NOT EXISTS idx_solar_leads_survey_status 
ON solar.solar_leads("Survey_Status");

-- Assignment indexes
CREATE INDEX IF NOT EXISTS idx_solar_leads_account_manager 
ON solar.solar_leads("Account_Manager");

CREATE INDEX IF NOT EXISTS idx_solar_leads_field_rep 
ON solar.solar_leads("Field_Rep");

-- Composite indexes
CREATE INDEX IF NOT EXISTS idx_solar_leads_created_status 
ON solar.solar_leads("Created_At", "Status");

CREATE INDEX IF NOT EXISTS idx_solar_leads_am_created 
ON solar.solar_leads("Account_Manager", "Created_At");

CREATE INDEX IF NOT EXISTS idx_solar_leads_fr_created 
ON solar.solar_leads("Field_Rep", "Created_At");

-- Search indexes
CREATE INDEX IF NOT EXISTS idx_solar_leads_customer_name_trgm 
ON solar.solar_leads USING gin ("Customer_Name" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_solar_leads_postcode_trgm 
ON solar.solar_leads USING gin ("Postcode" gin_trgm_ops);
```

### 7.4 Migration 3: RLS Policies

**File:** `20260108000003_enable_rls_policies.sql`

```sql
-- Enable RLS
ALTER TABLE solar.solar_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- solar_leads policies
CREATE POLICY "Admins can view all leads"
ON solar.solar_leads FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role = 'admin' AND is_active = TRUE
  )
);

CREATE POLICY "Account Managers see their leads"
ON solar.solar_leads FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role = 'account_manager' AND is_active = TRUE
    AND full_name = solar.solar_leads."Account_Manager"
  )
);

CREATE POLICY "Field Reps see their leads"
ON solar.solar_leads FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role = 'field_rep' AND is_active = TRUE
    AND full_name = solar.solar_leads."Field_Rep"
  )
);

CREATE POLICY "Only admins can update leads"
ON solar.solar_leads FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role = 'admin' AND is_active = TRUE
  )
);

CREATE POLICY "Only admins can insert leads"
ON solar.solar_leads FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role = 'admin' AND is_active = TRUE
  )
);

-- user_profiles policies
CREATE POLICY "Users can view own profile"
ON public.user_profiles FOR SELECT TO authenticated
USING (id = auth.uid());

CREATE POLICY "Admins can view all profiles"
ON public.user_profiles FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.id = auth.uid() AND up.role = 'admin' AND up.is_active = TRUE
  )
);

CREATE POLICY "Admins can create users"
ON public.user_profiles FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role = 'admin' AND is_active = TRUE
  )
);

CREATE POLICY "Admins can update users"
ON public.user_profiles FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role = 'admin' AND is_active = TRUE
  )
);

CREATE POLICY "Admins can delete users"
ON public.user_profiles FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role = 'admin' AND is_active = TRUE
  )
  AND id != auth.uid()
);
```

### 7.5 Migration 4: Database Functions

**File:** `20260108000004_create_database_functions.sql`

```sql
-- Function: Get user role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT role FROM public.user_profiles 
    WHERE id = auth.uid() AND is_active = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Calculate dashboard metrics
CREATE OR REPLACE FUNCTION calculate_dashboard_metrics(
  p_date_from TIMESTAMPTZ,
  p_date_to TIMESTAMPTZ,
  p_account_manager TEXT DEFAULT NULL,
  p_field_rep TEXT DEFAULT NULL
)
RETURNS TABLE (
  total_leads BIGINT,
  surveys_booked BIGINT,
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
    COUNT(*)::BIGINT,
    COUNT("Survey_Booked_Date")::BIGINT,
    COUNT(CASE WHEN "Survey_Status" = 'Good Survey' THEN 1 END)::BIGINT,
    COUNT(CASE WHEN "Survey_Status" = 'Bad Survey' THEN 1 END)::BIGINT,
    COUNT(CASE WHEN "Survey_Status" = 'Sold Survey' THEN 1 END)::BIGINT,
    ROUND((COUNT("Survey_Booked_Date")::NUMERIC / NULLIF(COUNT(*), 0) * 100), 2),
    ROUND((COUNT(CASE WHEN "Survey_Status" = 'Sold Survey' THEN 1 END)::NUMERIC / NULLIF(COUNT(*), 0) * 100), 2),
    SUM("Lead_Cost"),
    ROUND((SUM("Lead_Cost") / NULLIF(COUNT(*), 0)), 2)
  FROM solar.solar_leads
  WHERE "Created_At" >= p_date_from AND "Created_At" <= p_date_to
    AND (p_account_manager IS NULL OR "Account_Manager" = p_account_manager)
    AND (p_field_rep IS NULL OR "Field_Rep" = p_field_rep);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get staff performance
CREATE OR REPLACE FUNCTION get_staff_performance(
  p_date_from TIMESTAMPTZ,
  p_date_to TIMESTAMPTZ,
  p_role TEXT DEFAULT 'field_rep'
)
RETURNS TABLE (
  staff_name TEXT,
  total_leads BIGINT,
  good_surveys BIGINT,
  bad_surveys BIGINT,
  sold_surveys BIGINT,
  conversion_rate NUMERIC
) AS $$
BEGIN
  IF p_role = 'field_rep' THEN
    RETURN QUERY
    SELECT
      "Field_Rep" as staff_name,
      COUNT(*)::BIGINT,
      COUNT(CASE WHEN "Survey_Status" = 'Good Survey' THEN 1 END)::BIGINT,
      COUNT(CASE WHEN "Survey_Status" = 'Bad Survey' THEN 1 END)::BIGINT,
      COUNT(CASE WHEN "Survey_Status" = 'Sold Survey' THEN 1 END)::BIGINT,
      ROUND((COUNT(CASE WHEN "Survey_Status" = 'Sold Survey' THEN 1 END)::NUMERIC / NULLIF(COUNT(*), 0) * 100), 2)
    FROM solar.solar_leads
    WHERE "Created_At" >= p_date_from AND "Created_At" <= p_date_to
      AND "Field_Rep" IS NOT NULL
    GROUP BY "Field_Rep"
    ORDER BY sold_surveys DESC;
  ELSE
    RETURN QUERY
    SELECT
      "Account_Manager" as staff_name,
      COUNT(*)::BIGINT,
      COUNT(CASE WHEN "Survey_Status" = 'Good Survey' THEN 1 END)::BIGINT,
      COUNT(CASE WHEN "Survey_Status" = 'Bad Survey' THEN 1 END)::BIGINT,
      COUNT(CASE WHEN "Survey_Status" = 'Sold Survey' THEN 1 END)::BIGINT,
      ROUND((COUNT(CASE WHEN "Survey_Status" = 'Sold Survey' THEN 1 END)::NUMERIC / NULLIF(COUNT(*), 0) * 100), 2)
    FROM solar.solar_leads
    WHERE "Created_At" >= p_date_from AND "Created_At" <= p_date_to
      AND "Account_Manager" IS NOT NULL
    GROUP BY "Account_Manager"
    ORDER BY sold_surveys DESC;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_user_role TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_dashboard_metrics TO authenticated;
GRANT EXECUTE ON FUNCTION get_staff_performance TO authenticated;
```

---

## 8. Seed Data for Testing

```sql
-- Seed file: supabase/seed.sql

-- Note: First create auth users through Supabase Dashboard or Auth API
-- Then insert their profiles here

-- Admin user profile
INSERT INTO public.user_profiles (id, email, full_name, role, is_active) VALUES
('00000000-0000-0000-0000-000000000001', 'admin@valourholdings.com', 'Admin User', 'admin', TRUE)
ON CONFLICT (id) DO NOTHING;

-- Account Manager
INSERT INTO public.user_profiles (id, email, full_name, role, is_active) VALUES
('00000000-0000-0000-0000-000000000002', 'rachel.jenkins@valourholdings.com', 'Rachel Jenkins', 'account_manager', TRUE)
ON CONFLICT (id) DO NOTHING;

-- Field Reps
INSERT INTO public.user_profiles (id, email, full_name, role, account_manager_name, is_active) VALUES
('00000000-0000-0000-0000-000000000003', 'john.smith@valourholdings.com', 'John Smith', 'field_rep', 'Rachel Jenkins', TRUE),
('00000000-0000-0000-0000-000000000004', 'jane.doe@valourholdings.com', 'Jane Doe', 'field_rep', 'Rachel Jenkins', TRUE)
ON CONFLICT (id) DO NOTHING;
```

---

## 9. Query Examples

### 9.1 Get Dashboard Metrics for Current Month

```sql
SELECT * FROM calculate_dashboard_metrics(
  DATE_TRUNC('month', NOW())::TIMESTAMPTZ,
  (DATE_TRUNC('month', NOW()) + INTERVAL '1 month' - INTERVAL '1 day')::TIMESTAMPTZ,
  NULL,
  NULL
);
```

### 9.2 Get Field Rep Performance

```sql
SELECT * FROM get_staff_performance(
  '2026-01-01'::TIMESTAMPTZ,
  '2026-01-31'::TIMESTAMPTZ,
  'field_rep'
);
```

### 9.3 Search Leads by Customer Name

```sql
SELECT 
  id,
  "Customer_Name",
  "Postcode",
  "Status",
  "Survey_Status",
  "Created_At"
FROM solar.solar_leads
WHERE "Customer_Name" ILIKE '%Smith%'
  OR "Postcode" ILIKE '%SW1%'
ORDER BY "Created_At" DESC
LIMIT 50;
```

### 9.4 Get Lead Details with Notes

```sql
SELECT 
  *
FROM solar.solar_leads
WHERE id = 123;
```

---

## 10. Backup & Recovery Strategy

### 10.1 Supabase Automatic Backups
- Daily automatic backups (included in Supabase)
- 7-day retention on Free tier
- 30-day retention on Pro tier
- Point-in-time recovery available

### 10.2 Manual Backup Commands

```bash
# Export schema
pg_dump -h db.xxx.supabase.co -U postgres -s -n solar -n public > schema_backup.sql

# Export data
pg_dump -h db.xxx.supabase.co -U postgres -a -n solar -n public > data_backup.sql

# Full backup
pg_dump -h db.xxx.supabase.co -U postgres -F c -b -v -f full_backup.dump
```

---

## 11. Database Monitoring

### 11.1 Key Metrics to Monitor
- Query performance (slow queries >1s)
- Connection pool usage
- Database size growth
- Index usage statistics
- RLS policy hit rate

### 11.2 Monitoring Queries

```sql
-- Find slow queries
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  max_time
FROM pg_stat_statements
WHERE mean_time > 1000 -- > 1 second
ORDER BY mean_time DESC
LIMIT 10;

-- Check index usage
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'solar'
ORDER BY idx_scan ASC;

-- Database size
SELECT
  pg_size_pretty(pg_database_size('postgres')) as database_size;

-- Table sizes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname IN ('solar', 'public')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

## 12. Database Maintenance

### 12.1 Regular Maintenance Tasks

```sql
-- Vacuum and analyze (run weekly)
VACUUM ANALYZE solar.solar_leads;
VACUUM ANALYZE public.user_profiles;

-- Refresh materialized view (if used)
REFRESH MATERIALIZED VIEW dashboard_metrics_cache;

-- Update table statistics
ANALYZE solar.solar_leads;
```

### 12.2 Automated Maintenance
- Supabase handles automatic vacuuming
- Statistics auto-updated
- No manual intervention needed in most cases

---

**Document Status:** ✅ Ready for Implementation  
**Next Steps:** Review Authentication & Authorization Specification (04)  
**Dependencies:** Supabase project must be created first
