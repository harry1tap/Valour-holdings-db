# Deployment & Implementation Guide
## Valour Holdings Solar Lead Management Dashboard

**Version:** 1.0  
**Date:** January 8, 2026  
**Target:** Production-ready deployment on Vercel + Supabase

---

## 1. Implementation Overview

### 1.1 Project Setup

**Initialize Next.js Project:**
```bash
npx create-next-app@latest valour-dashboard --typescript --tailwind --app --src-dir
cd valour-dashboard
```

**Install Core Dependencies:**
```bash
# Supabase client
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs

# UI Components
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-select
npm install class-variance-authority clsx tailwind-merge
npm install lucide-react

# Charts
npm install recharts

# Forms & Validation
npm install react-hook-form zod @hookform/resolvers

# Date handling
npm install date-fns

# State management
npm install @tanstack/react-query

# Development
npm install -D @types/node @types/react typescript
```

### 1.2 Project Structure

```
valour-dashboard/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   └── login/
│   │   ├── (dashboard)/
│   │   │   ├── dashboard/
│   │   │   ├── leads/
│   │   │   ├── team/
│   │   │   └── settings/
│   │   ├── api/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── ui/
│   │   ├── dashboard/
│   │   ├── leads/
│   │   └── layout/
│   ├── lib/
│   │   ├── supabase/
│   │   ├── hooks/
│   │   ├── utils/
│   │   └── validations/
│   └── types/
├── public/
├── supabase/
│   └── migrations/
├── .env.local
├── middleware.ts
├── next.config.js
├── tailwind.config.js
└── tsconfig.json
```

---

## 2. Supabase Setup

### 2.1 Create Supabase Project

1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Name: `valour-dashboard`
4. Database Password: Generate strong password
5. Region: Choose closest to UK
6. Click "Create Project"

### 2.2 Get Supabase Credentials

From Project Settings → API:
- `Project URL` → NEXT_PUBLIC_SUPABASE_URL
- `anon public` key → NEXT_PUBLIC_SUPABASE_ANON_KEY
- `service_role` key → SUPABASE_SERVICE_ROLE_KEY (keep secret!)

### 2.3 Run Database Migrations

**Option A: Supabase CLI**
```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref YOUR_PROJECT_REF

# Run migrations
supabase db push
```

**Option B: SQL Editor in Supabase Dashboard**
1. Open SQL Editor
2. Copy/paste each migration file (from docs/03-Database-Schema.md)
3. Run in order:
   - 20260108000001_create_user_profiles.sql
   - 20260108000002_add_solar_leads_indexes.sql
   - 20260108000003_enable_rls_policies.sql
   - 20260108000004_create_database_functions.sql

### 2.4 Configure Auth Settings

In Supabase Dashboard → Authentication → Settings:
- **Site URL:** `http://localhost:3000` (development)
- **Redirect URLs:** Add:
  - `http://localhost:3000/auth/callback`
  - `https://your-domain.com/auth/callback` (production)
- **Email Auth:** Enabled
- **Confirm Email:** Enabled
- **JWT Expiry:** 3600 seconds (1 hour)
- **Refresh Token Expiry:** 86400 seconds (24 hours)

---

## 3. Environment Variables

### 3.1 Create .env.local

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc... # NEVER expose to client!

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3.2 Vercel Environment Variables

When deploying to Vercel, add these in:
Project Settings → Environment Variables

**All Environments:**
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY

**Production Only:**
- SUPABASE_SERVICE_ROLE_KEY
- NEXT_PUBLIC_APP_URL (your production domain)

---

## 4. Implementation Phases

### Phase 1: Authentication & Layout (Week 1)

**Tasks:**
- [ ] Set up Supabase client configuration
- [ ] Create authentication middleware
- [ ] Build login page
- [ ] Create AppShell layout (Header + Sidebar)
- [ ] Implement ProtectedRoute wrapper
- [ ] Create useAuth hook
- [ ] Test login/logout flow

**Deliverables:**
- Users can log in
- Protected routes redirect to login
- Layout renders correctly

### Phase 2: Dashboard Metrics (Week 2)

