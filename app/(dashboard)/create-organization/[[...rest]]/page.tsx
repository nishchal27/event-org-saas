'use client'

import { CreateOrganization, OrganizationSwitcher, useOrganizationList, useOrganization } from '@clerk/nextjs'
import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

export default function CreateOrganizationPage() {
  const router = useRouter()
  const hasRedirected = useRef(false)
  const { userMemberships, isLoaded } = useOrganizationList({
    userMemberships: {
      infinite: true,
    },
  })
  const { organization, isLoaded: isOrgLoaded } = useOrganization()

  useEffect(() => {
    // If user already has organizations and is loaded, redirect to dashboard
    // Give a small delay to allow webhook processing
    if (
      isLoaded && 
      isOrgLoaded &&
      userMemberships && 
      userMemberships.data && 
      userMemberships.data.length > 0 && 
      !hasRedirected.current
    ) {
      hasRedirected.current = true
      // Small delay to ensure webhook has processed
      setTimeout(() => {
        router.push('/dashboard')
      }, 500)
    }
    
    // Also check if organization is set (even if memberships list hasn't updated)
    if (isOrgLoaded && organization && !hasRedirected.current) {
      hasRedirected.current = true
      setTimeout(() => {
        router.push('/dashboard')
      }, 500)
    }
  }, [isLoaded, isOrgLoaded, userMemberships, organization, router])

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
        <CreateOrganization afterCreateOrganizationUrl="/dashboard" />
      </div>
    </div>
  )
}
