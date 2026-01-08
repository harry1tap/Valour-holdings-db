# Technical Architecture Document
## Valour Holdings Solar Lead Management Dashboard

**Version:** 1.0  
**Date:** January 8, 2026  
**Architecture Type:** Modern Full-Stack Web Application  
**Deployment:** Serverless (Vercel) + Database-as-a-Service (Supabase)

---

## 1. System Overview

### 1.1 Architecture Pattern
**Jamstack Architecture with Real-Time Capabilities**
- Static site generation (SSG) where possible
- Server-side rendering (SSR) for authenticated pages
- API routes for server-side logic
- WebSocket connections for real-time updates
- Edge functions for optimal performance

### 1.2 High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                         │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Next.js 14+ Application (App Router)                  │ │
│  │  - React 18+ Components                                │ │
│  │  - TailwindCSS + shadcn/ui                            │ │
│  │  - Recharts for visualizations                         │ │
│  │  - Real-time WebSocket client                          │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────┐
│                      APPLICATION LAYER                       │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Next.js API Routes & Server Actions                   │ │
│  │  - Authentication middleware                            │ │
│  │  - Authorization checks                                 │ │
│  │  - Data aggregation logic                              │ │
│  │  - Rate limiting                                        │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────┐
│                        DATA LAYER                            │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Supabase Platform                                      │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐  │ │
│  │  │ PostgreSQL   │  │ Auth Service │  │  Realtime   │  │ │
│  │  │   Database   │  │   (GoTrue)   │  │  (Phoenix)  │  │ │
│  │  └──────────────┘  └──────────────┘  └─────────────┘  │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Technology Stack

### 2.1 Frontend

#### Core Framework
- **Next.js 14+** (App Router)
  - Why: Server components, optimal performance, built-in API routes
  - Server-side rendering for authenticated pages
  - Static generation for public pages
  - File-based routing

#### UI Framework & Styling
- **React 18+**
  - Why: Industry standard, excellent ecosystem
  - Server Components for performance
  - Concurrent features for smooth UX

- **TypeScript 5+**
  - Why: Type safety, better DX, catch errors at compile time
  - Strict mode enabled
  - Path aliases configured

- **TailwindCSS 3+**
  - Why: Utility-first, fast development, small bundle size
  - Custom theme for Valour branding
  - Responsive design utilities

- **shadcn/ui**
  - Why: Accessible, customizable, copy-paste components
  - Built on Radix UI primitives
  - Components: Button, Card, Table, Dialog, Select, DatePicker, etc.

#### Data Visualization
- **Recharts**
  - Why: React-native charts, responsive, customizable
  - Line charts for trends
  - Bar charts for comparisons
  - Pie/Donut charts for breakdowns

#### Form Management
- **React Hook Form**
  - Why: Performant, easy validation, small bundle
  - Minimal re-renders
  - Zod schema validation

- **Zod**
  - Why: TypeScript-first schema validation
  - Reusable schemas across client/server
  - Type inference

#### State Management
- **React Context + Hooks**
  - Why: Built-in, sufficient for this app size
  - User context (auth state, role, name)
  - Date filter context (shared across components)

- **SWR or React Query**
  - Why: Data fetching, caching, revalidation
  - Automatic refetch on focus
  - Optimistic updates
  - **Recommendation: React Query for more control**

#### Real-Time Client
- **@supabase/supabase-js**
  - Built-in Realtime client
  - WebSocket management
  - Automatic reconnection

### 2.2 Backend

#### API Layer
- **Next.js API Routes**
  - RESTful endpoints for complex operations
  - Server Actions for mutations
  - Middleware for auth checks

#### Database
- **Supabase (PostgreSQL 15+)**
  - Why: Managed PostgreSQL, built-in auth, real-time subscriptions
  - Row-Level Security (RLS) for data protection
  - Automatic API generation
  - Connection pooling included

#### Authentication
- **Supabase Auth (GoTrue)**
  - Why: Integrated with database, secure, proven
  - Email/password authentication
  - JWT-based sessions
  - Built-in user management