**Tasks:**
- [ ] Create MetricCard component
- [ ] Build DateRangeFilter component
- [ ] Implement dashboard metrics queries
- [ ] Add real-time subscriptions
- [ ] Create chart components (Line, Bar, Donut)
- [ ] Implement role-based filtering
- [ ] Add loading states

**Deliverables:**
- Dashboard shows correct metrics per role
- Date filtering works
- Real-time updates functional

### Phase 3: Lead Management (Week 3)

**Tasks:**
- [ ] Build LeadTable component
- [ ] Implement search functionality
- [ ] Add filter dropdowns
- [ ] Create LeadDetailModal
- [ ] Build expandable Notes section
- [ ] Implement pagination
- [ ] Add real-time lead updates

**Deliverables:**
- Lead table with search/filter
- Lead details modal works
- Pagination functional

### Phase 4: Team Performance & Admin (Week 4)

**Tasks:**
- [ ] Build team performance page
- [ ] Create staff comparison charts
- [ ] Build settings page (admin)
- [ ] Implement user management CRUD
- [ ] Add audit log viewer
- [ ] Create admin edit lead functionality

**Deliverables:**
- Team page shows staff metrics
- Admin can manage users
- Admin can edit leads

### Phase 5: Polish & Testing (Week 5)

**Tasks:**
- [ ] Implement all loading states
- [ ] Add error boundaries
- [ ] Complete mobile responsive design
- [ ] Test all user flows
- [ ] Accessibility audit
- [ ] Performance optimization
- [ ] Security audit
- [ ] Documentation

**Deliverables:**
- All features complete
- No critical bugs
- Accessible and performant

---

## 5. Development Workflow

### 5.1 Local Development

```bash
# Start development server
npm run dev

# Open http://localhost:3000
```

### 5.2 Code Quality

**ESLint Configuration:**
```json
{
  "extends": ["next/core-web-vitals", "next/typescript"],
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unused-vars": "warn"
  }
}
```

**Run linting:**
```bash
npm run lint
```

### 5.3 Testing Strategy

**Unit Tests (Optional but Recommended):**
```bash
# Install Vitest
npm install -D vitest @testing-library/react @testing-library/jest-dom

# Run tests
npm run test
```

**Manual Testing Checklist:**
- [ ] Login as each role (Admin, AM, FR)
- [ ] Verify data filtering per role
- [ ] Test all date range filters
- [ ] Search and filter leads
- [ ] Open lead details
- [ ] Edit lead (admin)
- [ ] Create user (admin)
- [ ] Test real-time updates
- [ ] Test on mobile device
- [ ] Test keyboard navigation

---

## 6. Vercel Deployment

### 6.1 Connect Repository

1. Push code to GitHub
2. Go to https://vercel.com/new
3. Import your repository
4. Vercel auto-detects Next.js

### 6.2 Configure Build Settings

**Framework Preset:** Next.js
**Build Command:** `next build`
**Output Directory:** `.next`
**Install Command:** `npm install`

### 6.3 Add Environment Variables

In Vercel Dashboard → Settings → Environment Variables:
- Add all variables from .env.local
- Set appropriate values for production
- Mark SUPABASE_SERVICE_ROLE_KEY as sensitive

### 6.4 Deploy

```bash
# Deploy to production
git push origin main

# Vercel auto-deploys
# Monitor at https://vercel.com/dashboard
```

### 6.5 Custom Domain

1. In Vercel: Settings → Domains
2. Add domain: `dashboard.valourholdings.com`
3. Configure DNS (Vercel provides instructions)
4. SSL automatically provisioned

---

## 7. Post-Deployment

### 7.1 Create First Admin User

**Option A: Supabase Dashboard**
1. Go to Authentication → Users
2. Click "Add User"
3. Email: admin@valourholdings.com
4. Auto-generated password (send to user)
5. Go to SQL Editor:
```sql
INSERT INTO public.user_profiles (id, email, full_name, role)
VALUES (
  'COPY_USER_UUID_FROM_AUTH_USERS',
  'admin@valourholdings.com',
  'Admin User',
  'admin'
);
```

