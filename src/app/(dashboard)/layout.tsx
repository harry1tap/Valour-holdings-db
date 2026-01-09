/**
 * Dashboard Layout
 * Layout for all authenticated pages
 *
 * Features:
 * - Collapsible sidebar with role-based navigation
 * - Header with theme toggle
 * - Main content area
 * - Responsive design
 */

import { cookies } from "next/headers"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Header } from "@/components/layout/Header"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const sidebarState = cookieStore.get("sidebar_state")
  // Default to true (open) if cookie doesn't exist
  const defaultOpen = sidebarState ? sidebarState.value === "true" : true

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar />
      <SidebarInset>
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
