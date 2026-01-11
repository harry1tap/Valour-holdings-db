# RBAC Security Tests

Automated test suite for validating Role-Based Access Control (RBAC) implementation in the Valour Holdings Dashboard.

## Prerequisites

### 1. Applied Migrations

All three RBAC migrations must be applied to your database:

```bash
supabase db execute --file sql/migrations/001_add_installer_role.sql
supabase db execute --file sql/migrations/002_secure_rpc_functions.sql
supabase db execute --file sql/migrations/003_create_missing_rpc_functions.sql
```

### 2. Verify Migrations

Check that all RPC functions exist:

```sql
SELECT proname, pronargs
FROM pg_proc
WHERE proname IN (
  'get_solar_lead_by_id',
  'get_solar_leads',
  'create_solar_lead',
  'update_solar_lead',
  'delete_solar_lead',
  'update_survey_status',
  'calculate_dashboard_metrics',
  'get_staff_performance',
  'get_metrics_trend'
)
ORDER BY proname;
```

Expected: 9 functions

## Execution Order

### Step 1: Setup Test Data (REQUIRED)

```bash
supabase db execute --file sql/tests/000_setup_test_data.sql
```

**What this creates:**
- 6 test users with different roles
- 5 test leads with various assignments
- Verification output showing what was created

**Test Users:**
| Email | Full Name | Role | Account Manager | Organization | Leads |
|-------|-----------|------|-----------------|--------------|-------|
| admin-test-rbac@valour.com | Admin Test User | admin | - | - | All |
| john.smith-test-rbac@valour.com | John Smith | field_rep | Sarah Connor | - | 1, 3, 5 |
| jane.doe-test-rbac@valour.com | Jane Doe | field_rep | Other Manager | - | 2, 4 |
| sarah.connor-test-rbac@valour.com | Sarah Connor | account_manager | - | - | 1, 2, 3, 5 |
| other.manager-test-rbac@valour.com | Other Manager | account_manager | - | - | 4 |
| installer-test-rbac@valour.com | Emerald Installer | installer | - | Emerald Green | 1, 3, 5 |

**Test Leads:**
| ID | Customer | Field Rep | Account Manager | Installer | Status |
|----|----------|-----------|-----------------|-----------|--------|
| 1 | Test Customer 1 | John Smith | Sarah Connor | Emerald Green | New Lead |
| 2 | Test Customer 2 | Jane Doe | Sarah Connor | Solar Solutions | Survey Booked |
| 3 | Test Customer 3 | John Smith | Sarah Connor | Emerald Green | Survey Complete |
| 4 | Test Customer 4 | Jane Doe | Other Manager | Solar Solutions | New Lead |
| 5 | Test Customer 5 | John Smith | Sarah Connor | Emerald Green | Install Complete |

### Step 2: Run Security Tests

```bash
supabase db execute --file sql/tests/rbac_security_tests.sql
```

**Expected Output:**

```
NOTICE: ============================================================================
NOTICE: RBAC Security Test Suite
NOTICE: ============================================================================
NOTICE:
NOTICE: TEST 1: Field Rep Access - Should only see their own leads
NOTICE:   Field rep sees 3 leads (expected: 3)
NOTICE:   ✓ PASS: Field rep cannot access other field reps leads
NOTICE:
NOTICE: TEST 2: Installer Access - Should only see organization leads
NOTICE:   ✓ PASS: Installer cannot access other organizations leads
NOTICE:
NOTICE: TEST 3: Field Rep Edit Permissions - Should reject restricted fields
NOTICE:   ✓ PASS: Field rep blocked from editing restricted fields
NOTICE:
NOTICE: TEST 4: Installer Edit Permissions - Should only allow Installer_Notes
NOTICE:   ✓ PASS: Installer blocked from editing non-Installer_Notes fields
NOTICE:
NOTICE: TEST 5: Field Rep Delete - Should be blocked
NOTICE:   ✓ PASS: Field rep blocked from deleting leads
NOTICE:
NOTICE: TEST 6: Account Manager Financial Fields - Should be blocked
NOTICE:   ✓ PASS: Account manager blocked from editing financial fields
NOTICE:
NOTICE: TEST 7: Installer Staff Performance - Should be blocked
NOTICE:   ✓ PASS: Installer blocked from viewing staff performance
NOTICE:
NOTICE: TEST 8: Installer Survey Status - Should be blocked
NOTICE:   ✓ PASS: Installer blocked from updating survey status
NOTICE:
NOTICE: ============================================================================
NOTICE: All 8 security tests passed successfully
NOTICE: ============================================================================
```

