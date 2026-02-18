'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { Sidebar } from '@/components/sidebar'
import { useOrganization, useOrganizationList } from '@clerk/nextjs'
import { DashboardOrgProvider } from './dashboard-org-context'

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
  const { userMemberships, isLoaded: isMembershipsLoaded, setActive } = useOrganizationList({
    userMemberships: {
      infinite: true,
    },
  })
  const redirectAttempts = useRef(0)
  const maxRedirectAttempts = 3
  const hasSetActiveRef = useRef(false)

  // Check if user has any organizations (more reliable than just checking current org)
  const hasAnyOrganization = 
    isMembershipsLoaded && 
    userMemberships?.data && 
    userMemberships.data.length > 0

  useEffect(() => {
    if (!isCreateOrgPage) return

    // Active org already set: redirect so server auth().orgId is set on next request
    if (isLoaded && organization) {
      router.push('/dashboard')
      return
    }

    // User has orgs but no active org: set active org first then full-page nav so the next server request sees auth().orgId
    if (isMembershipsLoaded && hasAnyOrganization && !organization && !hasSetActiveRef.current) {
      const firstOrgId = userMemberships?.data?.[0]?.organization?.id
      if (firstOrgId) {
        hasSetActiveRef.current = true
        setActive({ organization: firstOrgId })
          .then(() => {
            window.location.href = '/dashboard'
          })
          .catch(() => {
            hasSetActiveRef.current = false
            window.location.href = '/dashboard'
          })
      } else {
        window.location.href = '/dashboard'
      }
    }
  }, [isCreateOrgPage, isLoaded, organization, isMembershipsLoaded, hasAnyOrganization, userMemberships?.data, setActive])

  // If user has no organization and is NOT on create-organization page, redirect to create-organization
  useEffect(() => {
    const isDashboardPage = pathname === '/dashboard'
    if (
      isLoaded &&
      isMembershipsLoaded &&
      !organization &&
      !hasAnyOrganization &&
      !isCreateOrgPage &&
      !hasOrganization &&
      !isDashboardPage &&
      redirectAttempts.current < maxRedirectAttempts
    ) {
      const timeout = setTimeout(() => {
        if (redirectAttempts.current < maxRedirectAttempts) {
          redirectAttempts.current++
          router.push('/create-organization')
        }
      }, 2000)
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
    pathname,
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
    <DashboardOrgProvider value={{ hasOrganization }}>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1">{children}</main>
      </div>
    </DashboardOrgProvider>
  )
}
