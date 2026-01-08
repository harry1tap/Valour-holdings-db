# Product Requirements Document (PRD)
## Valour Holdings Solar Lead Management Dashboard

**Version:** 1.0  
**Date:** January 8, 2026  
**Project Owner:** Valour Holdings  
**Document Purpose:** Production-ready specification for Claude Code implementation

---

## 1. Executive Summary

### 1.1 Product Overview
A real-time analytics and operations dashboard for Valour Holdings to track and manage solar installation leads through their complete lifecycle from initial contact to paid installation.

### 1.2 Business Objectives
- Provide real-time visibility into lead pipeline and conversion metrics
- Enable performance tracking at individual staff member level
- Support data-driven decision making through visual analytics
- Maintain granular access control based on organizational roles
- Track cost efficiency and ROI on lead generation

### 1.3 Target Users
- **Admins** (2-3 users): Full system access, user management, all data visibility
- **Account Managers** (5-10 users): View assigned leads and team performance
- **Field Representatives** (10-15 users): View personal performance and assigned leads

### 1.4 Success Metrics
- Dashboard loads within 2 seconds
- Real-time updates reflected within 2 seconds of database changes
- 99.9% uptime during business hours (9am-6pm GMT)
- Zero unauthorized data access incidents
- Support 25 concurrent users without performance degradation

---

## 2. User Stories & Requirements

### 2.1 Admin User Stories

**US-A01: Dashboard Analytics Overview**
- As an Admin, I want to see company-wide lead metrics so I can understand overall business performance
- Acceptance Criteria:
  - View all 12 key metrics listed in section 3.1
  - Default view shows "This Month" data
  - Metrics update in real-time as data changes
  - Visual charts/graphs for trend analysis

**US-A02: Date Range Filtering**
- As an Admin, I want to filter metrics by date ranges so I can analyze historical performance
- Acceptance Criteria:
  - Pre-set filters: This Month, Last Month, Last Quarter, Last Year
  - Custom date range selector (from date - to date)
  - All metrics and charts update based on selected range
  - Filter state persists during session

**US-A03: Team Performance View**
- As an Admin, I want to see performance metrics broken down by staff member
- Acceptance Criteria:
  - View metrics per Account Manager
  - View metrics per Field Rep
  - Compare performance across team members
  - Export capability for reporting

**US-A04: Lead Management**
- As an Admin, I want to view and manage all leads in the system
- Acceptance Criteria:
  - Searchable/filterable table of all leads
  - Update lead status and assignments
  - View individual lead details
  - Delete users (only Admins)

**US-A05: Lead Detail View**
- As an Admin, I want to expand any lead to see complete details
- Acceptance Criteria:
  - Click to view full lead information
  - See Notes field content
  - See Fall_Off_Reason and Fall_Off_Stage
  - View complete lead history/timeline

### 2.2 Account Manager User Stories

**US-AM01: Personal Dashboard**
- As an Account Manager, I want to see metrics for my assigned leads only
- Acceptance Criteria:
  - Dashboard shows only leads where Account_Manager = my name
  - Same metric structure as Admin view
  - Date range filtering available
  - Real-time updates for my leads

**US-AM02: Team Performance**
- As an Account Manager, I want to see performance of Field Reps assigned to me
- Acceptance Criteria:
  - View metrics for each of my Field Reps
  - Compare performance across my team
  - Drill down into individual Field Rep data

**US-AM03: Lead Visibility**
- As an Account Manager, I want to view details of my assigned leads
- Acceptance Criteria:
  - Search/filter my assigned leads
  - View lead details including Notes and Fall_Off_Reason
  - Read-only access (cannot edit)

### 2.3 Field Rep User Stories

**US-FR01: Personal Performance Dashboard**
- As a Field Rep, I want to see my individual performance metrics
- Acceptance Criteria:
  - Dashboard shows only leads where Field_Rep = my name
  - View my conversion rates and survey statistics
  - Date range filtering available
  - Real-time updates

**US-FR02: My Leads View**
- As a Field Rep, I want to view my assigned leads
- Acceptance Criteria:
  - See list of leads assigned to me
  - Search/filter my leads
  - View lead details including Notes
  - Read-only access

---

## 3. Functional Requirements

### 3.1 Dashboard Metrics (Priority: P0 - Critical)

All metrics must be calculated accurately and update in real-time:

#### Company-Wide Metrics
1. **Total Number of Leads**
   - Count of all records in solar_leads table
   - Filtered by date range on Created_At

2. **Total Number of Surveys Booked**
   - Count where Survey_Booked_Date IS NOT NULL
   - Filtered by date range on Survey_Booked_Date

3. **Total Number of Good Surveys**
   - Count where Survey_Status = 'Good Survey'
   - Filtered by date range on Survey_Complete_Date

4. **Total Number of Bad Surveys**
   - Count where Survey_Status = 'Bad Survey'
   - Filtered by date range on Survey_Complete_Date

