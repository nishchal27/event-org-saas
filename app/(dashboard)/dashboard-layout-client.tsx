'use client'

import { usePathname } from 'next/navigation'
import { Sidebar } from '@/components/sidebar'
import { DashboardOrgProvider } from './dashboard-org-context'
import type { CurrentOrg } from './dashboard-org-context'

export function DashboardLayoutClient({
  children,
  currentOrg,
}: {
  children: React.ReactNode
  currentOrg: CurrentOrg
}) {
  const pathname = usePathname()
  const isCreateOrgPage = pathname?.startsWith('/create-organization')

  // Create-organization route: show children without sidebar (e.g. simple "name workspace" or redirect)
  if (isCreateOrgPage) {
    return <>{children}</>
  }

  return (
    <DashboardOrgProvider
      value={{
        hasOrganization: true,
        currentOrg: { id: currentOrg.id, name: currentOrg.name },
      }}
    >
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1">{children}</main>
      </div>
    </DashboardOrgProvider>
  )
}
