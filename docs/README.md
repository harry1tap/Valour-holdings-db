# Valour Holdings Solar Lead Management Dashboard
## Complete Documentation Package for Claude Code Implementation

**Version:** 1.0  
**Date:** January 8, 2026  
**Status:** Ready for Production Implementation

---

## 📋 Documentation Overview

This package contains complete, production-ready specifications for building the Valour Holdings Solar Lead Management Dashboard using Claude Code, Next.js, Supabase, and Vercel.

### What's Included

1. **PRD (Product Requirements Document)** - Complete business and functional requirements
2. **Technical Architecture** - System design, tech stack, and implementation approach  
3. **Database Schema** - Complete database design with RLS policies and migrations
4. **Authentication & Authorization** - Security specifications and user management
5. **UI/UX Requirements** - Complete design specifications and component library
6. **Deployment Guide** - Step-by-step deployment and maintenance procedures

---

## 🎯 Project Summary

### Purpose
A real-time analytics and operations dashboard for tracking solar installation leads from initial contact through to paid installation, with role-based access for Admins, Account Managers, and Field Representatives.

### Key Features
- **12 Core Metrics:** Real-time tracking of leads, surveys, conversions, and costs
- **Role-Based Access:** Three user roles with appropriate data filtering
- **Real-Time Updates:** Live data synchronization via Supabase Realtime
- **Multi-User Dashboard:** Support for 10-25 concurrent users
- **Date Range Filtering:** This Month, Last Month, Last Quarter, Last Year, Custom
- **Lead Management:** Search, filter, view details, with expandable Notes
- **Team Performance:** Staff-level metrics and comparisons
- **Mobile Responsive:** Works on desktop, tablet, and mobile devices

### Tech Stack
- **Frontend:** Next.js 14+ (App Router), React 18+, TypeScript, Tailwind CSS
- **UI Components:** shadcn/ui + Radix UI
- **Backend:** Next.js API Routes, Supabase PostgreSQL
- **Authentication:** Supabase Auth with Row-Level Security
- **Real-Time:** Supabase Realtime (WebSocket)
- **Hosting:** Vercel (frontend) + Supabase Cloud (backend)
- **Charts:** Recharts
- **State Management:** React Query

---

## 🗂 File Structure

```
valour-dashboard-docs/
├── README.md (this file)
├── 01-PRD-Product-Requirements.md
├── 02-Technical-Architecture.md
├── 03-Database-Schema.md
├── 04-Authentication-Authorization.md
├── 05-UI-UX-Requirements.md
└── 06-Deployment-Implementation-Guide.md
```

---

## 🚀 Quick Start for Claude Code

### Step 1: Review Documentation
Read documents in order (01 through 06) to understand:
- Business requirements
- Technical architecture
- Database design
- Security model
- UI/UX specifications
- Deployment process

### Step 2: Set Up Project

```bash
# Initialize Next.js project
npx create-next-app@latest valour-dashboard --typescript --tailwind --app --src-dir

# Install dependencies (see 06-Deployment-Guide for full list)
cd valour-dashboard
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
# ... other dependencies
```

### Step 3: Configure Supabase

1. Create Supabase project at https://supabase.com
2. Run database migrations from `03-Database-Schema.md`
3. Add environment variables to `.env.local`

### Step 4: Build in Phases

Follow the 5-week implementation plan in `06-Deployment-Guide.md`:
- Week 1: Authentication & Layout
- Week 2: Dashboard Metrics
- Week 3: Lead Management
- Week 4: Team Performance & Admin
- Week 5: Polish & Testing

### Step 5: Deploy to Vercel

1. Push code to GitHub
2. Import to Vercel
3. Add environment variables
4. Deploy

---

## 📊 Key Metrics to Track

The dashboard displays these 12 core metrics:

### Company-Wide Metrics
1. Total Number of Leads
2. Total Number of Surveys Booked
3. Total Number of Good Surveys
4. Total Number of Bad Surveys
5. Total Number of Sold Surveys
6. Conversion Rate: Leads to Survey Booked
7. Conversion Rate: Leads to Sold Surveys
8. Cost Per Lead

### Per-Staff Member Metrics
9. Total Leads per Staff Member
10. Good Surveys per Staff Member
11. Bad Surveys per Staff Member
12. Sold Surveys per Staff Member

---

## 👥 User Roles & Permissions

### Admin
- ✅ View all company-wide data
- ✅ View all team performance
- ✅ Edit lead data
- ✅ Create/edit/delete users
- ✅ Access audit logs

