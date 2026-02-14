import { z } from 'zod'
import { router, protectedProcedure } from '@/lib/trpc'
import { TRPCError } from '@trpc/server'
import { getPlanLimits, type PlanType } from '@/lib/plan-limits'
import { getEffectivePlan } from '@/lib/early-access'
import { normalizePhoneMixed } from '@/lib/phone'

export const contactRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        phone: z.string().min(10),
        email: z.string().email().optional().nullable(),
        tags: z.array(z.string()).default([]),
        location: z.string().optional().nullable(),
        notes: z.string().optional().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.organization) {
        throw new TRPCError({ code: 'UNAUTHORIZED' })
      }

      // Check contact soft cap (internal abuse protection, not user-facing)
      const subscription = await ctx.prisma.subscription.findUnique({
        where: { organizationId: ctx.organization.id },
      })

      const plan = getEffectivePlan(subscription?.plan)
      const limits = getPlanLimits(plan)
      const softCap = limits.contacts // Internal soft cap (10k default)

      const contactCount = await ctx.prisma.contact.count({
        where: { organizationId: ctx.organization.id },
      })

      // Only enforce soft cap if approaching limit (abuse protection)
      if (contactCount >= softCap) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Contact limit reached. Please contact support if you need to add more contacts.',
        })
      }

      const normalized = normalizePhoneMixed(input.phone)

      return ctx.prisma.contact.create({
        data: {
          organizationId: ctx.organization.id,
          ...input,
          phone: normalized.canonicalForLookup,
          phoneNormalized: normalized.e164OrNull,
        },
      })
    }),

  getAll: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.organization) {
      throw new TRPCError({ code: 'UNAUTHORIZED' })
    }

    return ctx.prisma.contact.findMany({
      where: {
        organizationId: ctx.organization.id,
      },
      orderBy: {
        name: 'asc',
      },
    })
  }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        data: z.object({
          name: z.string().min(1).optional(),
          phone: z.string().min(10).optional(),
          email: z.string().email().optional().nullable(),
          tags: z.array(z.string()).optional(),
          location: z.string().optional().nullable(),
          notes: z.string().optional().nullable(),
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.organization) {
        throw new TRPCError({ code: 'UNAUTHORIZED' })
      }

      const updateData: typeof input.data = { ...input.data }
      if (input.data.phone) {
        const normalized = normalizePhoneMixed(input.data.phone)
        ;(updateData as any).phone = normalized.canonicalForLookup
        ;(updateData as any).phoneNormalized = normalized.e164OrNull
      }

      return ctx.prisma.contact.update({
        where: { id: input.id },
        data: updateData as any,
      })
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.organization) {
        throw new TRPCError({ code: 'UNAUTHORIZED' })
      }

      return ctx.prisma.contact.delete({
        where: { id: input.id },
      })
    }),

  bulkCreate: protectedProcedure
    .input(
      z.object({
        contacts: z.array(
          z.object({
            name: z.string().min(1),
            phone: z.string().min(10),
            email: z.string().email().optional().nullable(),
            tags: z.array(z.string()).default([]),
            location: z.string().optional().nullable(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.organization) {
        throw new TRPCError({ code: 'UNAUTHORIZED' })
      }

      // Check limits
      const subscription = await ctx.prisma.subscription.findUnique({
        where: { organizationId: ctx.organization.id },
      })

      const plan = getEffectivePlan(subscription?.plan)
      const limits = getPlanLimits(plan)
      const softCap = limits.contacts // Internal soft cap

      const contactCount = await ctx.prisma.contact.count({
        where: { organizationId: ctx.organization.id },
      })

      if (contactCount + input.contacts.length > softCap) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: `Adding these contacts would exceed the limit. Please contact support if you need to add more contacts.`,
        })
      }

      return ctx.prisma.contact.createMany({
        data: input.contacts.map((c) => {
          const normalized = normalizePhoneMixed(c.phone)
          return {
          organizationId: ctx.organization!.id,
          ...c,
          phone: normalized.canonicalForLookup,
          phoneNormalized: normalized.e164OrNull,
          }
        }),
        skipDuplicates: true,
      })
    }),
})
