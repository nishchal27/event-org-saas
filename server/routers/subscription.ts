import { z } from 'zod'
import { router, protectedProcedure } from '@/lib/trpc'
import { TRPCError } from '@trpc/server'

export const subscriptionRouter = router({
  get: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.organization) {
      throw new TRPCError({ code: 'UNAUTHORIZED' })
    }

    return ctx.prisma.subscription.findUnique({
      where: { organizationId: ctx.organization.id },
    })
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

    const planLimits = {
      free: {
        events: 2,
        contacts: 100,
        whatsapp: 50,
        ai: 5,
      },
      monthly: {
        events: 10,
        contacts: 300,
        whatsapp: 500,
        ai: 30,
      },
      yearly: {
        events: 30,
        contacts: 1000,
        whatsapp: 3000,
        ai: 200,
      },
      enterprise: {
        events: 999999,
        contacts: 999999,
        whatsapp: 999999,
        ai: 999999,
      },
    }

    const limits = planLimits[subscription?.plan as keyof typeof planLimits] || planLimits.free

    return {
      usage: usage || {
        eventsCreated: 0,
        contactsCount: 0,
        whatsappSent: 0,
        aiGenerations: 0,
      },
      limits,
      plan: subscription?.plan || 'free',
    }
  }),
})