### Step 3: Cleanup Test Data (Optional)

After testing, you can remove test data:

```bash
supabase db execute --file sql/tests/999_cleanup_test_data.sql
```

Or manually:

```sql
-- Delete test leads
DELETE FROM solar.solar_leads WHERE id IN (1, 2, 3, 4, 5);

-- Delete test users
DELETE FROM public.user_profiles WHERE email LIKE '%test-rbac%';
```

## Test Coverage

The security test suite validates 8 critical RBAC rules:

### 1. Field Rep Access Control
- ✓ Field reps can only see leads assigned to them (Field_Rep = their name)
- ✓ Field reps cannot access other field reps' leads
- ✓ Test uses "John Smith" who should see 3 leads (1, 3, 5)

### 2. Installer Access Control
- ✓ Installers can only see leads where Installer = their organization
- ✓ Installers cannot access leads from other organizations
- ✓ Test uses "Emerald Green" installer who should see 3 leads (1, 3, 5)

### 3. Field Rep Edit Restrictions
- ✓ Field reps can ONLY edit Notes and Installer_Notes fields
- ✓ Field reps cannot edit customer info, status, or financial fields
- ✓ Test attempts to edit Customer_Name (should fail)

### 4. Installer Edit Restrictions
- ✓ Installers can ONLY edit Installer_Notes field
- ✓ Installers cannot edit Notes, customer info, status, or financial fields
- ✓ Test attempts to edit Notes (should fail)

### 5. Field Rep Delete Restrictions
- ✓ Field reps cannot delete any leads
- ✓ Only admin and account_manager roles can delete

### 6. Account Manager Financial Field Restrictions
- ✓ Account managers cannot edit Lead_Cost, Lead_Revenue, Commission_Amount
- ✓ Account managers can edit all other fields
- ✓ Test attempts to edit Lead_Cost (should fail)

### 7. Installer Staff Performance Restrictions
- ✓ Installers cannot view staff performance metrics
- ✓ Only admin, account_manager, and field_rep can view staff performance

### 8. Installer Survey Status Restrictions
- ✓ Installers cannot update survey status
- ✓ Only admin, account_manager, and field_rep can update survey status

## Troubleshooting

### Test Fails: "function get_solar_leads() does not exist"

**Cause:** The `get_solar_leads` function hasn't been created.

**Fix:** Check if `sql/create_leads_rpc_functions.sql` has been executed. This file should have been run during initial setup.

### Test Fails: "Lead not found or access denied"

**Cause:** Test data wasn't set up correctly or IDs don't match.

**Fix:** Re-run the test data setup script:
```bash
supabase db execute --file sql/tests/000_setup_test_data.sql
```

Verify test data exists:
```sql
SELECT id, "Customer_Name", "Field_Rep", "Installer"
FROM solar.solar_leads
WHERE id IN (1, 2, 3, 4, 5);
```

### Tests Show "Success. No rows returned"

**Cause:** This is actually a PASS! It means the function correctly returned NULL (access denied) and no exception was raised.

**Explanation:** Tests 2, 5, 7, and 8 validate that certain operations are blocked. When access is correctly denied, the function returns NULL and the test passes silently.

### Migration 003 Fails: "function name is not unique"

**Cause:** Old versions of `get_staff_performance` or `get_metrics_trend` exist.

