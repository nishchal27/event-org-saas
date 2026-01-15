import { z } from 'zod'
import { router, protectedProcedure } from '@/lib/trpc'
import { TRPCError } from '@trpc/server'

export const groupRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1, 'Group name is required'),
        description: z.string().optional().nullable(),
        contactIds: z.array(z.string()).default([]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.organization) {
        throw new TRPCError({ code: 'UNAUTHORIZED' })
      }

      return ctx.prisma.contactGroup.create({
        data: {
          organizationId: ctx.organization.id,
          name: input.name,
          description: input.description ?? null,
          contactIds: input.contactIds,
        },
      })
    }),

  getAll: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.organization) {
      throw new TRPCError({ code: 'UNAUTHORIZED' })
    }

    const groups = await ctx.prisma.contactGroup.findMany({
      where: {
        organizationId: ctx.organization.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Get contact details for each group
    const groupsWithContacts = await Promise.all(
      groups.map(async (group) => {
        const contacts = await ctx.prisma.contact.findMany({
          where: {
            id: { in: group.contactIds },
            organizationId: ctx.organization!.id,
          },
        })

        return {
          ...group,
          contacts,
          contactCount: contacts.length,
        }
      })
    )

    return groupsWithContacts
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.organization) {
        throw new TRPCError({ code: 'UNAUTHORIZED' })
      }

      const group = await ctx.prisma.contactGroup.findFirst({
        where: {
          id: input.id,
          organizationId: ctx.organization.id,
        },
      })

      if (!group) {
        throw new TRPCError({ code: 'NOT_FOUND' })
      }

      const contacts = await ctx.prisma.contact.findMany({
        where: {
          id: { in: group.contactIds },
          organizationId: ctx.organization.id,
        },
      })

      return {
        ...group,
        contacts,
        contactCount: contacts.length,
      }
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        data: z.object({
          name: z.string().min(1).optional(),
          description: z.string().optional().nullable(),
          contactIds: z.array(z.string()).optional(),
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.organization) {
        throw new TRPCError({ code: 'UNAUTHORIZED' })
      }

      const group = await ctx.prisma.contactGroup.findFirst({
        where: {
          id: input.id,
          organizationId: ctx.organization.id,
        },
      })

      if (!group) {
        throw new TRPCError({ code: 'NOT_FOUND' })
      }

      return ctx.prisma.contactGroup.update({
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

      const group = await ctx.prisma.contactGroup.findFirst({
        where: {
          id: input.id,
          organizationId: ctx.organization.id,
        },
      })

      if (!group) {
        throw new TRPCError({ code: 'NOT_FOUND' })
      }

      return ctx.prisma.contactGroup.delete({
        where: { id: input.id },
      })
    }),
})
