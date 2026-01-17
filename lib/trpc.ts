import { initTRPC, TRPCError } from '@trpc/server'
import { prisma } from './prisma'
import { auth, currentUser, clerkClient } from '@clerk/nextjs/server'

export async function createContext(opts: { req?: Request }) {
  // Get auth from Clerk - this works in App Router
  const authData = await auth()
  const user = await currentUser()
  
  return {
    prisma,
    req: opts.req,
    userId: authData.userId,
    orgId: authData.orgId,
    clerkUser: user, // For getting email/name on first login
  }
}

const t = initTRPC.context<typeof createContext>().create()

export const router = t.router
export const publicProcedure = t.procedure

export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }

  // Get or create User in DB
  let dbUser = await ctx.prisma.user.findUnique({
    where: { clerkId: ctx.userId },
  })

  if (!dbUser) {
    // Create user on first access (fallback if webhook didn't fire)
    const email = ctx.clerkUser?.emailAddresses?.[0]?.emailAddress || ''
    const name = ctx.clerkUser?.firstName && ctx.clerkUser?.lastName
      ? `${ctx.clerkUser.firstName} ${ctx.clerkUser.lastName}`.trim()
      : ctx.clerkUser?.firstName || ctx.clerkUser?.lastName || null

    dbUser = await ctx.prisma.user.create({
      data: {
        clerkId: ctx.userId,
        email,
        name,
      },
    })
  }

  // Resolve organization via Membership
  // If orgId is in session, use it; otherwise get user's first organization
  let organization = null
  let membership = null

  if (ctx.orgId) {
    // Find organization by Clerk org ID
    const org = await ctx.prisma.organization.findUnique({
      where: { clerkOrgId: ctx.orgId },
    })

    if (org) {
      // Find membership
      membership = await ctx.prisma.membership.findUnique({
        where: {
          userId_organizationId: {
            userId: dbUser.id,
            organizationId: org.id,
          },
        },
      })

      if (membership) {
        organization = org
      }
    }
  }

  // If no organization found via orgId, try syncing from Clerk
  if (ctx.orgId && !organization) {
    try {
      const clerkOrg = await clerkClient.organizations.getOrganization({
        organizationId: ctx.orgId,
      })

      if (!clerkOrg) {
        console.warn('Organization not found in Clerk:', ctx.orgId)
      } else {
        const syncedOrg = await ctx.prisma.organization.upsert({
          where: { clerkOrgId: ctx.orgId },
          update: {
            name: clerkOrg.name,
            slug: clerkOrg.slug || clerkOrg.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            logo: clerkOrg.imageUrl || null,
          },
          create: {
            clerkOrgId: ctx.orgId,
            name: clerkOrg.name,
            slug: clerkOrg.slug || clerkOrg.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            logo: clerkOrg.imageUrl || null,
          },
        })

        try {
          // Get membership list and filter for current user
          const membershipList = await clerkClient.organizations.getOrganizationMembershipList({
            organizationId: ctx.orgId,
            limit: 100, // Get enough to find the user
          })

          // Find the membership for the current user
          const userMembership = membershipList.data?.find(
            (m) => m.publicUserData?.userId === ctx.userId
          )
          const clerkRoleRaw = userMembership?.role || 'member'
          const clerkRole = clerkRoleRaw.replace(/^org:/, '')

          membership = await ctx.prisma.membership.upsert({
            where: {
              userId_organizationId: {
                userId: dbUser.id,
                organizationId: syncedOrg.id,
              },
            },
            update: { role: clerkRole },
            create: {
              userId: dbUser.id,
              organizationId: syncedOrg.id,
              role: clerkRole,
            },
          })

          organization = syncedOrg
        } catch (membershipError) {
          console.warn('Failed to get membership from Clerk, creating default:', membershipError)
          // Create membership with default role if Clerk API fails
          membership = await ctx.prisma.membership.upsert({
            where: {
              userId_organizationId: {
                userId: dbUser.id,
                organizationId: syncedOrg.id,
              },
            },
            update: {},
            create: {
              userId: dbUser.id,
              organizationId: syncedOrg.id,
              role: 'member',
            },
          })
          organization = syncedOrg
        }
      }
    } catch (error) {
      console.warn('Failed to sync organization from Clerk:', error)
      // Don't throw - allow the flow to continue with null organization
      // The mutation will handle the missing organization error
    }
  }

  // If no organization found via orgId, get user's first organization
  if (!organization) {
    membership = await ctx.prisma.membership.findFirst({
      where: { userId: dbUser.id },
      include: { organization: true },
      orderBy: { createdAt: 'asc' },
    })

    if (membership) {
      organization = membership.organization
    }
  }

  // Organization is required for protected routes
  // Return null if no organization - caller should redirect to create org
  return next({
    ctx: {
      ...ctx,
      user: dbUser,
      organization,
      membership,
    },
  })
})

// Admin-only procedure - requires admin role in organization
export const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (!ctx.organization || !ctx.membership) {
    throw new TRPCError({ 
      code: 'UNAUTHORIZED',
      message: 'Organization membership required'
    })
  }

  // Check if user is admin
  const isAdmin = ctx.membership.role === 'admin' || ctx.membership.role === 'org:admin'
  
  if (!isAdmin) {
    throw new TRPCError({ 
      code: 'FORBIDDEN',
      message: 'Admin access required'
    })
  }

  return next({ ctx })
})