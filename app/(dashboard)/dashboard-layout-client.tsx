'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Sidebar } from '@/components/sidebar'
import { useOrganization } from '@clerk/nextjs'

export function DashboardLayoutClient({
  children,
  hasOrganization,
}: {
  children: React.ReactNode
  hasOrganization: boolean
}) {
  const pathname = usePathname()
  const router = useRouter()
  const isCreateOrgPage = pathname?.startsWith('/create-organization')
  const { organization, isLoaded } = useOrganization()

  useEffect(() => {
    // If organization is loaded and exists, but we're on create-org page, redirect to dashboard
    if (isLoaded && organization && isCreateOrgPage) {
      router.push('/dashboard')
      return
    }

    // If user has no organization and is NOT on create-organization page, redirect
    if (isLoaded && !organization && !isCreateOrgPage && !hasOrganization) {
      router.push('/create-organization')
    }
  }, [hasOrganization, isCreateOrgPage, router, organization, isLoaded])

  // For create-organization page, don't show sidebar
  if (isCreateOrgPage) {
    // Show loading while checking organization status
    if (!isLoaded) {
      return (
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      )
    }
    return <>{children}</>
  }

  // If no organization, show loading (redirect will happen)
  if (!hasOrganization && (!isLoaded || !organization)) {
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
      <main className="flex-1 md:ml-0">{children}</main>
    </div>
  )
}
