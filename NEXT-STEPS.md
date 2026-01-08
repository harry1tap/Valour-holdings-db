# Next Steps - Valour Holdings Dashboard

## ✅ Phase 1: COMPLETE

**What's been built:**
- ✅ Next.js 14 project with TypeScript, Tailwind CSS, App Router
- ✅ Supabase client configuration (browser, server, middleware)
- ✅ Authentication middleware protecting routes
- ✅ Login page with form validation
- ✅ Dashboard layout (Header + Sidebar)
- ✅ Role-based navigation
- ✅ Placeholder pages for all routes
- ✅ useAuth hook for user state
- ✅ Git repository initialized

---

## 🚀 Getting Started

### Step 1: Create Supabase Project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Name: `valour-dashboard`
4. Choose a database password (save it securely!)
5. Region: Choose closest to UK
6. Wait for project to be ready (~2 minutes)

### Step 2: Get Your Credentials

Once your project is ready:

1. Go to **Project Settings → API**
2. You'll see these values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJhbGc...`)
   - **service_role key** (starts with `eyJhbGc...` - different from anon key)

3. **Copy all three values** - you'll need them in the next step

### Step 3: Configure Environment Variables

```bash
# Copy the example file to create .env.local
cp .env.local.example .env.local

# Open .env.local in your editor
# Replace the placeholder values with your real Supabase credentials
```

Your `.env.local` should look like:
```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT-ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

⚠️ **IMPORTANT**: Never commit `.env.local` to git! It's already in `.gitignore`.

### Step 4: Run Database Migrations

Open your Supabase project → **SQL Editor**, then run each migration file from `docs/03-Database-Schema.md` **in order**:

1. **20260108000001_create_user_profiles.sql**
   - Creates the `user_profiles` table
   - Links to Supabase auth users
   - Stores role and profile info

2. **20260108000002_add_solar_leads_indexes.sql**
   - Adds performance indexes
   - Enables full-text search
   - Optimizes queries

3. **20260108000003_enable_rls_policies.sql**
   - Enables Row-Level Security
   - Creates policies for Admin, Account Manager, Field Rep
   - Ensures data isolation

4. **20260108000004_create_database_functions.sql**
   - Creates helper functions
   - `get_user_role()` - Get current user's role
   - `calculate_dashboard_metrics()` - Calculate dashboard metrics
   - `get_staff_performance()` - Get staff performance data

📁 **Where to find these?**
All migration SQL is in `docs/03-Database-Schema.md` sections 7.2 through 7.5

### Step 5: Create Your First Admin User

1. In Supabase Dashboard → **Authentication → Users**
2. Click "Add User"
3. Email: `admin@valourholdings.com` (or your email)
4. Click "Auto Generate Password"
5. Copy the password (you'll need it to log in!)
6. Click "Create User"

7. Go to **SQL Editor** and run:
```sql
-- Replace 'PASTE_UUID_HERE' with the user's ID from the auth.users table
INSERT INTO public.user_profiles (id, email, full_name, role, is_active)
VALUES (
  'PASTE_UUID_HERE',  -- Get this from auth.users table
  'admin@valourholdings.com',
  'Admin User',
  'admin',
  TRUE
);
```

To get the UUID:
- Go to **Authentication → Users**
- Click on your newly created user
- Copy the UUID from the URL or user details

### Step 6: Start Development Server

```bash
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000) in your browser.

You should be redirected to the login page. Use the admin credentials you created!

---

## 📋 Verification Checklist

After completing steps 1-6, verify everything works:

- [ ] Navigate to `http://localhost:3000`
- [ ] Should redirect to `/login` page
- [ ] Login page displays correctly
- [ ] Enter admin credentials
- [ ] Should redirect to `/dashboard` after successful login
- [ ] Header shows your name and role badge
- [ ] Sidebar shows navigation menu
- [ ] Can navigate between Dashboard, Leads, Team, Settings pages
- [ ] User dropdown menu works
- [ ] Logout button redirects back to login

---

## 🐛 Troubleshooting

### "Cannot connect to Supabase"
- Check that `.env.local` exists and has correct values
- Verify Supabase URL starts with `https://`
- Ensure no extra spaces in environment variables
- Restart dev server after changing `.env.local`

### "Invalid login credentials"
- Verify email matches exactly (case-sensitive)
- Check you copied the auto-generated password correctly
- Verify user exists in Supabase → Authentication → Users
- Verify user_profiles record exists in database

### "Access denied" or "Unauthorized"
- Check that user_profiles record has correct role
- Verify full_name in user_profiles matches exactly
- Check that is_active = TRUE in user_profiles

### Build errors
```bash
# Clear cache and rebuild
rm -rf .next node_modules package-lock.json
npm install
npm run build
```

---

## 📁 Project Structure Quick Reference

```
valour-dashboard/
├── docs/                     # Complete documentation
├── src/
│   ├── app/
│   │   ├── (auth)/login/    # Login page
│   │   ├── (dashboard)/     # Protected pages
│   │   └── layout.tsx       # Root layout
│   ├── components/
│   │   ├── ui/              # shadcn/ui components
│   │   └── layout/          # Header, Sidebar
│   ├── lib/
│   │   ├── supabase/        # Supabase clients
│   │   ├── hooks/           # useAuth hook
│   │   ├── utils/           # Utilities
│   │   └── validations/     # Zod schemas
│   └── types/               # TypeScript types
├── .env.local.example       # Template for credentials
├── .env.local               # Your actual credentials (gitignored)
├── middleware.ts            # Route protection
└── README.md                # Full documentation
```

---

## 🎯 What's Next?

Once you have Phase 1 running, we'll move to **Phase 2: Dashboard Metrics**:

- Add 12 core dashboard metrics
- Implement date range filtering
- Create chart visualizations (Line, Bar, Donut)
- Add real-time data subscriptions
- Connect to your existing solar_leads table

But first, **get Phase 1 running** by completing the steps above!

---

## 💡 Tips

1. **Keep your terminal open** while developing to see error messages
2. **Check browser console** (F12) for any JavaScript errors
3. **Supabase Dashboard** is your friend - use it to inspect data
4. **SQL Editor** in Supabase lets you run queries to debug
5. **.env.local changes** require restarting the dev server

---

## 📞 Need Help?

If you get stuck:

1. Check the **Troubleshooting** section above
2. Review `README.md` for detailed setup instructions
3. Check `docs/` folder for complete specifications
4. Look at browser console (F12) for error messages
5. Check Supabase Dashboard → Logs for database errors

---

**Ready to start? Go through Steps 1-6 above, then let me know when you're ready for Phase 2!** 🚀
