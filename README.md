# Valour Holdings Solar Lead Management Dashboard

A production-ready real-time dashboard for tracking solar installation leads from initial contact through to paid installation.

## 🎯 Project Status

**Phase 1: COMPLETE** ✅
- Project setup with Next.js 14, TypeScript, Tailwind CSS
- Authentication system with Supabase
- Protected routes with middleware
- Dashboard layout (Header + Sidebar)
- Role-based navigation
- Login page with validation

**Next: Phase 2** - Dashboard Metrics & Real-time Updates

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- A Supabase account (create one at [supabase.com](https://supabase.com))

### 1. Set Up Supabase

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Create a new project named `valour-dashboard`
3. Wait for the project to be ready
4. Go to **Project Settings → API**
5. Copy these credentials:
   - Project URL
   - `anon/public` key
   - `service_role` key

### 2. Configure Environment Variables

```bash
# Copy the example file
cp .env.local.example .env.local

# Edit .env.local and add your Supabase credentials
```

Your `.env.local` should look like:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Run Database Migrations

Go to your Supabase project → **SQL Editor** and run the migration files from `docs/03-Database-Schema.md` in order:

1. `20260108000001_create_user_profiles.sql`
2. `20260108000002_add_solar_leads_indexes.sql`
3. `20260108000003_enable_rls_policies.sql`
4. `20260108000004_create_database_functions.sql`

### 4. Install Dependencies

```bash
npm install
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Project Structure

```
valour-dashboard/
├── docs/                          # Complete project documentation
│   ├── README.md                  # Documentation overview
│   ├── 01-PRD-Product-Requirements.md
│   ├── 02-Technical-Architecture.md
│   ├── 03-Database-Schema.md
│   ├── 04-Authentication-Authorization.md
│   ├── 05-UI-UX-Requirements.md
│   └── 06-Deployment-Implementation-Guide.md
├── src/
│   ├── app/
│   │   ├── (auth)/login/          # Login page
│   │   ├── (dashboard)/           # Protected dashboard pages
│   │   │   ├── dashboard/         # Main dashboard
│   │   │   ├── leads/             # Lead management
│   │   │   ├── team/              # Team performance
│   │   │   └── settings/          # Admin settings
│   │   └── api/                   # API routes (future)
│   ├── components/
│   │   ├── ui/                    # shadcn/ui components
│   │   ├── layout/                # Header, Sidebar
│   │   ├── dashboard/             # Dashboard components (Phase 2)
│   │   └── leads/                 # Lead components (Phase 3)
│   ├── lib/
│   │   ├── supabase/              # Supabase clients
│   │   ├── hooks/                 # React hooks (useAuth)
│   │   ├── utils/                 # Utility functions
│   │   └── validations/           # Zod schemas
│   └── types/                     # TypeScript types
├── .env.local.example             # Environment variables template
└── middleware.ts                  # Route protection
```

---

## 👥 User Roles

### Admin
- ✅ View all company-wide data
- ✅ Edit lead data
- ✅ Create/edit/delete users
- ✅ Access all features

### Account Manager
- ✅ View their assigned leads
- ✅ View their Field Reps' performance
- ❌ Cannot edit data
- ❌ Cannot manage users

### Field Representative
- ✅ View their assigned leads
- ✅ View personal performance
- ❌ Cannot edit data
- ❌ Cannot view team data

---

## 🔒 Security

- **Authentication**: Email/password via Supabase Auth
- **Authorization**: Row-Level Security (RLS) policies at database level
- **Route Protection**: Next.js middleware
- **Session Management**: JWT tokens in httpOnly cookies

---

## 🛠 Development

### Available Scripts

```bash
# Development server
npm run dev

# Production build
npm run build

# Start production server
npm run start

# Lint code
npm run lint
```

### Creating Your First Admin User

After setting up the database:

1. Go to Supabase Dashboard → **Authentication → Users**
2. Click "Add User"
3. Enter email and auto-generate password
4. Go to **SQL Editor** and run:

```sql
INSERT INTO public.user_profiles (id, email, full_name, role)
VALUES (
  'PASTE_USER_UUID_FROM_AUTH_USERS_HERE',
  'admin@valourholdings.com',
  'Admin User',
  'admin'
);
```

5. Use these credentials to log in at `http://localhost:3000/login`

---

## 📊 Phase Roadmap

### ✅ Phase 1: Authentication & Layout (Current)
- Project setup
- Authentication system
- Dashboard layout

### 🔄 Phase 2: Dashboard Metrics (Next)
- 12 core metrics
- Date range filtering
- Real-time updates
- Chart visualizations

### 📋 Phase 3: Lead Management
- Lead table with search/filter
- Lead detail modal
- Pagination

### 👥 Phase 4: Team Performance & Admin
- Staff performance metrics
- User management (CRUD)
- Audit logging

### ✨ Phase 5: Polish & Testing
- Loading states
- Error handling
- Mobile optimization
- Performance tuning
- Production deployment

---

## 🎨 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui + Radix UI
- **Database**: Supabase PostgreSQL
- **Authentication**: Supabase Auth
- **Real-time**: Supabase Realtime
- **Forms**: React Hook Form + Zod
- **Charts**: Recharts (Phase 2)
- **State**: React Query (Phase 2)

---

## 📚 Documentation

Complete documentation is available in the `docs/` folder:

1. **README.md** - Documentation overview
2. **01-PRD-Product-Requirements.md** - Business requirements
3. **02-Technical-Architecture.md** - System architecture
4. **03-Database-Schema.md** - Database design and migrations
5. **04-Authentication-Authorization.md** - Security specifications
6. **05-UI-UX-Requirements.md** - Design system
7. **06-Deployment-Implementation-Guide.md** - Deployment guide

---

## 🐛 Troubleshooting

### Login not working

1. Check that `.env.local` has correct Supabase credentials
2. Verify database migrations have been run
3. Check that user exists in `auth.users` and `user_profiles` tables

### Middleware redirect loop

1. Clear browser cookies
2. Restart dev server
3. Check that Supabase URL is correct

### Build errors

```bash
# Clear cache and reinstall
rm -rf .next node_modules package-lock.json
npm install
npm run build
```

---

## 📧 Support

For questions or issues:
- Check the troubleshooting section above
- Review documentation in `docs/` folder
- Contact your project administrator

---

## 📝 License

Private - Valour Holdings Internal Project

---

**Built with ❤️ using Next.js and Supabase**