### Account Manager
- ✅ View their assigned leads only
- ✅ View their Field Reps' performance
- ✅ Search and filter their leads
- ❌ Cannot edit data
- ❌ Cannot manage users

### Field Representative
- ✅ View their assigned leads only
- ✅ View their personal performance
- ✅ Search and filter their leads
- ❌ Cannot edit data
- ❌ Cannot manage users
- ❌ Cannot view team data

---

## 🗄 Database Information

### Existing Database
- **Platform:** Supabase PostgreSQL
- **Schema:** `solar`
- **Table:** `solar_leads` (existing, do not modify)

### New Tables Required
- `public.user_profiles` - User role and metadata
- `public.audit_log` - Admin action tracking (optional)

### Security
- Row-Level Security (RLS) policies enforce data isolation
- Each role sees only their assigned data
- Admin has full access

**Important:** All RLS policies are defined in `03-Database-Schema.md`

---

## 🎨 Design Specifications

### Color Palette
- **Primary:** #0066CC (blue)
- **Success:** #10B981 (green) - Good Surveys
- **Danger:** #EF4444 (red) - Bad Surveys
- **Warning:** #F59E0B (amber)
- **Neutral:** Grays 50-900

### Typography
- **Font:** System UI Stack
- **Metric Values:** 48px Bold
- **Body Text:** 16px Regular
- **Small Text:** 14px Regular

### Layout
- **Header:** 64px fixed
- **Sidebar:** 240px (collapsible on mobile)
- **Content:** Max-width 1600px
- **Grid:** 3-column on desktop, 1-column on mobile

### Components
- MetricCard (with trend indicators)
- DateRangeFilter (sticky)
- LeadTable (sortable, searchable)
- LeadDetailModal (expandable sections)
- Charts (Line, Bar, Donut)

Full specifications in `05-UI-UX-Requirements.md`

---

## 🔒 Security Features

### Authentication
- Email/password via Supabase Auth
- JWT tokens in httpOnly cookies
- 24-hour session duration
- Password requirements enforced

### Authorization
- Three-layer security model:
  1. Middleware (route protection)
  2. Database RLS (data isolation)
  3. Component UI (hide unauthorized features)

### Data Protection
- Row-Level Security on all tables
- Service role key never exposed to client
- HTTPS enforced in production
- Rate limiting on API endpoints
- Audit logging for admin actions

---

## ⚡ Performance Targets

- **First Paint:** < 1.5 seconds
- **Time to Interactive:** < 3 seconds
- **Dashboard Load:** < 2 seconds
- **Real-Time Updates:** < 2 seconds latency
- **Bundle Size:** < 300KB gzipped

### Optimization Strategies
- Code splitting per route
- React Query caching (5 minutes)
- Database indexes on all filtered fields
- Lazy load charts
- Server-side rendering for initial data

---

## 📱 Mobile Support

### Responsive Design
- **Desktop:** Full layout with sidebar
- **Tablet:** Collapsible sidebar, 2-column grid
- **Mobile:** Hamburger menu, single column, card layout

### Mobile-Specific Features
- Touch-friendly targets (44x44px minimum)
- Swipe gestures for actions
- Pull to refresh
- Optimized charts for small screens

---

## 🧪 Testing Requirements

### Manual Testing Checklist
- [ ] Login as Admin, Account Manager, Field Rep
- [ ] Verify correct data filtering per role
- [ ] Test all date range filters
- [ ] Search and filter leads
- [ ] Open lead detail modal
- [ ] Test real-time updates (open in 2 browsers)
- [ ] Edit lead (Admin only)
- [ ] Create/delete user (Admin only)
- [ ] Test on mobile device
- [ ] Keyboard navigation
- [ ] Screen reader compatibility

### Automated Testing (Optional)
- Unit tests for utility functions
- Integration tests for API routes
- E2E tests for critical flows (Playwright)

---

## 📈 Success Metrics

### Technical Success
- Uptime > 99.9%
- Page load < 2 seconds
- Zero security incidents
- All 12 metrics accurate
- Real-time updates < 2 seconds

### User Success
- Users can log in independently
- Users understand their dashboard
- Users can find information quickly
- Positive user feedback
- Reduced time for reporting

### Business Success
- Data-driven decision making improved
- Lead tracking automated
- Team performance visible
- Cost tracking accurate
- ROI on development positive

---

## 🛠 Maintenance & Support

