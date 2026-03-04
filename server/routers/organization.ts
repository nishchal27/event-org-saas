import { router, protectedProcedure } from '@/lib/trpc'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'

const createOrganizationSchema = z.object({
  name: z.string().min(1, 'Organization name is required').max(100),
  slug: z
    .string()
    .min(3, 'Slug must be at least 3 characters')
    .max(50, 'Slug must be at most 50 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
})

export const organizationRouter = router({
  getMyOrganizations: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.organization || !ctx.membership) {
      return []
    }
    return [
      {
        id: ctx.organization.id,
        clerkOrgId: ctx.organization.clerkOrgId,
        name: ctx.organization.name,
        slug: ctx.organization.slug,
        role: ctx.membership.role,
        subscription: null as { id: string; plan: string; status: string } | null,
      },
    ]
  }),

  getCurrent: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.organization || !ctx.membership) {
      return null
    }
    return {
      id: ctx.organization.id,
      clerkOrgId: ctx.organization.clerkOrgId,
      name: ctx.organization.name,
      slug: ctx.organization.slug,
      logo: ctx.organization.logo,
      accentColor: ctx.organization.accentColor,
      backgroundColor: ctx.organization.backgroundColor,
      fontStyle: ctx.organization.fontStyle,
      role: ctx.membership.role,
    }
  }),

  create: protectedProcedure
    .input(createOrganizationSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: 'UNAUTHORIZED' })
      }

      if (ctx.organization && ctx.membership) {
        return {
          id: ctx.organization.id,
          clerkOrgId: ctx.organization.clerkOrgId,
          name: ctx.organization.name,
          slug: ctx.organization.slug,
        }
      }

      const slug = input.slug.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-|-$/g, '')

      const existingBySlug = await ctx.prisma.organization.findUnique({
        where: { slug },
      })
      if (existingBySlug) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'An organization with this slug already exists',
        })
      }

      const organization = await ctx.prisma.organization.create({
        data: {
          clerkOrgId: null,
          name: input.name,
          slug,
        },
      })

      await ctx.prisma.membership.create({
        data: {
          userId: ctx.user.id,
          organizationId: organization.id,
          role: 'admin',
        },
      })

      await ctx.prisma.subscription.upsert({
        where: { organizationId: organization.id },
        update: {},
        create: {
          organizationId: organization.id,
          plan: 'free',
          status: 'active',
        },
      })

      const now = new Date()
      await ctx.prisma.usage.upsert({
        where: {
          organizationId_month_year: {
            organizationId: organization.id,
            month: now.getMonth() + 1,
            year: now.getFullYear(),
          },
        },
        update: {},
        create: {
          organizationId: organization.id,
          month: now.getMonth() + 1,
          year: now.getFullYear(),
        },
      })

      return {
        id: organization.id,
        clerkOrgId: organization.clerkOrgId,
        name: organization.name,
        slug: organization.slug,
      }
    }),

  hasOrganization: protectedProcedure.query(async ({ ctx }) => {
    return !!ctx.organization
  }),

  update: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100).optional(),
        slug: z
          .string()
          .min(3)
          .max(50)
          .regex(/^[a-z0-9-]+$/)
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.organization) {
        throw new TRPCError({ code: 'UNAUTHORIZED' })
      }
      if (!input.name && !input.slug) {
        return ctx.organization
      }
      const data: Record<string, unknown> = {}
      if (input.name !== undefined) data.name = input.name
      if (input.slug !== undefined) data.slug = input.slug.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-|-$/g, '')
      const updated = await ctx.prisma.organization.update({
        where: { id: ctx.organization.id },
        data,
      })
      return updated
    }),

  updateCustomization: protectedProcedure
    .input(
      z.object({
        logo: z.string().url().optional().nullable(),
        accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
        backgroundColor: z.enum(['light', 'dark']).optional(),
        fontStyle: z.enum(['default', 'modern', 'classic']).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.organization) {
        throw new TRPCError({ code: 'UNAUTHORIZED' })
      }

      const updateData: Record<string, unknown> = {}
      if (input.logo !== undefined) updateData.logo = input.logo
      if (input.accentColor !== undefined) updateData.accentColor = input.accentColor
      if (input.backgroundColor !== undefined) updateData.backgroundColor = input.backgroundColor
      if (input.fontStyle !== undefined) updateData.fontStyle = input.fontStyle

      const updated = await ctx.prisma.organization.update({
        where: { id: ctx.organization.id },
        data: updateData,
      })

      return {
        logo: updated.logo,
        accentColor: updated.accentColor,
        backgroundColor: updated.backgroundColor,
        fontStyle: updated.fontStyle,
      }
    }),
})
