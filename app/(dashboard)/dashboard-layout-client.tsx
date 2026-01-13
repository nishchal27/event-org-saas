'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Sidebar } from '@/components/sidebar'

export function DashboardLayoutClient({
  children,
  hasOrganization,
}: {
  children: React.ReactNode
  hasOrganization: boolean
}) {
  const pathname = usePathname()
  const router = useRouter()
  const isCreateOrgPage = pathname === '/create-organization'

  useEffect(() => {
    // If user has no organization and is NOT on create-organization page, redirect
    if (!hasOrganization && !isCreateOrgPage) {
      router.push('/create-organization')
    }
  }, [hasOrganization, isCreateOrgPage, router])

  // For create-organization page, don't show sidebar
  if (isCreateOrgPage) {
    return <>{children}</>
  }

  // If no organization, show loading (redirect will happen)
  if (!hasOrganization) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1">{children}</main>
    </div>
  )
}
