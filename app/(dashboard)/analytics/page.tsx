import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { AnalyticsDashboardClient } from './analytics-dashboard-client'

export default async function AnalyticsPage() {
  const { userId, orgId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  // Check if user is admin by email first (before org check)
  const clerkUser = await currentUser()
  const userEmail = clerkUser?.emailAddresses?.[0]?.emailAddress?.toLowerCase().trim() || ''
  
  // Get admin emails from environment variable
  const adminEmailsEnv = process.env.NEXT_PUBLIC_ADMIN_EMAILS || ''
  const adminEmails = adminEmailsEnv
    .split(',')
    .map(email => email.trim().toLowerCase())
    .filter(email => email.length > 0)

  // Debug logging
  console.log('[Analytics] Admin check:', {
    userEmail,
    adminEmails,
    adminEmailsEnv: adminEmailsEnv ? 'SET' : 'NOT SET',
    isMatch: adminEmails.includes(userEmail),
    orgId,
  })

  const isAdmin = adminEmails.length > 0 && userEmail && adminEmails.includes(userEmail)

  if (!isAdmin) {
    // Not an admin email, redirect to dashboard
    console.log('[Analytics] Access denied - not admin email, redirecting to dashboard')
    redirect('/dashboard')
  }

  // If admin check passed, allow access even if no org is selected
  // Analytics can work across all organizations for admins
  // If orgId is not set, analytics will show data for all orgs or prompt to select one
  if (!orgId) {
    // Check if user has any organizations in the database
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: {
        memberships: {
          include: {
            organization: true,
          },
        },
      },
    })

    if (!dbUser || dbUser.memberships.length === 0) {
      // No organizations at all, redirect to create
      console.log('[Analytics] No organizations found, redirecting to create-organization')
      redirect('/create-organization')
    } else {
      // User has organizations but none selected - allow access anyway (admin can see all)
      console.log('[Analytics] Admin access granted - no org selected, but user has organizations')
      // Continue to render analytics - it can handle no org selection
    }
  }

  return <AnalyticsDashboardClient />
}