5. **Total Number of Sold Surveys**
   - Count where Survey_Status = 'Sold Survey'
   - Filtered by date range on Survey_Complete_Date

6. **Conversion Rate: Leads to Survey Booked**
   - Formula: (Surveys Booked / Total Leads) × 100
   - Display as percentage with 2 decimal places

7. **Conversion Rate: Leads to Sold Surveys**
   - Formula: (Sold Surveys / Total Leads) × 100
   - Display as percentage with 2 decimal places

8. **Cost Per Lead**
   - Formula: SUM(Lead_Cost) / COUNT(Leads)
   - Display in GBP currency format

#### Per-Staff Member Metrics
9. **Total Number of Leads Per Staff Member**
   - Group by Field_Rep or Account_Manager
   - Count leads assigned to each

10. **Total Number of Good Surveys Per Staff Member**
    - Group by Field_Rep or Account_Manager
    - Count where Survey_Status = 'Good Survey'

11. **Total Number of Bad Surveys Per Staff Member**
    - Group by Field_Rep or Account_Manager
    - Count where Survey_Status = 'Bad Survey'

12. **Total Number of Sold Surveys Per Staff Member**
    - Group by Field_Rep or Account_Manager
    - Count where Survey_Status = 'Sold Survey'

### 3.2 Date Filtering (Priority: P0 - Critical)

**Default View:** "This Month" (current calendar month)

**Filter Options:**
- This Month (current month 1st to today)
- Last Month (previous calendar month)
- Last Quarter (previous 3-month quarter)
- Last Year (previous calendar year)
- Custom Range (user selects start and end date)

**Behavior:**
- Filter applies to all metrics and visualizations
- Date comparison based on Created_At for lead counts
- Date comparison based on specific date fields for conversion metrics
- Filter state persists in URL parameters for sharing

### 3.3 Data Visualization (Priority: P0 - Critical)

**Chart Types Required:**
- KPI Cards: Large number displays for each metric
- Line Charts: Trend over time for key metrics
- Bar Charts: Staff member comparisons
- Donut/Pie Charts: Survey status breakdown

**Interactivity:**
- Hover tooltips showing exact values
- Click to drill down into details
- Responsive design for all screen sizes

### 3.4 Lead Management (Priority: P0 - Critical)

**Lead Table View:**
- Paginated table (50 rows per page)
- Sortable columns
- Search across: Customer_Name, Postcode, Customer_Tel
- Filter by: Status, Survey_Status, Account_Manager, Field_Rep, Lead_Source

**Table Columns (Desktop):**
- Customer_Name
- Postcode
- Status
- Survey_Status
- Account_Manager
- Field_Rep
- Created_At
- Survey_Booked_Date
- Actions (View Details button)

**Lead Detail Modal/Page:**
- All fields from solar_leads table
- Expandable Notes section
- Fall_Off_Reason and Fall_Off_Stage prominent
- Timeline view of key dates
- Edit capability (Admin only)

### 3.5 Real-Time Updates (Priority: P0 - Critical)

**Requirements:**
- Use Supabase Realtime subscriptions
- Subscribe to changes on solar_leads table
- Update dashboard metrics within 2 seconds of database change
- Show user presence indicators (who's online - optional P1)
- Optimistic UI updates where appropriate

**Update Triggers:**
- New lead created
- Lead status changed
- Survey status updated
- Assignment changed

### 3.6 Authentication & Authorization (Priority: P0 - Critical)

**See separate Authentication Specification Document (04)**

**Key Requirements:**
- Email/password authentication via Supabase Auth
- Role-based access control (Admin, Account Manager, Field Rep)
- Row-level security (RLS) on Supabase
- Automatic user assignment based on email/name matching

---

## 4. Non-Functional Requirements

### 4.1 Performance
- Initial page load: < 2 seconds
- Dashboard metric updates: < 500ms
- Real-time data sync: < 2 seconds
- Support 25 concurrent users
- Database queries optimized with indexes

### 4.2 Security
- All data encrypted in transit (HTTPS)
- Data encrypted at rest (Supabase default)
- No PII exposed in URLs or logs
- Session timeout: 24 hours
- Failed login attempt limiting (5 attempts = 15 min lockout)

### 4.3 Reliability
- 99.9% uptime during business hours
- Automatic error logging
- Graceful degradation if real-time fails
- Database backups (Supabase managed)

### 4.4 Scalability
- Support up to 200 leads per month growth
- Support up to 50 concurrent users (future)
- Horizontal scaling via Vercel edge functions

### 4.5 Usability
- Mobile-responsive design (tablets and phones)
- Accessible (WCAG 2.1 AA compliance target)
- Loading states for all async operations
- Clear error messages for users
- Keyboard navigation support

### 4.6 Browser Support
- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest 2 versions)

---

## 5. User Interface Requirements

### 5.1 Layout Structure

**Top Navigation Bar:**
- Company logo/name
- User profile dropdown (name, role, logout)
- Real-time status indicator (optional)

