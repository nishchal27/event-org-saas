import { initTRPC, TRPCError } from '@trpc/server'
import { prisma } from './prisma'
import { auth, currentUser } from '@clerk/nextjs/server'
import { getOrCreateUserAndOrg } from './get-user-org'

export async function createContext(opts: { req?: Request }) {
  const authData = await auth()
  const user = await currentUser()

  return {
    prisma,
    req: opts.req,
    userId: authData.userId,
    clerkUser: user,
  }
}

const t = initTRPC.context<typeof createContext>().create()

export const router = t.router
export const publicProcedure = t.procedure

export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }

  const { user, membership, organization } = await getOrCreateUserAndOrg(
    ctx.prisma,
    ctx.userId,
    ctx.clerkUser ?? undefined
  )

  return next({
    ctx: {
      ...ctx,
      user,
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
      message: 'Organization membership required',
    })
  }

  const isAdmin = ctx.membership.role === 'admin' || ctx.membership.role === 'org:admin'

  if (!isAdmin) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Admin access required',
    })
  }

  return next({ ctx })
})
