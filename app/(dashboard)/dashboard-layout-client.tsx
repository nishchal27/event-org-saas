'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { Sidebar } from '@/components/sidebar'
import { useOrganization, useOrganizationList } from '@clerk/nextjs'

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
  const { userMemberships, isLoaded: isMembershipsLoaded } = useOrganizationList({
    userMemberships: {
      infinite: true,
    },
  })
  const redirectAttempts = useRef(0)
  const maxRedirectAttempts = 3

  // Check if user has any organizations (more reliable than just checking current org)
  const hasAnyOrganization = 
    isMembershipsLoaded && 
    userMemberships?.data && 
    userMemberships.data.length > 0

  useEffect(() => {
    // If organization is loaded and exists, but we're on create-org page, redirect to dashboard
    if (isLoaded && organization && isCreateOrgPage) {
      router.push('/dashboard')
      return
    }

    // If user has organizations via memberships list, but we're on create-org page, redirect
    if (isMembershipsLoaded && hasAnyOrganization && isCreateOrgPage) {
      router.push('/dashboard')
      return
    }

    // If user has no organization and is NOT on create-organization page, redirect
    // But only if we've confirmed they truly don't have one (after both checks are loaded)
    // Don't redirect if we're on the dashboard page itself (let it render first)
    const isDashboardPage = pathname === '/dashboard'
    if (
      isLoaded && 
      isMembershipsLoaded && 
      !organization && 
      !hasAnyOrganization && 
      !isCreateOrgPage && 
      !hasOrganization &&
      !isDashboardPage && // Don't redirect if already on dashboard
      redirectAttempts.current < maxRedirectAttempts
    ) {
      // Give a small delay to allow webhook processing after org creation
      const timeout = setTimeout(() => {
        if (redirectAttempts.current < maxRedirectAttempts) {
          redirectAttempts.current++
          router.push('/create-organization')
        }
      }, 2000) // Increased delay to allow SSO callback to complete
      
      return () => clearTimeout(timeout)
    }
  }, [
    hasOrganization, 
    isCreateOrgPage, 
    router, 
    organization, 
    isLoaded, 
    isMembershipsLoaded, 
    hasAnyOrganization,
    pathname
  ])

  // For create-organization page, don't show sidebar
  if (isCreateOrgPage) {
    // Show loading while checking organization status
    if (!isLoaded || !isMembershipsLoaded) {
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

  // If no organization, show loading (but give it time to sync after creation)
  // Only show loading if we're sure there's no org after both checks are loaded
  // But allow dashboard page to render first to avoid redirect loops
  const isDashboardPage = pathname === '/dashboard'
  if (
    !hasOrganization && 
    (!isLoaded || !isMembershipsLoaded || (!organization && !hasAnyOrganization)) &&
    !isDashboardPage // Allow dashboard to render first
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            {isLoaded && isMembershipsLoaded ? 'Setting up organization...' : 'Loading...'}
          </p>
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
