import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getOrCreateUserAndOrg } from '@/lib/get-user-org'
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

  const clerkUser = await currentUser()
  const { organization } = await getOrCreateUserAndOrg(prisma, userId, clerkUser ?? undefined)

  const currentOrg = {
    id: organization.id,
    name: organization.name,
  }

  return (
    <DashboardLayoutClient currentOrg={currentOrg}>
      {children}
    </DashboardLayoutClient>
  )
}
