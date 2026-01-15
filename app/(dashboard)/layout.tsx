import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { DashboardLayoutClient } from './dashboard-layout-client'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId, orgId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  // Ensure user exists in DB (fallback if webhook didn't run yet)
  const dbUser = await prisma.user.findUnique({
    where: { clerkId: userId },
  })

  if (!dbUser) {
    const clerkUser = await currentUser()
    const email = clerkUser?.emailAddresses?.[0]?.emailAddress || ''
    const name =
      clerkUser?.firstName && clerkUser?.lastName
        ? `${clerkUser.firstName} ${clerkUser.lastName}`.trim()
        : clerkUser?.firstName || clerkUser?.lastName || null

    await prisma.user.create({
      data: {
        clerkId: userId,
        email,
        name,
      },
    })
  }

  const hasOrganization = !!orgId

  return (
    <DashboardLayoutClient hasOrganization={hasOrganization}>
      {children}
    </DashboardLayoutClient>
  )
}
