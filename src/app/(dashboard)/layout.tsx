/**
 * Dashboard Layout
 * Layout for all authenticated pages
 *
 * Features:
 * - Header with user menu
 * - Sidebar with navigation
 * - Main content area
 * - Responsive design
 */

import { Header } from '@/components/layout/Header'
import { Sidebar } from '@/components/layout/Sidebar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1 flex">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto py-6 px-6 max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
