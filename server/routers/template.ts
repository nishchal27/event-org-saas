import { z } from 'zod'
import { router, protectedProcedure } from '@/lib/trpc'
import { TRPCError } from '@trpc/server'

const eventTemplateSchema = z.object({
  name: z.string().min(1, 'Template name is required'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  locationType: z.enum(['physical', 'online']),
  location: z.string().optional().nullable(),
  startTime: z.string().optional().nullable(),
  endTime: z.string().optional().nullable(),
  additionalNotes: z.string().optional().nullable(),
  customField1Label: z.string().optional().nullable(),
  customField1Value: z.string().optional().nullable(),
  customField2Label: z.string().optional().nullable(),
  customField2Value: z.string().optional().nullable(),
  maxCapacity: z.number().int().positive().optional().nullable(),
})

export const templateRouter = router({
  create: protectedProcedure
    .input(eventTemplateSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.organization) {
        throw new TRPCError({ code: 'UNAUTHORIZED' })
      }

      return ctx.prisma.eventTemplate.create({
        data: {
          organizationId: ctx.organization.id,
          ...input,
        },
      })
    }),

  getAll: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.organization) {
      throw new TRPCError({ code: 'UNAUTHORIZED' })
    }

    return ctx.prisma.eventTemplate.findMany({
      where: {
        organizationId: ctx.organization.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.organization) {
        throw new TRPCError({ code: 'UNAUTHORIZED' })
      }

      const template = await ctx.prisma.eventTemplate.findFirst({
        where: {
          id: input.id,
          organizationId: ctx.organization.id,
        },
      })

      if (!template) {
        throw new TRPCError({ code: 'NOT_FOUND' })
      }

      return template
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        data: eventTemplateSchema.partial(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.organization) {
        throw new TRPCError({ code: 'UNAUTHORIZED' })
      }

      const template = await ctx.prisma.eventTemplate.findFirst({
        where: {
          id: input.id,
          organizationId: ctx.organization.id,
        },
      })

      if (!template) {
        throw new TRPCError({ code: 'NOT_FOUND' })
      }

      return ctx.prisma.eventTemplate.update({
        where: { id: input.id },
        data: input.data,
      })
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.organization) {
        throw new TRPCError({ code: 'UNAUTHORIZED' })
      }

      const template = await ctx.prisma.eventTemplate.findFirst({
        where: {
          id: input.id,
          organizationId: ctx.organization.id,
        },
      })

      if (!template) {
        throw new TRPCError({ code: 'NOT_FOUND' })
      }

      return ctx.prisma.eventTemplate.delete({
        where: { id: input.id },
      })
    }),
})
