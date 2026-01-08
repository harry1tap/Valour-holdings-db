# Authentication & Authorization Specification
## Valour Holdings Solar Lead Management Dashboard

**Version:** 1.0  
**Date:** January 8, 2026  
**Auth Provider:** Supabase Auth (GoTrue)  
**Session Management:** JWT with httpOnly cookies

---

## 1. Overview

### 1.1 Authentication System
- **Provider:** Supabase Auth (GoTrue)
- **Method:** Email + Password
- **Session Storage:** httpOnly cookies (secure)
- **Session Duration:** 24 hours (configurable)
- **Token Type:** JWT (JSON Web Token)

### 1.2 Authorization System
- **Model:** Role-Based Access Control (RBAC)
- **Roles:** Admin, Account Manager, Field Representative
- **Enforcement Layers:** 
  1. Database Row-Level Security (primary)
  2. Middleware route protection
  3. Component-level UI hiding

---

## 2. User Roles & Permissions

### 2.1 Role Definitions

#### Admin Role
**Description:** Full system access, user management, all data visibility

**Permissions:**
- ✅ View all leads (company-wide)
- ✅ View all dashboard metrics (company-wide)
- ✅ View all team members' performance
- ✅ Update any lead data (status, assignments, notes)
- ✅ Create new leads
- ✅ Create new users
- ✅ Update user roles and assignments
- ✅ Delete users (except themselves)
- ✅ Export data
- ✅ View audit logs

**Cannot Do:**
- ❌ Delete leads (no one can delete, only soft delete)
- ❌ Delete their own account

**Database Filter:** None - sees all data

#### Account Manager Role
**Description:** Manage assigned leads and Field Reps

**Permissions:**
- ✅ View leads where `Account_Manager` = their name
- ✅ View dashboard metrics for their leads only
- ✅ View performance of Field Reps assigned to them
- ✅ View lead details including Notes and Fall_Off_Reason
- ✅ Search/filter their assigned leads

**Cannot Do:**
- ❌ View other Account Managers' leads
- ❌ Edit any lead data
- ❌ Create or delete leads
- ❌ Manage users
- ❌ View audit logs

**Database Filter:** `WHERE "Account_Manager" = user.full_name`

#### Field Representative Role
**Description:** View personal performance and assigned leads

**Permissions:**
- ✅ View leads where `Field_Rep` = their name
- ✅ View dashboard metrics for their leads only
- ✅ View their own performance statistics
- ✅ View lead details including Notes
- ✅ Search/filter their assigned leads

**Cannot Do:**
- ❌ View other Field Reps' leads
- ❌ View other Account Managers' leads
- ❌ Edit any lead data
- ❌ Create or delete leads
- ❌ Manage users
- ❌ View audit logs
- ❌ View Fall_Off_Reason (optional - can be enabled if needed)

**Database Filter:** `WHERE "Field_Rep" = user.full_name`

### 2.2 Permission Matrix

| Feature | Admin | Account Manager | Field Rep |
|---------|-------|-----------------|-----------|
| **Dashboard Access** |
| View own metrics | ✅ | ✅ | ✅ |
| View team metrics | ✅ | ✅ (own team) | ❌ |
| View company-wide metrics | ✅ | ❌ | ❌ |
| **Lead Management** |
| View assigned leads | ✅ (all) | ✅ (own) | ✅ (own) |
| Search leads | ✅ (all) | ✅ (own) | ✅ (own) |
| View lead details | ✅ | ✅ | ✅ |
| View Notes field | ✅ | ✅ | ✅ |
| View Fall_Off_Reason | ✅ | ✅ | ❌ |
| Edit lead data | ✅ | ❌ | ❌ |
| Create new lead | ✅ | ❌ | ❌ |
| Delete lead | ❌ | ❌ | ❌ |
| **User Management** |
| View all users | ✅ | ❌ | ❌ |
| Create user | ✅ | ❌ | ❌ |
| Edit user | ✅ | ❌ | ❌ |
| Delete user | ✅ | ❌ | ❌ |
| View audit log | ✅ | ❌ | ❌ |
| **Data Export** |
| Export to CSV | ✅ | ❌ | ❌ |
| **Settings** |
| Change own password | ✅ | ✅ | ✅ |
| Update own profile | ✅ | ✅ | ✅ |

