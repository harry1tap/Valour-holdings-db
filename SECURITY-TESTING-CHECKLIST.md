# Security Testing Checklist for RBAC Implementation

**Date:** 2026-01-10
**Purpose:** Comprehensive testing checklist for role-based access control (RBAC) before production rollout

---

## Pre-Deployment Checklist

- [ ] **Database Backup Created**
  - Full database backup saved
  - Backup restoration tested successfully
  - Backup stored in secure location

- [ ] **Staging Environment Ready**
  - Staging database populated with realistic test data
  - Test users created for each role (admin, account_manager, field_rep, installer)
  - Test data includes leads assigned to different users

- [ ] **SQL Migrations Reviewed**
  - All 3 migration files reviewed for correctness
  - No syntax errors detected
  - Rollback scripts prepared

---

## Phase 1: SQL Migrations Testing

### Migration 001 - Schema Changes
- [ ] Run migration 001 in staging
- [ ] Verify `organization` column added to `user_profiles`
- [ ] Verify installer role constraint updated
- [ ] Verify indexes created successfully
- [ ] Check for any error messages

### Migration 002 - RPC Functions
- [ ] Run migration 002 in staging
- [ ] All 6 functions dropped and recreated
- [ ] No errors during function creation
- [ ] GRANT statements executed successfully

### Migration 003 - New Functions
- [ ] Run migration 003 in staging
- [ ] `get_staff_performance` created
- [ ] `get_metrics_trend` created
- [ ] Functions accept correct parameters

---

## Phase 2: Automated SQL Security Tests

### Run SQL Test Suite
- [ ] Execute `sql/tests/rbac_security_tests.sql`
- [ ] All 8 tests pass successfully:
  - [ ] Test 1: Field Rep access restrictions
  - [ ] Test 2: Installer organization filtering
  - [ ] Test 3: Field Rep edit restrictions
  - [ ] Test 4: Installer edit restrictions
  - [ ] Test 5: Field Rep delete restrictions
  - [ ] Test 6: Account Manager financial field restrictions
  - [ ] Test 7: Installer staff performance restrictions
  - [ ] Test 8: Installer survey status restrictions

---

## Phase 3: Admin Role Testing (Full Access)

### Lead Management
- [ ] Can view all leads regardless of assignment
- [ ] Can create new leads
- [ ] Can edit all fields including financial fields
- [ ] Can delete any lead
- [ ] Can update survey status for any lead

### Metrics Access
- [ ] Can view dashboard metrics for all users
- [ ] Can view staff performance for all teams
- [ ] Can view metrics trends

### User Management
- [ ] Can create new users (all roles)
- [ ] Can edit existing users
- [ ] Can deactivate users
- [ ] Can assign installer organizations

---

## Phase 4: Account Manager Role Testing

### Lead Management
- [ ] Can view ONLY their assigned leads
- [ ] Cannot see leads assigned to other account managers
- [ ] Can create new leads
- [ ] Can edit non-financial fields on their leads
- [ ] **CANNOT** edit Lead_Cost, Lead_Revenue, Commission_Amount
- [ ] Can delete their own leads only
- [ ] Can update survey status for their leads

### Metrics Access
- [ ] Dashboard shows only their leads' metrics
- [ ] Staff performance shows only their team
- [ ] Metrics trend reflects only their data

### Unauthorized Access Attempts
- [ ] Cannot access `/api/users` endpoints (403 Forbidden)
- [ ] Cannot view other account managers' leads
- [ ] Cannot edit other account managers' leads

---

## Phase 5: Field Rep Role Testing

### Lead Management
- [ ] Can view ONLY their assigned leads
- [ ] Cannot see leads assigned to other field reps
- [ ] **CANNOT** create new leads (403 Forbidden)
- [ ] Can edit ONLY Notes and Installer_Notes fields
- [ ] **CANNOT** edit customer info, Status, or financial fields
- [ ] **CANNOT** delete any leads (403 Forbidden)
- [ ] Can update survey status for their leads

### Metrics Access
- [ ] Dashboard shows only their leads' metrics
- [ ] Staff performance shows only their own data
- [ ] Metrics trend reflects only their data

### Unauthorized Access Attempts
- [ ] Cannot access other field reps' leads (404 Not Found)
- [ ] Attempting to edit restricted fields returns error
- [ ] Attempting to create lead returns 403
- [ ] Attempting to delete lead returns 403

---

## Phase 6: Installer Role Testing

### Lead Management
- [ ] Can view ONLY leads where Installer = their organization
- [ ] Cannot see leads assigned to other organizations
- [ ] **CANNOT** create new leads (403 Forbidden)
- [ ] Can edit ONLY Installer_Notes field
- [ ] **CANNOT** edit Notes, customer info, Status, or any other field
- [ ] **CANNOT** delete any leads (403 Forbidden)
- [ ] **CANNOT** update survey status (403 Forbidden)

### Metrics Access
- [ ] Dashboard shows only their organization's leads metrics
- [ ] **CANNOT** view staff performance (403 Forbidden)
- [ ] Metrics trend reflects only their organization's data

### Unauthorized Access Attempts
- [ ] Cannot access other organizations' leads (404 Not Found)
- [ ] Attempting to edit Notes returns error
- [ ] Attempting to update survey status returns error
- [ ] Attempting to create lead returns 403

---

## Phase 7: API Endpoint Testing

### GET /api/leads/[id]
- [ ] Admin can access any lead
- [ ] Account Manager can access their leads only
- [ ] Field Rep can access their leads only
- [ ] Installer can access their organization's leads only
- [ ] Returns 404 for unauthorized access attempts