### Regular Maintenance
- **Weekly:** Monitor error logs, check performance
- **Monthly:** Update dependencies, review database size
- **Quarterly:** Security audit, performance optimization

### Backup Strategy
- **Database:** Automatic daily backups (Supabase)
- **Code:** Version control (GitHub)
- **Environment:** Secure .env backup

### Monitoring Tools
- Vercel Analytics (automatic)
- Supabase Dashboard (database metrics)
- Error logging (built-in)

---

## 🔄 Scaling Considerations

### Current Capacity (Free Tiers)
- 25 concurrent users
- 200 leads per month
- 500MB database
- 2GB bandwidth

### When to Upgrade
- Database > 400MB
- Users > 50 concurrent
- Leads > 1000 per month
- Need advanced analytics

### Upgrade Path
- Supabase Pro: $25/month (8GB database)
- Vercel Pro: $20/month (1TB bandwidth)

---

## 📞 Support & Resources

### Documentation
- Supabase: https://supabase.com/docs
- Next.js: https://nextjs.org/docs
- Vercel: https://vercel.com/docs
- shadcn/ui: https://ui.shadcn.com

### Community
- Supabase Discord: https://discord.supabase.com
- Next.js Discord: https://nextjs.org/discord

### Troubleshooting
See section 11 in `06-Deployment-Guide.md` for common issues and solutions.

---

## ✅ Implementation Checklist

### Pre-Development
- [ ] Read all documentation (01-06)
- [ ] Understand business requirements
- [ ] Review database schema
- [ ] Understand security model
- [ ] Review UI/UX specifications

### Phase 1: Setup (Week 1)
- [ ] Create Next.js project
- [ ] Install dependencies
- [ ] Create Supabase project
- [ ] Run database migrations
- [ ] Configure environment variables
- [ ] Set up authentication
- [ ] Build basic layout

### Phase 2: Core Features (Weeks 2-4)
- [ ] Build dashboard with metrics
- [ ] Implement date filtering
- [ ] Create lead table
- [ ] Add lead detail modal
- [ ] Build team performance page
- [ ] Implement admin features
- [ ] Add real-time updates

### Phase 3: Polish (Week 5)
- [ ] Complete all loading states
- [ ] Mobile responsive design
- [ ] Accessibility improvements
- [ ] Performance optimization
- [ ] Security audit
- [ ] Testing
- [ ] Documentation

### Deployment
- [ ] Deploy to Vercel
- [ ] Configure custom domain
- [ ] Create admin user
- [ ] Create all users
- [ ] Verify production functionality
- [ ] Monitor for issues

---

## 🎓 Learning Resources

### For Claude Code
All specifications are self-contained in these documents. No external references needed.

### For Human Developers
If humans need to maintain this system:
- Next.js 14 App Router documentation
- Supabase Row-Level Security guide
- TypeScript handbook
- Tailwind CSS documentation
- React Query guide

---

## 📝 Notes for Claude Code

### Key Points
1. **Follow the documents in order** - Each builds on the previous
2. **Database schema is critical** - RLS policies enforce all security
3. **Real-time is essential** - Users expect instant updates
4. **Role-based filtering is mandatory** - Never show unauthorized data
5. **Mobile support required** - Test on multiple screen sizes
6. **Performance matters** - Dashboard must load quickly
7. **Accessibility required** - Keyboard navigation must work
8. **Error handling critical** - Never show blank screens

### What Makes This Project Unique
- Existing database that cannot be modified
- Three distinct user roles with different views
- Real-time updates critical for UX
- Strong security requirements (RLS)
- Performance requirements (2s load)
- Production-ready expectations from day 1

### Success Factors
- Accurate metric calculations
- Proper role-based filtering
- Reliable real-time updates
- Clean, professional UI
- Fast performance
- Secure implementation

---

## 🎯 Final Notes

This documentation package provides everything needed to build a production-ready dashboard. All business logic, technical specifications, database schemas, security policies, and UI designs are fully documented.

**The goal:** A professional, secure, fast dashboard that helps Valour Holdings track their solar installation leads effectively.

**Timeline:** 5 weeks from start to production deployment

**Team:** Claude Code + Developer + Stakeholder reviews

**Success:** When all 12 metrics display accurately in real-time with proper role-based access control, deployed to production with happy users.

---

**Document Package Status:** ✅ Complete and Ready  
**Last Updated:** January 8, 2026  
**Version:** 1.0

**Let's build this! 🚀**