#### Real-Time Engine
- **Supabase Realtime (Phoenix Framework)**
  - Why: Native integration with PostgreSQL
  - Low latency (<100ms)
  - Scales to thousands of connections
  - Automatic reconnection

### 2.3 Deployment & Infrastructure

#### Hosting
- **Vercel**
  - Why: Best Next.js hosting, global CDN, zero config
  - Edge network for low latency
  - Automatic SSL
  - Preview deployments
  - Analytics included

#### Database Hosting
- **Supabase Cloud**
  - Why: Managed PostgreSQL, automatic backups, monitoring
  - Free tier: 500MB database, 2GB bandwidth
  - Automatic backups daily
  - Point-in-time recovery

#### Domain & DNS
- **Vercel DNS** or existing provider
  - Custom domain: dashboard.valourholdings.com (example)
  - HTTPS/SSL automatic

### 2.4 Development Tools

#### Version Control
- **Git + GitHub**
  - Branch protection for main
  - Pull request workflow
  - Automated deployments

#### Code Quality
- **ESLint**
  - Next.js recommended config
  - TypeScript rules
  - Import sorting

- **Prettier**
  - Consistent code formatting
  - Pre-commit hooks

#### Testing (Recommended)
- **Vitest** - Unit tests
- **Playwright** - E2E tests
- **React Testing Library** - Component tests

#### Environment Management
- **dotenv**
  - Local .env.local
  - Vercel environment variables
  - Separate prod/preview/dev configs

---

## 3. Data Architecture

### 3.1 Database Schema

**See Database Schema Document (03) for complete details**

**Primary Table:** `solar.solar_leads`
- Existing table structure preserved
- No modifications to existing columns
- Indexes added for performance

**New Tables Required:**

```sql
-- User profiles table (extends Supabase auth.users)
CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'account_manager', 'field_rep')),
  account_manager_name TEXT, -- For Field Reps, links to Account Manager
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Materialized view for dashboard metrics (performance optimization)
CREATE MATERIALIZED VIEW dashboard_metrics_daily AS
SELECT
  DATE(created_at) as metric_date,
  COUNT(*) as total_leads,
  COUNT(survey_booked_date) as surveys_booked,
  COUNT(CASE WHEN survey_status = 'Good Survey' THEN 1 END) as good_surveys,
  COUNT(CASE WHEN survey_status = 'Bad Survey' THEN 1 END) as bad_surveys,
  COUNT(CASE WHEN survey_status = 'Sold Survey' THEN 1 END) as sold_surveys,
  SUM(lead_cost) as total_lead_cost
FROM solar.solar_leads
GROUP BY DATE(created_at);

-- Refresh daily via cron
```

### 3.2 Row-Level Security (RLS) Policies

**Critical for data isolation between roles**

```sql
-- Enable RLS on solar_leads table
ALTER TABLE solar.solar_leads ENABLE ROW LEVEL SECURITY;

-- Admin can see everything
CREATE POLICY "Admins can view all leads"
ON solar.solar_leads
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Account Managers see their assigned leads
CREATE POLICY "Account Managers see their leads"
ON solar.solar_leads
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() 
    AND role = 'account_manager'
    AND full_name = solar.solar_leads."Account_Manager"
  )
);

-- Field Reps see their assigned leads
CREATE POLICY "Field Reps see their leads"
ON solar.solar_leads
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() 
    AND role = 'field_rep'
    AND full_name = solar.solar_leads."Field_Rep"
  )
);

-- Only admins can update leads
CREATE POLICY "Only admins can update leads"
ON solar.solar_leads
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Only admins can delete users
CREATE POLICY "Only admins can delete users"
ON public.user_profiles
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);
```

### 3.3 Database Indexes (Performance Optimization)

```sql
-- Frequently queried fields
CREATE INDEX idx_solar_leads_created_at ON solar.solar_leads(created_at);
CREATE INDEX idx_solar_leads_survey_booked ON solar.solar_leads(survey_booked_date);
CREATE INDEX idx_solar_leads_survey_complete ON solar.solar_leads(survey_complete_date);
CREATE INDEX idx_solar_leads_status ON solar.solar_leads(status);
CREATE INDEX idx_solar_leads_survey_status ON solar.solar_leads(survey_status);

-- For role-based queries
CREATE INDEX idx_solar_leads_account_manager ON solar.solar_leads(account_manager);
CREATE INDEX idx_solar_leads_field_rep ON solar.solar_leads(field_rep);

-- Composite index for date range queries
CREATE INDEX idx_solar_leads_created_status ON solar.solar_leads(created_at, status);
```

