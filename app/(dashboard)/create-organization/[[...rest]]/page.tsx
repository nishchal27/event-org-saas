'use client'

import { CreateOrganization, OrganizationSwitcher, useOrganizationList } from '@clerk/nextjs'
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

  useEffect(() => {
    // If user already has organizations and is loaded, redirect to dashboard
    if (isLoaded && userMemberships && userMemberships.data && userMemberships.data.length > 0 && !hasRedirected.current) {
      hasRedirected.current = true
      router.push('/dashboard')
    }
  }, [isLoaded, userMemberships, router])

  // Show loading while checking organization status
  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // If user already has organizations, don't show create form (redirect will happen)
  if (userMemberships && userMemberships.data && userMemberships.data.length > 0) {
    return null
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