**Option B: API (recommended for multiple users)**
```bash
# Use Supabase REST API or create admin endpoint
```

### 7.2 Create Other Users

Admin can now create users through the dashboard UI.

### 7.3 Verify Security

- [ ] RLS policies active (test by querying as different users)
- [ ] Service role key not exposed
- [ ] HTTPS enabled
- [ ] CORS configured
- [ ] Rate limiting functional

---

## 8. Monitoring & Maintenance

### 8.1 Monitoring Tools

**Vercel Analytics:**
- Automatic, included free
- Monitor: Performance, errors, usage

**Supabase Dashboard:**
- Database performance
- API usage
- Auth metrics
- Realtime connections

### 8.2 Key Metrics to Track

**Performance:**
- Page load times
- API response times
- Database query performance
- Real-time connection stability

**Usage:**
- Active users
- Queries per day
- Database size growth
- Bandwidth usage

**Errors:**
- Failed auth attempts
- Database errors
- API errors
- Client-side errors

### 8.3 Regular Maintenance

**Weekly:**
- Check error logs
- Monitor performance metrics
- Review user feedback

**Monthly:**
- Update dependencies
- Review database size
- Check for slow queries
- Security patches

**Quarterly:**
- Full security audit
- Performance optimization review
- User access review (remove inactive)

---

## 9. Backup & Recovery

### 9.1 Database Backups

**Supabase Automatic:**
- Daily backups (retained 7 days on Free tier)
- Point-in-time recovery available
- No action needed

**Manual Backup:**
```bash
# Export database
pg_dump -h db.xxxxx.supabase.co -U postgres > backup.sql

# Schedule weekly exports to secure storage
```

### 9.2 Code Backups

- Code in GitHub (primary)
- Vercel maintains deployment history
- Critical: Maintain .env.local backup securely

### 9.3 Recovery Procedures

**Database Recovery:**
1. Go to Supabase Dashboard → Database → Backups
2. Select restore point
3. Click "Restore"

**Application Recovery:**
1. Revert to previous Git commit
2. Redeploy via Vercel
3. Or restore from Vercel deployment history

---

## 10. Security Checklist

### 10.1 Pre-Launch Security Audit

- [ ] All RLS policies enabled and tested
- [ ] Service role key never in client code
- [ ] Environment variables properly set
- [ ] HTTPS enforced
- [ ] Security headers configured
- [ ] CORS properly configured
- [ ] Rate limiting active
- [ ] SQL injection tests passed
- [ ] XSS prevention verified
- [ ] CSRF protection enabled
- [ ] Input validation everywhere
- [ ] Error messages don't leak info

### 10.2 Ongoing Security

- [ ] Monthly security updates
- [ ] Review access logs
- [ ] Monitor failed login attempts
- [ ] Audit user permissions
- [ ] Check for dependency vulnerabilities

---

## 11. Troubleshooting

### 11.1 Common Issues

**Issue: "No data showing for Account Manager"**
- Check: full_name in user_profiles matches Account_Manager in solar_leads exactly
- Case-sensitive match required

**Issue: "Real-time not working"**
- Check: Supabase Realtime enabled in project
- Check: Browser WebSocket not blocked
- Fallback to polling if WebSocket fails

**Issue: "Cannot create user"**
- Check: Admin user logged in
- Check: Supabase auth email templates configured
- Check: Email sending working

**Issue: "Slow dashboard loading"**
- Check: Database indexes created
- Check: Queries optimized
- Check: Connection pooling enabled
- Consider: Materialized views for large datasets

### 11.2 Debug Commands

```bash
# Check Next.js build
npm run build

# Check environment variables
echo $NEXT_PUBLIC_SUPABASE_URL

# Test Supabase connection
curl -X POST 'YOUR_SUPABASE_URL/rest/v1/rpc/get_user_role' \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_JWT"

# Check RLS policies
# Run in Supabase SQL Editor
SELECT * FROM pg_policies WHERE tablename = 'solar_leads';
```

---

## 12. Performance Optimization

### 12.1 Database Optimization

