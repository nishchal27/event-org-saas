import { z } from 'zod'
import { router, protectedProcedure, publicProcedure } from '@/lib/trpc'
import { TRPCError } from '@trpc/server'
import { generateSlug } from '@/lib/utils'

const eventSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  imageUrl: z.string().url().optional().nullable(),
  eventDate: z.string(),
  startTime: z.string(),
  endTime: z.string().optional().nullable(),
  locationType: z.enum(['physical', 'online']),
  location: z.string().min(1, 'Location is required'),
  description: z.string().min(1, 'Description is required'),
  additionalNotes: z.string().optional().nullable(),
  audienceType: z.enum(['all', 'selected', 'public']),
  customField1Label: z.string().optional().nullable(),
  customField1Value: z.string().optional().nullable(),
  customField2Label: z.string().optional().nullable(),
  customField2Value: z.string().optional().nullable(),
})

export const eventRouter = router({
  create: protectedProcedure
    .input(eventSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.organization) {
        throw new TRPCError({ code: 'UNAUTHORIZED' })
      }

      // Check usage limits
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
        free: { events: 2 },
        monthly: { events: 10 },
        yearly: { events: 30 },
        enterprise: { events: 999999 },
      }

      const limit = planLimits[subscription?.plan as keyof typeof planLimits]?.events || 2
      const currentCount = usage?.eventsCreated || 0

      if (currentCount >= limit) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: `You've reached your monthly event limit (${limit}). Upgrade to create more events.`,
        })
      }

      const event = await ctx.prisma.event.create({
        data: {
          organizationId: ctx.organization.id,
          title: input.title,
          imageUrl: input.imageUrl,
          eventDate: new Date(input.eventDate),
          startTime: input.startTime,
          endTime: input.endTime,
          locationType: input.locationType,
          location: input.location,
          description: input.description,
          additionalNotes: input.additionalNotes,
          audienceType: input.audienceType,
          isPublic: input.audienceType === 'public',
          publicSlug: generateSlug(),
          customField1Label: input.customField1Label,
          customField1Value: input.customField1Value,
          customField2Label: input.customField2Label,
          customField2Value: input.customField2Value,
        },
      })

      // Update usage
      await ctx.prisma.usage.upsert({
        where: {
          organizationId_month_year: {
            organizationId: ctx.organization.id,
            month: now.getMonth() + 1,
            year: now.getFullYear(),
          },
        },
        update: {
          eventsCreated: { increment: 1 },
        },
        create: {
          organizationId: ctx.organization.id,
          month: now.getMonth() + 1,
          year: now.getFullYear(),
          eventsCreated: 1,
        },
      })

      return event
    }),

  getAll: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.organization) {
      throw new TRPCError({ code: 'UNAUTHORIZED' })
    }

    return ctx.prisma.event.findMany({
      where: {
        organizationId: ctx.organization.id,
        deletedAt: null,
      },
      orderBy: {
        eventDate: 'desc',
      },
      include: {
        _count: {
          select: {
            attendees: true,
          },
        },
      },
    })
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.organization) {
        throw new TRPCError({ code: 'UNAUTHORIZED' })
      }

      const event = await ctx.prisma.event.findFirst({
        where: {
          id: input.id,
          organizationId: ctx.organization.id,
        },
        include: {
          attendees: {
            include: {
              contact: true,
            },
          },
          selectedContacts: {
            include: {
              contact: true,
            },
          },
          _count: {
            select: {
              attendees: true,
            },
          },
        },
      })

      if (!event) {
        throw new TRPCError({ code: 'NOT_FOUND' })
      }

      return event
    }),

  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const event = await ctx.prisma.event.findUnique({
        where: {
          publicSlug: input.slug,
        },
        include: {
          organization: {
            select: {
              name: true,
              logo: true,
              accentColor: true,
              backgroundColor: true,
              fontStyle: true,
            },
          },
        },
      })

      if (!event) {
        throw new TRPCError({ code: 'NOT_FOUND' })
      }

      return event
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        data: eventSchema.partial(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.organization) {
        throw new TRPCError({ code: 'UNAUTHORIZED' })
      }

      const event = await ctx.prisma.event.findFirst({
        where: {
          id: input.id,
          organizationId: ctx.organization.id,
        },
      })

      if (!event) {
        throw new TRPCError({ code: 'NOT_FOUND' })
      }

      return ctx.prisma.event.update({
        where: { id: input.id },
        data: {
          ...input.data,
          eventDate: input.data.eventDate ? new Date(input.data.eventDate) : undefined,
        },
      })
    }),

  duplicate: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.organization) {
        throw new TRPCError({ code: 'UNAUTHORIZED' })
      }

      const original = await ctx.prisma.event.findFirst({
        where: {
          id: input.id,
          organizationId: ctx.organization.id,
        },
      })

      if (!original) {
        throw new TRPCError({ code: 'NOT_FOUND' })
      }

      // Check usage limits (same as create)
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
        free: { events: 2 },
        monthly: { events: 10 },
        yearly: { events: 30 },
        enterprise: { events: 999999 },
      }

      const limit = planLimits[subscription?.plan as keyof typeof planLimits]?.events || 2
      const currentCount = usage?.eventsCreated || 0

      if (currentCount >= limit) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: `You've reached your monthly event limit (${limit}). Upgrade to create more events.`,
        })
      }

      const duplicated = await ctx.prisma.event.create({
        data: {
          organizationId: ctx.organization.id,
          title: `${original.title} (Copy)`,
          imageUrl: original.imageUrl,
          eventDate: original.eventDate,
          startTime: original.startTime,
          endTime: original.endTime,
          locationType: original.locationType,
          location: original.location,
          description: original.description,
          additionalNotes: original.additionalNotes,
          audienceType: original.audienceType,
          isPublic: original.isPublic,
          publicSlug: generateSlug(),
          customField1Label: original.customField1Label,
          customField1Value: original.customField1Value,
          customField2Label: original.customField2Label,
          customField2Value: original.customField2Value,
        },
      })

      // Update usage
      await ctx.prisma.usage.upsert({
        where: {
          organizationId_month_year: {
            organizationId: ctx.organization.id,
            month: now.getMonth() + 1,
            year: now.getFullYear(),
          },
        },
        update: {
          eventsCreated: { increment: 1 },
        },
        create: {
          organizationId: ctx.organization.id,
          month: now.getMonth() + 1,
          year: now.getFullYear(),
          eventsCreated: 1,
        },
      })

      return duplicated
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.organization) {
        throw new TRPCError({ code: 'UNAUTHORIZED' })
      }

      const event = await ctx.prisma.event.findFirst({
        where: {
          id: input.id,
          organizationId: ctx.organization.id,
        },
      })

      if (!event) {
        throw new TRPCError({ code: 'NOT_FOUND' })
      }

      // Soft delete
      return ctx.prisma.event.update({
        where: { id: input.id },
        data: {
          deletedAt: new Date(),
        },
      })
    }),

  toggleRegistration: protectedProcedure
    .input(z.object({ id: z.string(), closed: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.organization) {
        throw new TRPCError({ code: 'UNAUTHORIZED' })
      }

      return ctx.prisma.event.update({
        where: { id: input.id },
        data: {
          registrationClosed: input.closed,
        },
      })
    }),
})
