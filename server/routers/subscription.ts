import { z } from 'zod'
import { router, protectedProcedure } from '@/lib/trpc'
import { TRPCError } from '@trpc/server'
import { getPlanLimits, type PlanType } from '@/lib/plan-limits'
import { getEffectivePlan } from '@/lib/early-access'

export const subscriptionRouter = router({
  get: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.organization) {
      throw new TRPCError({ code: 'UNAUTHORIZED' })
    }

    const subscription = await ctx.prisma.subscription.findUnique({
      where: { organizationId: ctx.organization.id },
    })
    const effectivePlan = getEffectivePlan(subscription?.plan)
    return subscription ? { ...subscription, effectivePlan } : null
  }),

  getUsage: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.organization) {
      throw new TRPCError({ code: 'UNAUTHORIZED' })
    }

    const now = new Date()
    const usage = await ctx.prisma.usage.findUnique({
      where: {
        organizationId_month_year: {
          organizationId: ctx.organization.id,
          month: now.getMonth() + 1,
          year: now.getFullYear(),
        },
      },
    })

    const subscription = await ctx.prisma.subscription.findUnique({
      where: { organizationId: ctx.organization.id },
    })

    const plan = getEffectivePlan(subscription?.plan)
    const limits = getPlanLimits(plan)

    return {
      usage: usage || {
        eventsCreated: 0,
        contactsCount: 0,
        whatsappSent: 0,
        aiGenerations: 0,
      },
      limits,
      plan,
    }
  }),
})