```sql
-- Analyze query performance
EXPLAIN ANALYZE
SELECT * FROM solar.solar_leads 
WHERE "Created_At" >= NOW() - INTERVAL '30 days';

-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
WHERE schemaname = 'solar'
ORDER BY idx_scan ASC;

-- Vacuum (if needed)
VACUUM ANALYZE solar.solar_leads;
```

### 12.2 Application Optimization

- Enable Next.js caching
- Use React Query for data caching
- Lazy load charts and heavy components
- Implement virtual scrolling for large tables
- Optimize images (if any)
- Code splitting per route

---

## 13. Scaling Considerations

### 13.1 Current Capacity

**Free Tier Limits:**
- Supabase: 500MB database, 2GB bandwidth, 50MB file storage
- Vercel: 100GB bandwidth, 100 builds/month

**Expected Usage:**
- 25 concurrent users
- 200 leads/month
- ~10,000 API requests/day

**Verdict:** Free tiers sufficient for 6-12 months

### 13.2 Upgrade Path

**When to upgrade:**
- Database > 400MB
- Bandwidth > 1.5GB/month
- Need point-in-time recovery
- Need more than 7-day backups

**Upgrade to:**
- Supabase Pro: $25/month (8GB database, 250GB bandwidth)
- Vercel Pro: $20/month (1TB bandwidth, advanced analytics)

### 13.3 Future Scaling

**If reaching 50+ users or 1000+ leads/month:**
- Implement read replicas
- Add database connection pooling (PgBouncer)
- Consider CDN for static assets
- Implement query result caching
- Use materialized views for heavy aggregations

---

## 14. Documentation for Users

### 14.1 Admin Guide

Create a simple guide covering:
- How to log in
- How to create users
- How to assign roles
- How to edit leads
- How to use date filters
- How to export data

### 14.2 User Guide

For Account Managers and Field Reps:
- How to log in
- How to view their dashboard
- How to search leads
- How to view lead details
- How to interpret metrics

### 14.3 FAQ

**Q: Why can't I see all leads?**
A: You only see leads assigned to you. Contact admin if incorrect.

**Q: How often does data update?**
A: Real-time - updates appear within 2 seconds.

**Q: Can I export data?**
A: Only admins can export. Contact your admin.

**Q: Who can edit leads?**
A: Only admins can edit lead data.

---

## 15. Launch Checklist

### 15.1 Pre-Launch

- [ ] All features implemented
- [ ] All tests passed
- [ ] Security audit completed
- [ ] Performance benchmarks met
- [ ] Documentation complete
- [ ] Admin user created
- [ ] All users created
- [ ] Training materials prepared
- [ ] Support process defined

### 15.2 Launch Day

- [ ] Deploy to production
- [ ] Verify all environment variables
- [ ] Test login for all roles
- [ ] Verify data loading correctly
- [ ] Confirm real-time working
- [ ] Send login credentials to users
- [ ] Monitor error logs
- [ ] Be available for support

### 15.3 Post-Launch (Week 1)

- [ ] Monitor daily for errors
- [ ] Collect user feedback
- [ ] Fix critical bugs immediately
- [ ] Document common issues
- [ ] Optimize based on real usage

---

## 16. Success Criteria

### 16.1 Technical Success

- [ ] Uptime > 99.9%
- [ ] Page load < 2 seconds
- [ ] Zero security incidents
- [ ] Real-time working reliably
- [ ] Mobile responsive

### 16.2 User Success

- [ ] Users can log in without help
- [ ] Users understand their dashboard
- [ ] Users can find leads easily
- [ ] Admins can manage system
- [ ] Positive user feedback

### 16.3 Business Success

- [ ] All 12 metrics displaying correctly
- [ ] Data accuracy verified
- [ ] Users trust the data
- [ ] Time saved vs manual reporting
- [ ] Decision-making improved

---

**Document Status:** ✅ Ready for Implementation  
**Deployment Target:** Production (Vercel + Supabase)  
**Timeline:** 5 weeks to production-ready

**Next Steps:**
1. Review all 6 documentation files
2. Begin Phase 1 implementation with Claude Code
3. Follow deployment guide for launch
