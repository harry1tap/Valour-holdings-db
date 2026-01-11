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

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { cn } from '@/lib/utils/cn'
import { LayoutDashboard, Users, FolderOpen, Settings, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

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
  const [showError, setShowError] = useState(false)

  // Debug logging
  console.log('Sidebar Debug:', { role, loading, showError })

  // If loading for more than 5 seconds, show error
  useEffect(() => {
    if (loading) {
      console.log('Sidebar: Loading state active, starting timeout...')
      const timeout = setTimeout(() => {
        console.log('Sidebar: Loading timeout reached, showing error')
        setShowError(true)
      }, 5000)
      return () => {
        console.log('Sidebar: Clearing timeout')
        clearTimeout(timeout)
      }
    } else {
      console.log('Sidebar: Not loading, clearing error state')
      setShowError(false)
    }
  }, [loading])

  // Error state - loading took too long
  if (showError) {
    console.log('Sidebar: Rendering error state')
    return (
      <aside className="flex w-60 flex-col border-r bg-background p-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Navigation Error</AlertTitle>
          <AlertDescription>
            Unable to load navigation. Please refresh the page.
          </AlertDescription>
        </Alert>
      </aside>
    )
  }

  // Loading state
  if (loading || !role) {
    console.log('Sidebar: Rendering loading state')
    return (
      <aside className="flex w-60 flex-col border-r bg-background">
        <div className="p-4 space-y-2">
          <div className="text-xs text-muted-foreground mb-3">
            Loading navigation...
          </div>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-10 bg-muted animate-pulse rounded-lg"
            />
          ))}
        </div>
      </aside>
    )
  }

  // Filter nav items based on user role
  // Installers don't have dashboard navigation access
  const visibleNavItems = role && role !== 'installer'
    ? navItems.filter((item) => item.allowedRoles.includes(role as 'admin' | 'account_manager' | 'field_rep'))
    : []

  console.log('Sidebar: Rendering normal state with navigation', {
    role,
    visibleItemsCount: visibleNavItems.length,
  })

  return (
    <aside className="flex w-60 flex-col border-r bg-background">
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
