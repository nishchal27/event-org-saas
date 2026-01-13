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
    if (!ctx.organization) {
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
        // Generate a slug-safe version
        const slug = input.slug.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-|-$/g, '')

        // Create organization in Clerk using API
        const clerkApiKey = process.env.CLERK_SECRET_KEY
        if (!clerkApiKey) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Clerk API key not configured',
          })
        }

        // For now, create organization directly in our DB
        // The organization will be synced with Clerk when:
        // 1. User creates it manually in Clerk Dashboard, OR
        // 2. We implement Clerk's organization creation UI component
        // The webhook will handle the sync when organization.created fires
        
        // Generate a temporary Clerk org ID - this will be replaced by webhook
        // when the org is actually created in Clerk
        const tempClerkOrgId = `pending_${Date.now()}_${Math.random().toString(36).substring(7)}`
        
        console.log('📝 Creating organization in DB. Clerk sync will happen via webhook when org is created in Clerk.')

        // Create organization in DB with temporary Clerk ID
        // This will be updated by webhook when org is created in Clerk
        const organization = await ctx.prisma.organization.create({
          data: {
            clerkOrgId: tempClerkOrgId,
            name: input.name,
            slug: slug,
          },
        })
        
        console.log('✅ Organization created in DB:', organization.id)

        // Create membership
        const membership = await ctx.prisma.membership.upsert({
          where: {
            userId_organizationId: {
              userId: ctx.user.id,
              organizationId: organization.id,
            },
          },
          update: {},
          create: {
            userId: ctx.user.id,
            organizationId: organization.id,
            role: 'admin',
          },
        })

        // Create free subscription if it doesn't exist
        await ctx.prisma.subscription.upsert({
          where: { organizationId: organization.id },
          update: {},
          create: {
            organizationId: organization.id,
            plan: 'free',
            status: 'active',
          },
        })

        // Initialize usage for current month
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
})