---

## 4. Application Architecture

### 4.1 Directory Structure

```
valour-dashboard/
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── (auth)/                # Auth route group
│   │   │   ├── login/
│   │   │   └── layout.tsx
│   │   ├── (dashboard)/           # Protected route group
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx      # Main dashboard
│   │   │   ├── leads/
│   │   │   │   ├── page.tsx      # Lead table
│   │   │   │   └── [id]/         # Lead detail
│   │   │   ├── team/              # Team performance (Admin/AM)
│   │   │   ├── settings/          # Admin settings
│   │   │   └── layout.tsx         # Authenticated layout
│   │   ├── api/                   # API routes
│   │   │   ├── metrics/
│   │   │   └── leads/
│   │   └── layout.tsx             # Root layout
│   ├── components/
│   │   ├── ui/                    # shadcn/ui components
│   │   ├── dashboard/             # Dashboard-specific components
│   │   │   ├── MetricCard.tsx
│   │   │   ├── DateRangeFilter.tsx
│   │   │   └── LeadChart.tsx
│   │   ├── leads/
│   │   │   ├── LeadTable.tsx
│   │   │   ├── LeadDetail.tsx
│   │   │   └── LeadFilters.tsx
│   │   └── layout/
│   │       ├── Sidebar.tsx
│   │       ├── Header.tsx
│   │       └── ProtectedRoute.tsx
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts         # Supabase client
│   │   │   ├── server.ts         # Server-side client
│   │   │   └── middleware.ts     # Auth middleware
│   │   ├── hooks/                 # Custom React hooks
│   │   │   ├── useMetrics.ts
│   │   │   ├── useAuth.ts
│   │   │   └── useRealtime.ts
│   │   ├── utils/                 # Utility functions
│   │   │   ├── metrics.ts        # Metric calculations
│   │   │   ├── date.ts           # Date utilities
│   │   │   └── formatting.ts     # Formatters
│   │   └── validations/           # Zod schemas
│   │       ├── auth.ts
│   │       └── lead.ts
│   ├── types/
│   │   ├── database.ts            # Generated Supabase types
│   │   ├── metrics.ts
│   │   └── user.ts
│   └── styles/
│       └── globals.css            # Global styles
├── public/                         # Static assets
├── supabase/
│   ├── migrations/                 # Database migrations
│   └── seed.sql                    # Test data
├── .env.local.example
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

### 4.2 Component Architecture

#### Page Components (App Router)
- **Server Components by default** for optimal performance
- Client Components only when needed (interactivity, hooks)
- Data fetching in Server Components
- Pass data as props to Client Components

#### Example: Dashboard Page

```typescript
// app/(dashboard)/dashboard/page.tsx - Server Component
import { createServerClient } from '@/lib/supabase/server'
import { DashboardMetrics } from '@/components/dashboard/DashboardMetrics'
import { DateRangeFilter } from '@/components/dashboard/DateRangeFilter'

export default async function DashboardPage({
  searchParams
}: {
  searchParams: { dateFrom?: string; dateTo?: string; filter?: string }
}) {
  const supabase = createServerClient()
  
  // Fetch initial data server-side
  const { data: userData } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userData.user?.id)
    .single()
  
  // Server-side authorization check
  if (!profile) redirect('/login')
  
  return (
    <div>
      <DateRangeFilter /> {/* Client Component */}
      <DashboardMetrics 
        userRole={profile.role}
        userName={profile.full_name}
        initialFilters={searchParams}
      /> {/* Client Component with real-time updates */}
    </div>
  )
}
```

### 4.3 Real-Time Architecture

#### Subscription Strategy

```typescript
// hooks/useRealtimeMetrics.ts
import { useEffect, useState } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'
import { RealtimeChannel } from '@supabase/supabase-js'