### PATCH /api/leads/[id]/status
- [ ] Admin can update any lead's survey status
- [ ] Account Manager can update their leads' survey status
- [ ] Field Rep can update their leads' survey status
- [ ] Installer CANNOT update survey status (error)

### POST /api/leads/create
- [ ] Admin can create leads
- [ ] Account Manager can create leads
- [ ] Field Rep CANNOT create leads (403)
- [ ] Installer CANNOT create leads (403)

### PUT /api/leads (Update)
- [ ] Admin can update all fields
- [ ] Account Manager cannot update financial fields
- [ ] Field Rep can only update Notes/Installer_Notes
- [ ] Installer can only update Installer_Notes

### DELETE /api/leads
- [ ] Admin can delete any lead
- [ ] Account Manager can delete their leads
- [ ] Field Rep CANNOT delete (403)
- [ ] Installer CANNOT delete (403)

### POST /api/metrics
- [ ] Admin sees all leads' metrics
- [ ] Account Manager sees their leads' metrics only
- [ ] Field Rep sees their leads' metrics only
- [ ] Installer sees their organization's leads metrics only

### POST /api/staff-performance
- [ ] Admin sees all staff performance
- [ ] Account Manager sees their team only
- [ ] Field Rep sees only their own performance
- [ ] Installer CANNOT access (403)

### POST /api/metrics-trend
- [ ] Admin sees all leads' trend data
- [ ] Account Manager sees their leads' trend only
- [ ] Field Rep sees their leads' trend only
- [ ] Installer sees their organization's leads trend only

---

## Phase 8: Frontend UI Testing

### Lead Detail Modal
- [ ] Edit button shows/hides based on role
- [ ] Field visibility matches role permissions
- [ ] Disabled fields for non-editable fields
- [ ] Delete button shows only for admin/account_manager

### Dashboard Metrics
- [ ] Metrics update in real-time
- [ ] Numbers match SQL query results
- [ ] Filtering works correctly per role
- [ ] No console errors

### Leads Table
- [ ] Real-time updates work
- [ ] Filtering respects role boundaries
- [ ] Search works correctly
- [ ] Pagination works

---

## Phase 9: Edge Cases & Security

### Data Leakage Tests
- [ ] Browser DevTools Network tab shows no unauthorized data
- [ ] API responses don't include other users' data
- [ ] Error messages don't reveal sensitive information

### SQL Injection Tests
- [ ] Special characters in search don't break queries: `'; DROP TABLE--`
- [ ] Unicode characters handled correctly
- [ ] Null bytes don't bypass filters

### Session & Auth Tests
- [ ] Logged out users redirected to login
- [ ] Session timeout works correctly
- [ ] Role changes require re-login
- [ ] Multiple browser windows/tabs maintain security

---

## Phase 10: Performance Testing

### Query Performance
- [ ] Dashboard loads in < 2 seconds
- [ ] Leads table loads in < 1 second
- [ ] Metrics calculation completes in < 500ms
- [ ] Real-time updates don't cause lag

### Concurrent Users
- [ ] 5 simultaneous users - no issues
- [ ] 10 simultaneous users - acceptable performance
- [ ] 15 simultaneous users - system stable

### Database Indexes
- [ ] `idx_user_profiles_organization` exists
- [ ] `idx_solar_leads_installer` exists
- [ ] EXPLAIN ANALYZE shows index usage

---

## Phase 11: User Acceptance Testing

### Create Test Users
- [ ] Create test admin: test-admin@company.com
- [ ] Create test account manager: test-am@company.com
- [ ] Create test field rep: test-fr@company.com
- [ ] Create test installer: test-installer@company.com

### User Feedback
- [ ] Admin completes workflow walkthrough
- [ ] Account Manager tests daily tasks
- [ ] Field Rep tests lead viewing/updating
- [ ] Installer tests their workflow

---

## Phase 12: Documentation & Training

- [ ] User roles guide created
- [ ] Permission matrix documented
- [ ] Training materials prepared
- [ ] Support team briefed on new roles

---

## Production Deployment Checklist

### Pre-Deployment
- [ ] All tests passed in staging
- [ ] Stakeholders approved rollout
- [ ] Maintenance window scheduled
- [ ] Users notified of downtime

### Deployment Steps
- [ ] Announce maintenance (15 minutes)
- [ ] Create production database backup
- [ ] Run migration 001
- [ ] Run migration 002
- [ ] Run migration 003
- [ ] Deploy updated code
- [ ] Restart application servers
- [ ] Run smoke tests

### Post-Deployment
- [ ] Verify admin login works
- [ ] Verify each role can login
- [ ] Monitor error logs for 1 hour
- [ ] Check for 403/404 spikes
- [ ] Verify metrics display correctly
- [ ] Collect user feedback

---

## Rollback Procedure (If Needed)

- [ ] Stop application
- [ ] Run rollback SQL script
- [ ] Restore code from previous version
- [ ] Restart application
- [ ] Restore database from backup (if needed)
- [ ] Verify rollback successful

---

## Success Criteria

All items must be checked before considering deployment successful:

- [ ] **Zero security violations** in testing
- [ ] **All 8 SQL tests pass** without errors
- [ ] **Zero unauthorized access** attempts succeed
- [ ] **Performance meets targets** (< 2s dashboard load)
- [ ] **User feedback is positive** from all 4 roles
- [ ] **No production errors** in first 24 hours

---

## Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Developer | | | |
| QA Lead | | | |
| Security Lead | | | |
| Product Owner | | | |

---

**Last Updated:** 2026-01-10
**Version:** 1.0
**Related Plan:** `/Users/harry/.claude/plans/partitioned-hopping-puddle.md`