---

## 3. Authentication Flow

### 3.1 User Registration (Admin Only)

**Process:**
```
1. Admin logs into dashboard
2. Admin navigates to User Management page
3. Admin clicks "Create New User"
4. Admin fills form:
   - Email
   - Full Name (must match Field_Rep/Account_Manager in leads)
   - Role (Admin/Account Manager/Field Rep)
   - Account Manager Name (if Field Rep)
5. Admin submits form
6. System creates auth.users record via Supabase Auth
7. System creates public.user_profiles record
8. System sends invitation email with temporary password
9. New user receives email with login link
10. New user logs in and must change password on first login
```

**API Call:**
```typescript
// Server-side only
import { createServerClient } from '@/lib/supabase/server'

async function createUser(data: {
  email: string
  fullName: string
  role: 'admin' | 'account_manager' | 'field_rep'
  accountManagerName?: string
}) {
  const supabase = createServerClient()
  
  // Check if current user is admin
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user?.id)
    .single()
  
  if (profile?.role !== 'admin') {
    throw new Error('Unauthorized')
  }
  
  // Create auth user
  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email: data.email,
    email_confirm: true,
    password: generateRandomPassword(), // 16 char random
  })
  
  if (authError) throw authError
  
  // Create profile
  const { error: profileError } = await supabase
    .from('user_profiles')
    .insert({
      id: authUser.user.id,
      email: data.email,
      full_name: data.fullName,
      role: data.role,
      account_manager_name: data.accountManagerName,
      created_by: user?.id
    })
  
  if (profileError) {
    // Rollback auth user creation
    await supabase.auth.admin.deleteUser(authUser.user.id)
    throw profileError
  }
  
  // Send invitation email via Supabase
  await supabase.auth.admin.inviteUserByEmail(data.email)
  
  return { success: true, userId: authUser.user.id }
}
```

### 3.2 User Login Flow

**Process:**
```
1. User visits dashboard URL (e.g., dashboard.valourholdings.com)
2. Unauthenticated users redirected to /login
3. User enters email and password
4. Next.js calls Supabase Auth signInWithPassword
5. Supabase validates credentials
6. If valid, returns access_token + refresh_token
7. Tokens stored in httpOnly cookies
8. User redirected to /dashboard
9. User sees dashboard appropriate for their role
```

**Login Component:**
```typescript
// app/(auth)/login/page.tsx
'use client'

import { useState } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createBrowserClient()
  
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
    
    // Success - redirect to dashboard
    router.push('/dashboard')
    router.refresh()
  }
  
  return (
    <form onSubmit={handleLogin}>
      {/* Login form UI */}
    </form>
  )
}
```

### 3.3 Session Management

**Session Properties:**
- **Duration:** 24 hours (configurable in Supabase Dashboard)
- **Storage:** httpOnly cookies (cannot be accessed by JavaScript)
- **Refresh:** Automatic refresh 5 minutes before expiry
- **Logout:** Clears session and redirects to login

**Session Refresh:**
```typescript
// Automatic session refresh (handled by Supabase client)
const supabase = createBrowserClient()

// Session automatically refreshes when:
// 1. Access token expires (after 1 hour by default)
// 2. User performs any authenticated action
// 3. Page is reloaded/revisited
```

**Logout Flow:**
```typescript
async function handleLogout() {
  const supabase = createBrowserClient()
  
  await supabase.auth.signOut()
  router.push('/login')
  router.refresh()
}
```

### 3.4 Password Reset

**Process:**
```
1. User clicks "Forgot Password" on login page
2. User enters email
3. Supabase sends password reset email
4. User clicks link in email
5. User redirected to reset password page
6. User enters new password
7. Password updated in Supabase Auth
8. User can now log in with new password
```

