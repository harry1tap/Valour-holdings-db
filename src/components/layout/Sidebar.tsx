'use client'

/**
 * Sidebar Component
 * Navigation sidebar with role-based menu items
 *
 * Features:
 * - Role-based navigation (Admin, Account Manager, Field Rep)
 * - Active route highlighting
 * - Mobile responsive (collapsible)
 */

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { cn } from '@/lib/utils/cn'
import { LayoutDashboard, Users, FolderOpen, Settings } from 'lucide-react'

interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
  allowedRoles: ('admin' | 'account_manager' | 'field_rep')[]
}

const navItems: NavItem[] = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: <LayoutDashboard className="h-5 w-5" />,
    allowedRoles: ['admin', 'account_manager', 'field_rep'],
  },
  {
    href: '/leads',
    label: 'Leads',
    icon: <FolderOpen className="h-5 w-5" />,
    allowedRoles: ['admin', 'account_manager', 'field_rep'],
  },
  {
    href: '/team',
    label: 'Team Performance',
    icon: <Users className="h-5 w-5" />,
    allowedRoles: ['admin', 'account_manager'],
  },
  {
    href: '/settings',
    label: 'Settings',
    icon: <Settings className="h-5 w-5" />,
    allowedRoles: ['admin'],
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const { role, loading } = useAuth()

  if (loading || !role) {
    return (
      <aside className="hidden md:flex w-60 flex-col border-r bg-background">
        <div className="p-4 space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-10 bg-muted rounded animate-pulse" />
          ))}
        </div>
      </aside>
    )
  }

  // Filter nav items based on user role
  const visibleNavItems = navItems.filter((item) =>
    item.allowedRoles.includes(role)
  )

  return (
    <aside className="hidden md:flex w-60 flex-col border-r bg-background">
      <nav className="flex-1 space-y-1 p-4">
        {visibleNavItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              {item.icon}
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Footer Info */}
      <div className="border-t p-4">
        <p className="text-xs text-muted-foreground">
          Valour Holdings Dashboard
        </p>
        <p className="text-xs text-muted-foreground">v1.0.0</p>
      </div>
    </aside>
  )
}
