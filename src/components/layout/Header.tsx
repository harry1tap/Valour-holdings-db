'use client'

/**
 * Header Component
 * Top navigation bar with logo and user menu
 *
 * Features:
 * - Company branding
 * - User profile dropdown
 * - Logout functionality
 * - Role display
 */

import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { User, LogOut, Settings } from 'lucide-react'

export function Header() {
  const router = useRouter()
  const { profile, isAdmin, loading } = useAuth()
  const supabase = createBrowserClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const getRoleBadgeVariant = () => {
    if (isAdmin) return 'default'
    if (profile?.role === 'account_manager') return 'secondary'
    return 'outline'
  }

  const getRoleLabel = () => {
    switch (profile?.role) {
      case 'admin':
        return 'Admin'
      case 'account_manager':
        return 'Account Manager'
      case 'field_rep':
        return 'Field Rep'
      default:
        return ''
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-background">
      <div className="flex h-16 items-center justify-between px-6">
        {/* Logo and Brand */}
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-primary">Valour Holdings</h1>
          <span className="text-sm text-muted-foreground">
            Lead Dashboard
          </span>
        </div>

        {/* User Menu */}
        <div className="flex items-center gap-4">
          {!loading && profile && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2">
                  <div className="flex flex-col items-end">
                    <span className="text-sm font-medium">
                      {profile.full_name}
                    </span>
                    <Badge variant={getRoleBadgeVariant()} className="text-xs">
                      {getRoleLabel()}
                    </Badge>
                  </div>
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{profile.full_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {profile.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {isAdmin && (
                  <DropdownMenuItem
                    onClick={() => router.push('/settings')}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-red-600 focus:text-red-600"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  )
}