**Fix:** The migration file includes a "nuclear option" DO block that drops all versions. If it still fails, manually drop:
```sql
DROP FUNCTION IF EXISTS get_staff_performance CASCADE;
DROP FUNCTION IF EXISTS get_metrics_trend CASCADE;
```

Then re-run migration 003.

## Integration with Manual Testing

These automated tests cover database-level security. For comprehensive testing, also complete:

- **Manual UI Testing**: Use `/SECURITY-TESTING-CHECKLIST.md` for frontend testing
- **API Testing**: Test all 7 API endpoints with different user roles
- **Real User Testing**: Have actual users test with their accounts

## Test Data Isolation

Test data uses:
- Specific email pattern: `%test-rbac%`
- Specific lead IDs: 1, 2, 3, 4, 5
- Non-conflicting UUIDs starting with `00000000-0000-0000-0000-000000000XXX`

This ensures test data doesn't interfere with production data.

## About Test User IDs and Foreign Keys

### Why We Disable the Foreign Key Constraint

The `user_profiles.id` column has a foreign key constraint to `auth.users(id)`. In production, users are created through Supabase Auth, which automatically creates entries in `auth.users` and returns real UUIDs.

For testing, we use controlled UUIDs (like `00000000-0000-0000-0000-000000000001`) that don't exist in `auth.users`. This is intentional because:

1. **Test Isolation**: Test UUIDs are deterministic and don't interfere with real users
2. **No Auth System Dependency**: Tests don't require Supabase Auth to be fully operational
3. **RBAC Focus**: Security tests validate RPC function logic, not auth system integrity
4. **Easy Cleanup**: Test UUIDs make it trivial to identify and remove test data

### Constraint Status During Tests

- **Setup**: `user_profiles_id_fkey` constraint is dropped
- **Tests Run**: Constraint remains disabled
- **Cleanup**: Attempts to re-enable (may fail if other invalid IDs exist)

**In production deployments**, the constraint remains enabled at all times.

### Creating Real Test Users (Advanced)

If you need tests with real auth users:

1. Create auth users via Supabase Dashboard or CLI:
   ```bash
   supabase auth:signup --email test@example.com --password test123!
   ```

2. Get their UUIDs:
   ```sql
   SELECT id, email FROM auth.users WHERE email LIKE '%test%';
   ```

3. Update test data script with real UUIDs

4. Don't drop the FK constraint in test setup

### Trade-offs

**Why this is safe:**
- Test data is isolated (distinct UUID pattern, email pattern)
- RBAC tests focus on RPC function authorization logic, not auth integrity
- Production maintains the FK constraint
- Cleanup removes all test data

**Why this approach:**
- No dependency on Supabase Auth for running tests
- Deterministic test data (same UUIDs every run)
- Faster test setup (no auth API calls)
- Simpler cleanup (pattern-based deletion)

## CI/CD Integration

To run tests in CI/CD:

```bash
# Setup
supabase db execute --file sql/tests/000_setup_test_data.sql

# Run tests (fail on any error)
supabase db execute --file sql/tests/rbac_security_tests.sql

# Cleanup
supabase db execute --file sql/tests/999_cleanup_test_data.sql
```

Exit code will be non-zero if any test fails.

## Related Documentation

- `/SECURITY-TESTING-CHECKLIST.md` - Comprehensive 109-point manual testing checklist
- `/sql/migrations/` - RBAC migration files
- `/sql/create_leads_rpc_functions.sql` - Core RPC function definitions

## Questions?

If tests are failing unexpectedly:

1. Check that all 3 migrations have been applied
2. Verify test data exists (run verification queries above)
3. Check for function signature mismatches (migration 003 issue)
4. Review error messages carefully - they indicate exactly what failed

## Success Criteria

All 8 tests must show "✓ PASS" messages. Any "✗ FAIL" or SQL errors indicate security vulnerabilities that must be fixed before production deployment.
