'use client'

import { CreateOrganization, OrganizationSwitcher, useOrganizationList, useOrganization } from '@clerk/nextjs'
import { useEffect, useRef } from 'react'

export default function CreateOrganizationPage() {
  const hasRedirected = useRef(false)
  const { userMemberships, isLoaded } = useOrganizationList({
    userMemberships: {
      infinite: true,
    },
  })
  const { organization, isLoaded: isOrgLoaded } = useOrganization()

  // When active org is set, full-page redirect so server receives updated session cookie (auth().orgId)
  useEffect(() => {
    if (!isLoaded || !isOrgLoaded || hasRedirected.current || !organization) return
    hasRedirected.current = true
    window.location.href = '/dashboard'
  }, [isLoaded, isOrgLoaded, organization])

  // Show loading while checking organization status
  if (!isLoaded || !isOrgLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // If user already has organizations, show loading while redirect happens
  if (userMemberships && userMemberships.data && userMemberships.data.length > 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Redirecting to dashboard...</p>
        </div>
      </div>
    )
  }

  // If organization exists but memberships haven't loaded yet, also redirect
  if (organization) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Redirecting to dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md space-y-4">
        <div className="flex justify-center">
          <OrganizationSwitcher
            hidePersonal
            afterSelectOrganizationUrl="/dashboard"
            afterCreateOrganizationUrl="/dashboard"
          />
        </div>
        {/* After create, the effect above does full-page redirect so server sees org in session */}
        <CreateOrganization afterCreateOrganizationUrl="/dashboard" />
      </div>
    </div>
  )
}
