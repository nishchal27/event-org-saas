import { initTRPC, TRPCError } from '@trpc/server'
import { prisma } from './prisma'
import { auth, currentUser } from '@clerk/nextjs/server'

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
