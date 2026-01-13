import { initTRPC, TRPCError } from '@trpc/server'
import { prisma } from './prisma'
import { auth } from '@clerk/nextjs/server'

export async function createContext(opts: { req?: Request }) {
  // Get auth from Clerk - this works in App Router
  const authData = await auth()
  
  return {
    prisma,
    req: opts.req,
    userId: authData.userId,
    orgId: authData.orgId,
  }
}

const t = initTRPC.context<typeof createContext>().create()

export const router = t.router
export const publicProcedure = t.procedure

export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }

  // Get or create organization
  let organization
  if (ctx.orgId) {
    organization = await ctx.prisma.organization.findUnique({
      where: { clerkOrgId: ctx.orgId },
    })
  }

  if (!organization && ctx.orgId) {
    // Create organization if it doesn't exist
    organization = await ctx.prisma.organization.create({
      data: {
        clerkOrgId: ctx.orgId,
        name: 'My Organization',
      },
    })

    // Create free subscription
    await ctx.prisma.subscription.create({
      data: {
        organizationId: organization.id,
        plan: 'free',
        status: 'active',
      },
    })

    // Initialize usage for current month
    const now = new Date()
    await ctx.prisma.usage.create({
      data: {
        organizationId: organization.id,
        month: now.getMonth() + 1,
        year: now.getFullYear(),
      },
    })
  }

  return next({
    ctx: {
      ...ctx,
      organization,
    },
  })
})