**Implementation:**
```typescript
// Request password reset
async function requestPasswordReset(email: string) {
  const supabase = createBrowserClient()
  
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`,
  })
  
  if (error) throw error
  return { success: true }
}

// Reset password page
async function resetPassword(newPassword: string) {
  const supabase = createBrowserClient()
  
  const { error } = await supabase.auth.updateUser({
    password: newPassword
  })
  
  if (error) throw error
  return { success: true }
}
```

---

## 4. Authorization Implementation

### 4.1 Three-Layer Security Model

#### Layer 1: Middleware (Route Protection)

**Purpose:** Prevent unauthenticated access to protected routes

**File:** `middleware.ts`

```typescript
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req: request, res })
  
  // Get session
  const {
    data: { session },
  } = await supabase.auth.getSession()
  
  // Protected routes
  const protectedPaths = ['/dashboard', '/leads', '/team', '/settings']
  const isProtectedRoute = protectedPaths.some(path => 
    request.nextUrl.pathname.startsWith(path)
  )
  
  // Redirect to login if accessing protected route without session
  if (isProtectedRoute && !session) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/login'
    redirectUrl.searchParams.set('redirectTo', request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }
  
  // Redirect to dashboard if accessing login with active session
  if (request.nextUrl.pathname === '/login' && session) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
  
  return res
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/leads/:path*',
    '/team/:path*',
    '/settings/:path*',
    '/login',
  ],
}
```

#### Layer 2: Database Row-Level Security (RLS)

**Purpose:** Enforce data isolation at database level (most critical layer)

**See Database Schema Document (03) for complete RLS policies**

**Key Points:**
- RLS policies filter data before it reaches the application
- Cannot be bypassed by client-side code
- Enforces permissions even if middleware/UI fails
- Policies defined in SQL migrations

**Example RLS Policy:**
```sql
-- Field Reps can only see their assigned leads
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

#### Layer 3: Component-Level UI Protection

**Purpose:** Hide UI elements user doesn't have permission to use

**Example:**
```typescript
// components/layout/Sidebar.tsx
'use client'

import { useAuth } from '@/lib/hooks/useAuth'

export function Sidebar() {
  const { role } = useAuth()
  
  return (
    <nav>
      <NavLink href="/dashboard">Dashboard</NavLink>
      <NavLink href="/leads">Leads</NavLink>
      
      {/* Only show Team link to Admin and Account Managers */}
      {(role === 'admin' || role === 'account_manager') && (
        <NavLink href="/team">Team Performance</NavLink>
      )}
      
      {/* Only show Settings to Admin */}
      {role === 'admin' && (
        <NavLink href="/settings">Settings</NavLink>
      )}
    </nav>
  )
}
```

### 4.2 Authorization Helpers

**Custom Hook: useAuth**

```typescript
// lib/hooks/useAuth.ts
import { createBrowserClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

interface UserProfile {
  id: string
  email: string
  fullName: string
  role: 'admin' | 'account_manager' | 'field_rep'
  accountManagerName?: string
}

export function useAuth() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createBrowserClient()
  
  useEffect(() => {
    async function fetchProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setProfile(null)
        setLoading(false)
        return
      }
      
      const { data } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      if (data) {
        setProfile({
          id: data.id,
          email: data.email,
          fullName: data.full_name,
          role: data.role,
          accountManagerName: data.account_manager_name,
        })
      }
      
      setLoading(false)
    }
    
    fetchProfile()
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchProfile()
    })
    
    return () => subscription.unsubscribe()
  }, [])
  
  return {
    profile,
    role: profile?.role,
    isAdmin: profile?.role === 'admin',
    isAccountManager: profile?.role === 'account_manager',
    isFieldRep: profile?.role === 'field_rep',
    loading,
  }
}
```

**Authorization Check Function:**

