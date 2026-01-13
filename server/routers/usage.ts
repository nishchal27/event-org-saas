import { router, protectedProcedure } from '@/lib/trpc'
import { TRPCError } from '@trpc/server'

export const usageRouter = router({
  getCurrent: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.organization) {
      throw new TRPCError({ code: 'UNAUTHORIZED' })
    }

    const now = new Date()
    return ctx.prisma.usage.findUnique({
      where: {
        organizationId_month_year: {
          organizationId: ctx.organization.id,
          month: now.getMonth() + 1,
          year: now.getFullYear(),
        },
      },
    })
  }),
})