export function useRealtimeMetrics(userRole: string, userName: string) {
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const supabase = createBrowserClient()
  
  useEffect(() => {
    // Initial fetch
    fetchMetrics().then(setMetrics)
    
    // Subscribe to changes
    const channel: RealtimeChannel = supabase
      .channel('dashboard-updates')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'solar',
          table: 'solar_leads',
          // Optional: Filter based on role
          filter: userRole === 'field_rep' 
            ? `Field_Rep=eq.${userName}` 
            : undefined
        },
        (payload) => {
          console.log('Database change:', payload)
          // Refetch metrics
          fetchMetrics().then(setMetrics)
        }
      )
      .subscribe()
    
    return () => {
      channel.unsubscribe()
    }
  }, [userRole, userName])
  
  return metrics
}
```

#### Optimistic Updates

For admin actions (updating lead status), implement optimistic UI:

```typescript
// components/leads/LeadStatusUpdate.tsx
async function updateLeadStatus(leadId: number, newStatus: string) {
  // 1. Optimistically update UI
  setLocalStatus(newStatus)
  
  // 2. Call API
  const { error } = await supabase
    .from('solar_leads')
    .update({ Status: newStatus })
    .eq('id', leadId)
  
  // 3. Revert if error
  if (error) {
    setLocalStatus(previousStatus)
    toast.error('Failed to update status')
  } else {
    toast.success('Status updated')
  }
}
```

---

## 5. API Design

### 5.1 Data Fetching Strategy

**Prefer Server Components > Server Actions > API Routes**

#### Server Components (Primary)
```typescript
// Fetch data directly in Server Component
const { data: leads } = await supabase
  .from('solar_leads')
  .select('*')
  .gte('created_at', startDate)
  .lte('created_at', endDate)
```

#### Server Actions (For Mutations)
```typescript
// app/actions/leads.ts
'use server'

export async function updateLeadStatus(leadId: number, status: string) {
  const supabase = createServerClient()
  
  // Auth check
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  
  // Role check
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  
  if (profile?.role !== 'admin') {
    throw new Error('Forbidden')
  }
  
  // Update
  const { error } = await supabase
    .from('solar_leads')
    .update({ Status: status })
    .eq('id', leadId)
  
  if (error) throw error
  
  revalidatePath('/dashboard')
  return { success: true }
}
```

#### API Routes (For Complex Logic)
```typescript
// app/api/metrics/route.ts
import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const supabase = createServerClient()
  
  // Auth middleware
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // Get query params
  const { searchParams } = new URL(request.url)
  const dateFrom = searchParams.get('dateFrom')
  const dateTo = searchParams.get('dateTo')
  
  // Fetch metrics (RLS automatically filters by role)
  const metrics = await calculateMetrics(supabase, dateFrom, dateTo)
  
  return NextResponse.json(metrics)
}
```

### 5.2 API Endpoints

**Authentication**
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/session` - Get current session

**Metrics**
- `GET /api/metrics?dateFrom=X&dateTo=Y` - Get dashboard metrics
- `GET /api/metrics/staff?role=field_rep` - Staff performance metrics

**Leads**
- `GET /api/leads?page=1&search=X&filter=Y` - Paginated lead list
- `GET /api/leads/[id]` - Single lead details
- `PATCH /api/leads/[id]` - Update lead (admin only)

**Users** (Admin only)
- `GET /api/users` - List all users
- `POST /api/users` - Create user
- `DELETE /api/users/[id]` - Delete user

---

## 6. Security Architecture

### 6.1 Authentication Flow

```
1. User enters email/password
2. Next.js calls Supabase Auth
3. Supabase validates credentials
4. Returns JWT token + refresh token
5. Tokens stored in httpOnly cookies (secure)
6. Middleware validates token on each request
7. User redirected to dashboard
```

### 6.2 Authorization Layers

**Layer 1: Route Protection (Middleware)**
```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  const supabase = createMiddlewareClient({ req: request })
  const { data: { session } } = await supabase.auth.getSession()
  
  // Redirect unauthenticated users
  if (!session && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  return NextResponse.next()
}
```

