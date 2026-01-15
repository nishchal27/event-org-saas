import { z } from 'zod'
import { router, protectedProcedure } from '@/lib/trpc'
import { TRPCError } from '@trpc/server'

const messageTemplateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  content: z.string().min(1, 'Content is required'),
  type: z.enum(['invitation', 'reminder', 'followup']),
})

export const messageTemplateRouter = router({
  create: protectedProcedure
    .input(messageTemplateSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.organization) {
        throw new TRPCError({ code: 'UNAUTHORIZED' })
      }

      return ctx.prisma.messageTemplate.create({
        data: {
          organizationId: ctx.organization.id,
          name: input.name,
          content: input.content,
          type: input.type,
        },
      })
    }),

  getAll: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.organization) {
      throw new TRPCError({ code: 'UNAUTHORIZED' })
    }

    return ctx.prisma.messageTemplate.findMany({
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

      const template = await ctx.prisma.messageTemplate.findFirst({
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
        data: messageTemplateSchema.partial(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.organization) {
        throw new TRPCError({ code: 'UNAUTHORIZED' })
      }

      const template = await ctx.prisma.messageTemplate.findFirst({
        where: {
          id: input.id,
          organizationId: ctx.organization.id,
        },
      })

      if (!template) {
        throw new TRPCError({ code: 'NOT_FOUND' })
      }

      return ctx.prisma.messageTemplate.update({
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

      const template = await ctx.prisma.messageTemplate.findFirst({
        where: {
          id: input.id,
          organizationId: ctx.organization.id,
        },
      })

      if (!template) {
        throw new TRPCError({ code: 'NOT_FOUND' })
      }

      return ctx.prisma.messageTemplate.delete({
        where: { id: input.id },
      })
    }),
})
