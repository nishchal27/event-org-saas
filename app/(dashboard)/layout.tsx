import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/sidebar'
import { prisma } from '@/lib/prisma'
import { DashboardLayoutClient } from './dashboard-layout-client'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  // Check if user has any organization
  const dbUser = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: {
      memberships: {
        take: 1,
      },
    },
  })

  // If user doesn't exist in DB, create them (fallback)
  if (!dbUser) {
    const clerkUser = await currentUser()
    const email = clerkUser?.emailAddresses?.[0]?.emailAddress || ''
    const name = clerkUser?.firstName && clerkUser?.lastName
      ? `${clerkUser.firstName} ${clerkUser.lastName}`.trim()
      : clerkUser?.firstName || clerkUser?.lastName || null

    // Create user
    await prisma.user.create({
      data: {
        clerkId: userId,
        email,
        name,
      },
    })

    // Redirect to create organization
    redirect('/create-organization')
  }

  // If user has no organizations, redirect to create organization
  // BUT: Skip this check if we're already on create-organization page
  // We'll handle this in the client component to avoid redirect loop
  const hasOrganization = dbUser.memberships && dbUser.memberships.length > 0

  return (
    <DashboardLayoutClient hasOrganization={hasOrganization}>
      {children}
    </DashboardLayoutClient>
  )
}