**Layer 2: Component-Level Checks**
```typescript
// Check user role in component
const { role } = useAuth()
if (role !== 'admin') return <Forbidden />
```

**Layer 3: Database RLS (Most Critical)**
- PostgreSQL Row-Level Security enforces data isolation
- Cannot be bypassed by client code
- Policies defined in migration files

### 6.3 Data Protection

**Sensitive Data Handling:**
- PII (Personal Identifiable Information) never in URLs
- No customer data in logs
- API responses filtered by RLS
- Rate limiting on all endpoints

**Environment Variables:**
```
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ... (safe to expose)
SUPABASE_SERVICE_ROLE_KEY=eyJ... (NEVER expose to client)
```

---

## 7. Performance Optimization

### 7.1 Frontend Optimizations

**Code Splitting:**
- Lazy load heavy chart libraries
- Dynamic imports for modal/dialogs
- Separate chunks per route

**Image Optimization:**
- Next.js Image component
- WebP format with fallbacks
- Lazy loading below fold

**Bundle Size:**
- Tree-shaking enabled
- Remove unused dependencies
- Analyze with `next/bundle-analyzer`

### 7.2 Data Loading Strategies

**Initial Load:**
- Server-side render dashboard with initial data
- Stream large datasets
- Show skeleton loaders during fetch

**Caching:**
- React Query cache for 5 minutes
- Browser cache for static assets (1 year)
- CDN cache for public pages

**Pagination:**
- Virtual scrolling for large tables
- Cursor-based pagination (better than offset)
- Page size: 50 rows

### 7.3 Database Optimization

**Query Optimization:**
- Use indexes on filtered columns
- Materialized views for complex aggregations
- Connection pooling via Supabase

**Real-Time Optimization:**
- Subscribe only to necessary changes
- Filter subscriptions at database level
- Unsubscribe on component unmount

---

## 8. Error Handling & Monitoring

### 8.1 Error Handling Strategy

**Client-Side:**
- Error boundaries for React components
- Toast notifications for user errors
- Fallback UI for failed data loads

**Server-Side:**
- Try-catch in all async functions
- Structured error responses
- Never expose stack traces to client

**Example:**
```typescript
// lib/errorHandler.ts
export function handleError(error: unknown) {
  if (error instanceof PostgrestError) {
    console.error('Database error:', error.message)
    return { error: 'Database operation failed' }
  }
  
  if (error instanceof AuthError) {
    console.error('Auth error:', error.message)
    return { error: 'Authentication failed' }
  }
  
  console.error('Unknown error:', error)
  return { error: 'An unexpected error occurred' }
}
```

### 8.2 Logging

**Production Logging:**
- Vercel Analytics (automatic)
- Console.log for debugging (development only)
- Supabase logs for database errors

**What to Log:**
- Authentication failures
- Authorization denials
- Database errors
- Performance bottlenecks (>2s queries)

**What NOT to Log:**
- Passwords
- Tokens
- Customer PII

### 8.3 Monitoring

**Key Metrics to Track:**
- API response times
- Real-time connection stability
- Database query performance
- Error rates
- User session duration

**Tools:**
- Vercel Analytics (built-in)
- Supabase Dashboard (database metrics)
- Browser DevTools (Performance tab)

---

## 9. Deployment Strategy

### 9.1 Environment Setup

**Environments:**
1. **Development** - Local machine
2. **Preview** - Vercel preview deployments (per PR)
3. **Production** - Main branch, live users

**Environment Variables per Environment:**
```
# Development (.env.local)
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Production (Vercel Dashboard)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### 9.2 Deployment Pipeline

```
1. Push to feature branch
2. Create Pull Request
3. Vercel automatically deploys preview
4. Run tests (optional)
5. Manual QA on preview
6. Merge to main
7. Vercel auto-deploys to production
8. Monitor for errors
```

### 9.3 Database Migrations

**Using Supabase CLI:**
```bash
# Create migration
supabase migration new add_user_profiles

# Apply locally
supabase db push