```typescript
// lib/utils/auth.ts
export function canPerformAction(
  userRole: string,
  action: string
): boolean {
  const permissions = {
    admin: [
      'view_all_leads',
      'edit_lead',
      'create_lead',
      'manage_users',
      'view_audit_log',
      'export_data',
    ],
    account_manager: [
      'view_own_leads',
      'view_team_performance',
    ],
    field_rep: [
      'view_own_leads',
      'view_own_performance',
    ],
  }
  
  return permissions[userRole]?.includes(action) ?? false
}
```

---

## 5. Security Best Practices

### 5.1 Password Requirements

**Minimum Requirements:**
- 8 characters minimum
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- At least 1 special character

**Implementation (Zod Schema):**
```typescript
// lib/validations/auth.ts
import { z } from 'zod'

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character')

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  fullName: z.string().min(2, 'Full name is required'),
  role: z.enum(['admin', 'account_manager', 'field_rep']),
  accountManagerName: z.string().optional(),
})
```

### 5.2 Rate Limiting

**Login Attempts:**
- Maximum 5 failed attempts
- 15-minute lockout after 5 failures
- Implemented via Supabase Auth (automatic)

**API Rate Limiting:**
```typescript
// middleware.ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'),
})

export async function middleware(request: NextRequest) {
  // Rate limit API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const ip = request.ip ?? '127.0.0.1'
    const { success } = await ratelimit.limit(ip)
    
    if (!success) {
      return new Response('Too Many Requests', { status: 429 })
    }
  }
  
  // ... rest of middleware
}
```

### 5.3 CSRF Protection

**Built-in Protection:**
- Supabase Auth handles CSRF automatically
- httpOnly cookies prevent XSS attacks
- SameSite cookie attribute enabled

### 5.4 XSS Prevention

**Best Practices:**
- Never use `dangerouslySetInnerHTML`
- Sanitize user input before display
- React escapes by default
- Use TypeScript to enforce types

### 5.5 SQL Injection Prevention

**Protection Mechanisms:**
- Supabase uses parameterized queries
- RLS policies use parameter binding
- Never construct SQL from user input
- All queries go through Supabase client

---

## 6. Audit Logging

### 6.1 What to Log

**Admin Actions:**
- User creation/deletion
- Role changes
- Lead status updates
- Permission changes

**Authentication Events:**
- Login attempts (success/failure)
- Logout events
- Password changes
- Failed authorization attempts

### 6.2 Audit Log Implementation

**Database Trigger:**
```sql
-- Function to log lead updates
CREATE OR REPLACE FUNCTION log_lead_update()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.audit_log (
    user_id,
    action,
    table_name,
    record_id,
    old_values,
    new_values
  ) VALUES (
    auth.uid(),
    'UPDATE',
    'solar_leads',
    NEW.id::TEXT,
    to_jsonb(OLD),
    to_jsonb(NEW)
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on solar_leads updates
CREATE TRIGGER audit_lead_updates
AFTER UPDATE ON solar.solar_leads
FOR EACH ROW
EXECUTE FUNCTION log_lead_update();
```

**View Audit Log (Admin Only):**
```typescript
// app/(dashboard)/settings/audit-log/page.tsx
import { createServerClient } from '@/lib/supabase/server'

export default async function AuditLogPage() {
  const supabase = createServerClient()
  
  const { data: logs } = await supabase
    .from('audit_log')
    .select(`
      *,
      user:user_profiles(full_name, email)
    `)
    .order('created_at', { ascending: false })
    .limit(100)
  
  return (
    <div>
      <h1>Audit Log</h1>
      <table>
        {/* Display audit logs */}
      </table>
    </div>
  )
}
```

---

## 7. Testing Authentication & Authorization

### 7.1 Test Scenarios