**Sidebar Navigation:**
- Dashboard (home)
- Leads (table view)
- Team Performance (Admin/AM only)
- Settings (Admin only)

**Main Content Area:**
- Date range filter (sticky at top)
- KPI cards grid (responsive)
- Charts and visualizations
- Lead table/list

### 5.2 Color Scheme & Branding
- Primary: Professional blue (#0066CC or similar)
- Success: Green for positive metrics
- Warning: Amber for attention needed
- Danger: Red for negative metrics
- Neutral: Grays for backgrounds and text

### 5.3 Responsive Breakpoints
- Mobile: < 768px (single column, simplified metrics)
- Tablet: 768px - 1024px (2 column grid)
- Desktop: > 1024px (3-4 column grid)

---

## 6. Data Requirements

### 6.1 Data Source
- **Primary Database:** Supabase PostgreSQL
- **Schema:** solar.solar_leads table
- **See Database Schema Document (03) for complete structure**

### 6.2 Data Integrity
- All calculations must match raw database queries
- No data manipulation or filtering should occur client-side for security
- Use database functions/views for complex calculations
- Audit trail for Admin edits (track who changed what)

### 6.3 Data Refresh
- Real-time: Supabase Realtime subscriptions
- Fallback: Polling every 30 seconds if WebSocket fails
- Manual refresh button available

---

## 7. Integration Requirements

### 7.1 External Services
- **Supabase:** Database, Authentication, Real-time, Storage
- **Vercel:** Hosting, Edge Functions, Analytics

### 7.2 Webhook (Existing)
- Trigger: trigger_status_webhook on UPDATE
- Function: notify_status_change_solar()
- Action: Keep existing webhook functionality intact

---

## 8. Future Enhancements (Out of Scope for v1.0)

### Phase 2 Considerations:
- Email notifications for lead assignments
- Export to CSV/Excel
- Bulk lead import
- Mobile native apps
- Advanced reporting/dashboards
- Integration with CRM systems
- Lead scoring/prioritization
- Automated lead routing
- SMS notifications
- Commission calculation automation

---

## 9. Constraints & Assumptions

### 9.1 Constraints
- Budget: Optimize for Vercel free tier + Supabase free tier initially
- Timeline: Production-ready deployment target
- Team: Dashboard users, no technical team for maintenance
- Data: Existing solar_leads table structure must not be modified

### 9.2 Assumptions
- Average of 100-200 new leads per month
- 10-25 concurrent active users maximum
- UK-based users (GMT timezone)
- English language only
- Desktop primary usage, mobile secondary
- Users have modern browsers
- Stable internet connection

---

## 10. Acceptance Criteria (Definition of Done)

### 10.1 Feature Completeness
- [ ] All 12 dashboard metrics implemented and accurate
- [ ] Date filtering works correctly for all options
- [ ] Real-time updates functional
- [ ] Role-based access control enforced
- [ ] Lead table with search/filter operational
- [ ] Lead detail view with Notes/Fall-Off-Reason accessible

### 10.2 Quality Standards
- [ ] Zero console errors in production
- [ ] All user stories tested and verified
- [ ] Performance benchmarks met
- [ ] Security audit passed
- [ ] Cross-browser testing completed
- [ ] Mobile responsive testing completed

### 10.3 Documentation
- [ ] User guide for each role created
- [ ] Admin guide for user management
- [ ] Deployment documentation completed
- [ ] API documentation (if applicable)

### 10.4 Deployment Readiness
- [ ] Production environment configured
- [ ] Database migrations tested
- [ ] Backup and recovery tested
- [ ] Monitoring and alerts configured
- [ ] SSL certificates active
- [ ] Domain configured correctly

---

## 11. Risks & Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Real-time connection fails | High | Low | Implement polling fallback |
| User role assignment incorrect | High | Medium | Manual admin override capability |
| Data calculations inaccurate | Critical | Low | Comprehensive test suite with known data |
| Performance degradation with scale | Medium | Medium | Database indexing, query optimization |
| Unauthorized data access | Critical | Low | Row-level security, strict RLS policies |
| Supabase free tier limits exceeded | Medium | Low | Monitor usage, plan upgrade path |

---

## 12. Glossary

- **Lead:** Potential customer in the solar_leads table
- **Survey:** Site assessment for solar installation
- **Good Survey:** Survey with positive outcome (Survey_Status = 'Good Survey')
- **Bad Survey:** Survey with negative outcome (Survey_Status = 'Bad Survey')
- **Sold Survey:** Successfully converted survey (Survey_Status = 'Sold Survey')
- **Conversion Rate:** Percentage of leads that progress to next stage
- **Field Rep:** Sales representative conducting surveys
- **Account Manager:** Manager overseeing Field Reps
- **RLS:** Row-Level Security in Supabase/PostgreSQL

---

**Document Status:** ✅ Ready for Implementation  
**Next Steps:** Review Technical Architecture Document (02) and Database Schema (03)
