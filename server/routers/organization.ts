import { router, protectedProcedure } from '@/lib/trpc'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { clerkClient } from '@clerk/nextjs/server'

const createOrganizationSchema = z.object({
  name: z.string().min(1, 'Organization name is required').max(100),
  slug: z
    .string()
    .min(3, 'Slug must be at least 3 characters')
    .max(50, 'Slug must be at most 50 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
})

export const organizationRouter = router({
  // Get current user's organizations
  getMyOrganizations: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: 'UNAUTHORIZED' })
    }

    const memberships = await ctx.prisma.membership.findMany({
      where: { userId: ctx.user.id },
      include: {
        organization: {
          include: {
            subscription: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    return memberships.map((m) => ({
      id: m.organization.id,
      clerkOrgId: m.organization.clerkOrgId,
      name: m.organization.name,
      slug: m.organization.slug,
      role: m.role,
      subscription: m.organization.subscription,
    }))
  }),

  // Get current active organization
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
      role: ctx.membership.role, // Include user's role in organization
    }
  }),

  // Create new organization
  create: protectedProcedure
    .input(createOrganizationSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: 'UNAUTHORIZED' })
      }

      // Check if slug is already taken
      const existingOrg = await ctx.prisma.organization.findUnique({
        where: { slug: input.slug },
      })

      if (existingOrg) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'An organization with this slug already exists',
        })
      }

      try {
        const slug = input.slug.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-|-$/g, '')

        const clerkOrg = await clerkClient.organizations.createOrganization({
          name: input.name,
          slug,
          createdBy: ctx.user.clerkId,
        })

        const organization = await ctx.prisma.organization.upsert({
          where: { clerkOrgId: clerkOrg.id },
          update: {
            name: clerkOrg.name,
            slug: clerkOrg.slug || slug,
            logo: clerkOrg.imageUrl || null,
          },
          create: {
            clerkOrgId: clerkOrg.id,
            name: clerkOrg.name,
            slug: clerkOrg.slug || slug,
            logo: clerkOrg.imageUrl || null,
          },
        })

        await ctx.prisma.membership.upsert({
          where: {
            userId_organizationId: {
              userId: ctx.user.id,
              organizationId: organization.id,
            },
          },
          update: { role: 'admin' },
          create: {
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
      } catch (error: any) {
        console.error('Error creating organization:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Failed to create organization',
        })
      }
    }),

  // Check if user has any organizations
  hasOrganization: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) {
      return false
    }

    const count = await ctx.prisma.membership.count({
      where: { userId: ctx.user.id },
    })

    return count > 0
  }),

  // Update organization customization settings
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

      const updateData: any = {}
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
