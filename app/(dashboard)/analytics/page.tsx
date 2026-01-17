import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { AnalyticsDashboardClient } from './analytics-dashboard-client'

export default async function AnalyticsPage() {
  const { userId, orgId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  // Check if user is admin
  if (orgId) {
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    })

    if (user) {
      const org = await prisma.organization.findUnique({
        where: { clerkOrgId: orgId },
      })

      if (org) {
        const membership = await prisma.membership.findUnique({
          where: {
            userId_organizationId: {
              userId: user.id,
              organizationId: org.id,
            },
          },
        })

        // Only allow admin access
        const isAdmin = membership?.role === 'admin' || membership?.role === 'org:admin'
        
        if (!isAdmin) {
          redirect('/dashboard')
        }
      }
    }
  } else {
    // No organization selected
    redirect('/create-organization')
  }

  return <AnalyticsDashboardClient />
}