# Deploy to production
supabase db push --db-url postgresql://...
```

**Migration Best Practices:**
- Test locally first
- Backup database before production migration
- Use transactions for multi-step migrations
- Never drop columns with data (deprecate instead)

---

## 10. Development Workflow

### 10.1 Local Development Setup

```bash
# 1. Clone repository
git clone [repository-url]
cd valour-dashboard

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.local.example .env.local
# Edit .env.local with your Supabase credentials

# 4. Run Supabase locally (optional)
npx supabase start

# 5. Run Next.js dev server
npm run dev

# 6. Open browser
# http://localhost:3000
```

### 10.2 Code Standards

**TypeScript:**
- Strict mode enabled
- Explicit return types for functions
- No `any` types (use `unknown` if needed)

**React:**
- Functional components only
- Custom hooks for reusable logic
- Props interfaces exported

**File Naming:**
- Components: PascalCase (e.g., `MetricCard.tsx`)
- Utilities: camelCase (e.g., `formatDate.ts`)
- Constants: UPPER_SNAKE_CASE (e.g., `API_ROUTES.ts`)

---

## 11. Scalability Considerations

### 11.1 Current Scale
- 10-25 concurrent users
- 100-200 new leads per month
- ~5,000 total leads per year

### 11.2 Future Scale (Year 2-3)
- 50-100 concurrent users
- 500-1000 new leads per month
- ~50,000 total leads

### 11.3 Scaling Strategy

**Database:**
- Supabase Pro tier ($25/mo) supports 8GB database
- Read replicas for heavy reporting
- Partitioning by date for large tables

**Application:**
- Vercel scales automatically
- Edge functions for global low latency
- CDN caching for static assets

**Real-Time:**
- Supabase Realtime scales to 10,000+ connections
- Can switch to Ably if needed (more expensive)

---

## 12. Testing Strategy

### 12.1 Testing Pyramid

**Unit Tests (70%):**
- Utility functions
- Metric calculations
- Data transformations

**Integration Tests (20%):**
- API routes
- Server actions
- Database queries

**E2E Tests (10%):**
- Critical user flows
- Login/logout
- Dashboard view
- Lead creation (admin)

### 12.2 Testing Tools

```json
{
  "scripts": {
    "test": "vitest",
    "test:e2e": "playwright test",
    "test:coverage": "vitest --coverage"
  }
}
```

**Example Unit Test:**
```typescript
// lib/utils/metrics.test.ts
import { calculateConversionRate } from './metrics'

describe('calculateConversionRate', () => {
  it('calculates percentage correctly', () => {
    expect(calculateConversionRate(50, 200)).toBe(25.00)
  })
  
  it('handles zero denominator', () => {
    expect(calculateConversionRate(10, 0)).toBe(0)
  })
})
```

---

## 13. Technical Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Real-time connection drops | Medium | Implement polling fallback, auto-reconnect |
| Supabase free tier limits | High | Monitor usage, budget for Pro tier upgrade |
| Slow dashboard with 50k+ leads | Medium | Implement pagination, date filters, indexed queries |
| N+1 query problems | Medium | Use Supabase select with joins, analyze queries |
| Large bundle size | Low | Code splitting, lazy loading, tree shaking |

---

## 14. Technical Debt Prevention

**Code Review Checklist:**
- [ ] TypeScript errors resolved
- [ ] No console.logs in production code
- [ ] Error handling implemented
- [ ] Loading states added
- [ ] Responsive design verified
- [ ] Accessibility checked
- [ ] Performance profiled

**Refactoring Schedule:**
- Quarterly code review
- Address TODOs within 2 sprints
- Update dependencies monthly

---

## 15. Documentation Requirements

**Code Documentation:**
- JSDoc for all exported functions
- README in each major directory
- Architecture Decision Records (ADRs) for major choices

**API Documentation:**
- OpenAPI spec for public endpoints
- Example requests/responses
- Error code reference

**User Documentation:**
- Admin guide (separate document)
- User roles and permissions guide
- Troubleshooting FAQ

---

**Document Status:** ✅ Ready for Implementation  
**Next Steps:** Review Database Schema (03) and Authentication Spec (04)
