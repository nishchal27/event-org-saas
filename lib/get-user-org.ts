import type { PrismaClient, User, Membership, Organization } from '@prisma/client'

const DEFAULT_ORG_NAME = 'My Events'

/**
 * Get or create the signed-in user and their single organization.
 * Used by dashboard layout and tRPC protectedProcedure so org resolution lives in one place.
 * New orgs are DB-only (no Clerk org); clerkOrgId is left null.
 */
export async function getOrCreateUserAndOrg(
  prisma: PrismaClient,
  clerkUserId: string,
  clerkUser?: { emailAddresses?: Array<{ emailAddress: string }>; firstName?: string | null; lastName?: string | null } | null
): Promise<{ user: User; membership: Membership; organization: Organization }> {
  // Get or create User
  let user = await prisma.user.findUnique({
    where: { clerkId: clerkUserId },
  })

  if (!user) {
    const email = clerkUser?.emailAddresses?.[0]?.emailAddress ?? ''
    const name =
      clerkUser?.firstName && clerkUser?.lastName
        ? `${clerkUser.firstName} ${clerkUser.lastName}`.trim()
        : clerkUser?.firstName ?? clerkUser?.lastName ?? null

    user = await prisma.user.create({
      data: {
        clerkId: clerkUserId,
        email,
        name,
      },
    })
  }

  // Get existing membership (single org per user)
  const membership = await prisma.membership.findFirst({
    where: { userId: user.id },
    include: { organization: true },
    orderBy: { createdAt: 'asc' },
  })

  if (membership) {
    return {
      user,
      membership,
      organization: membership.organization,
    }
  }

  // Create single org + membership + subscription + usage (DB-only, no Clerk org)
  const uniqueSlug = `workspace-${user.id.slice(-8)}-${Date.now().toString(36)}`
  const organization = await prisma.organization.create({
    data: {
      clerkOrgId: null,
      name: DEFAULT_ORG_NAME,
      slug: uniqueSlug,
    },
  })

  const newMembership = await prisma.membership.create({
    data: {
      userId: user.id,
      organizationId: organization.id,
      role: 'admin',
    },
    include: { organization: true },
  })

  await prisma.subscription.upsert({
    where: { organizationId: organization.id },
    update: {},
    create: {
      organizationId: organization.id,
      plan: 'free',
      status: 'active',
    },
  })

  const now = new Date()
  await prisma.usage.upsert({
    where: {
      organizationId_month_year: {
        organizationId: organization.id,
        month: now.getMonth() + 1,
        year: now.getFullYear(),
      },
    },
    update: {},
    create: {
      organizationId: organization.id,
      month: now.getMonth() + 1,
      year: now.getFullYear(),
    },
  })

  return {
    user,
    membership: newMembership,
    organization,
  }
}