**Authentication Tests:**
```typescript
describe('Authentication', () => {
  it('should login with valid credentials', async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'ValidPassword123!',
    })
    
    expect(error).toBeNull()
    expect(data.session).toBeDefined()
  })
  
  it('should reject invalid credentials', async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'wrong',
    })
    
    expect(error).toBeDefined()
  })
  
  it('should logout successfully', async () => {
    await supabase.auth.signOut()
    const { data: { session } } = await supabase.auth.getSession()
    
    expect(session).toBeNull()
  })
})
```

**Authorization Tests:**
```typescript
describe('Authorization', () => {
  it('Admin can view all leads', async () => {
    // Login as admin
    const { data: leads } = await supabase
      .from('solar_leads')
      .select('*')
    
    expect(leads.length).toBeGreaterThan(0)
  })
  
  it('Field Rep can only view their leads', async () => {
    // Login as field rep
    const { data: leads } = await supabase
      .from('solar_leads')
      .select('*')
    
    // All leads should have Field_Rep = current user
    leads.forEach(lead => {
      expect(lead.Field_Rep).toBe('Current User Name')
    })
  })
  
  it('Field Rep cannot update leads', async () => {
    // Login as field rep
    const { error } = await supabase
      .from('solar_leads')
      .update({ Status: 'Test' })
      .eq('id', 1)
    
    expect(error).toBeDefined()
    expect(error.message).toContain('permission')
  })
})
```

---

## 8. Troubleshooting Guide

### 8.1 Common Issues

**Issue: User cannot log in**
- Check email is correct
- Check password meets requirements
- Check user exists in auth.users
- Check user_profiles record exists
- Check is_active = TRUE

**Issue: User sees "Unauthorized" error**
- Check user's role in user_profiles
- Check RLS policies are enabled
- Check middleware is working
- Check session is valid

**Issue: User sees wrong data**
- Check full_name matches Field_Rep/Account_Manager exactly
- Check RLS policy filters
- Check database queries include role filters

**Issue: Cannot create new user**
- Check current user is admin
- Check email not already in use
- Check all required fields provided
- Check Supabase Auth errors

### 8.2 Debug Queries

```sql
-- Check user profile
SELECT * FROM public.user_profiles WHERE email = 'user@example.com';

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'solar_leads';

-- Test RLS as specific user
SET request.jwt.claim.sub = 'user-uuid-here';
SELECT * FROM solar.solar_leads;
RESET request.jwt.claim.sub;

-- Check auth users
SELECT * FROM auth.users WHERE email = 'user@example.com';
```

---

## 9. Security Checklist

### 9.1 Pre-Deployment Security Audit

- [ ] All RLS policies enabled and tested
- [ ] Middleware protecting all authenticated routes
- [ ] No hardcoded credentials in code
- [ ] Environment variables properly set
- [ ] HTTPS enforced in production
- [ ] httpOnly cookies enabled
- [ ] Rate limiting configured
- [ ] Audit logging functional
- [ ] Password requirements enforced
- [ ] No sensitive data in logs
- [ ] Service role key never exposed to client
- [ ] CORS properly configured
- [ ] Security headers configured (CSP, X-Frame-Options, etc.)

### 9.2 Production Monitoring

**Metrics to Track:**
- Failed login attempts per IP
- Authentication errors
- Authorization failures (RLS denials)
- Session creation/destruction rate
- Password reset requests
- User creation rate

---

## 10. Future Enhancements

### 10.1 Potential Features (Out of Scope v1.0)

**Multi-Factor Authentication (MFA):**
- SMS or authenticator app
- Required for admin users
- Optional for other roles

**Single Sign-On (SSO):**
- Google Workspace integration
- Azure AD integration
- SAML 2.0 support

**Advanced Audit Logging:**
- Data retention policies
- Compliance reports
- Suspicious activity alerts

**Granular Permissions:**
- Custom roles beyond 3 defaults
- Permission sets
- Temporary elevated access

**Session Management:**
- View active sessions
- Remote logout
- Device tracking

---

**Document Status:** ✅ Ready for Implementation  
**Next Steps:** Review API Design Document (05)  
**Security Review:** Required before production deployment
