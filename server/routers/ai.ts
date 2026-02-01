import { z } from 'zod'
import { router, protectedProcedure } from '@/lib/trpc'
import { TRPCError } from '@trpc/server'
import {
  generateSocialMediaPost,
  type Platform,
  type Tone,
  type TargetAudience,
  type CallToAction,
} from '@/lib/ai-engine'
import { getPlanLimits, type PlanType } from '@/lib/plan-limits'
import { getEffectivePlan } from '@/lib/early-access'

export const aiRouter = router({
  // Legacy WhatsApp message generation (kept for backward compatibility)
  generateWhatsAppMessage: protectedProcedure
    .input(
      z.object({
        eventId: z.string(),
        tone: z.enum(['friendly', 'formal', 'casual']).default('friendly'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.organization) {
        throw new TRPCError({ code: 'UNAUTHORIZED' })
      }

      const now = new Date()
      const { usage, subscription, limit, currentCount } = await checkAILimits(
        ctx,
        now
      )

      if (currentCount >= limit) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: `You've reached your monthly AI generation limit (${limit}). Upgrade to continue.`,
        })
      }

      const event = await ctx.prisma.event.findFirst({
        where: {
          id: input.eventId,
          organizationId: ctx.organization.id,
        },
      })

      if (!event) {
        throw new TRPCError({ code: 'NOT_FOUND' })
      }

      const eventUrl = `${process.env.NEXT_PUBLIC_APP_URL}/event/${event.publicSlug}`
      const result = await generateSocialMediaPost(
        {
          title: event.title,
          description: event.description,
          eventDate: event.eventDate,
          endDate: event.endDate,
          startTime: event.startTime,
          endTime: event.endTime,
          location: event.location,
          locationType: event.locationType,
          imageUrl: event.imageUrl,
          additionalNotes: event.additionalNotes,
          publicSlug: event.publicSlug,
        },
        {
          platform: 'whatsapp',
          tone: input.tone,
          eventUrl,
        }
      )

      await updateUsage(ctx, now, 1, result.tokensUsed || 0)

      return { message: result.content }
    }),

  // Enhanced social media post generation with saving
  generatePost: protectedProcedure
    .input(
      z.object({
        eventId: z.string(),
        platform: z.enum(['instagram', 'facebook', 'twitter', 'linkedin', 'whatsapp']),
        tone: z.enum(['friendly', 'formal', 'casual', 'professional', 'excited']).optional(),
        targetAudience: z.enum(['general', 'youth', 'professionals', 'families']).optional(),
        callToAction: z.enum(['register', 'learn-more', 'share', 'attend']).optional(),
        customPrompt: z.string().optional(),
        saveToDb: z.boolean().default(true),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.organization) {
        throw new TRPCError({ code: 'UNAUTHORIZED' })
      }

      const now = new Date()
      const { limit, currentCount } = await checkAILimits(ctx, now)

      if (currentCount >= limit) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: `You've reached your monthly AI generation limit (${limit}). Upgrade to continue.`,
        })
      }

      const event = await ctx.prisma.event.findFirst({
        where: {
          id: input.eventId,
          organizationId: ctx.organization.id,
        },
      })

      if (!event) {
        throw new TRPCError({ code: 'NOT_FOUND' })
      }

      const eventUrl = `${process.env.NEXT_PUBLIC_APP_URL}/event/${event.publicSlug}`
      const startTime = Date.now()

      const result = await generateSocialMediaPost(
        {
          title: event.title,
          description: event.description,
          eventDate: event.eventDate,
          endDate: event.endDate,
          startTime: event.startTime,
          endTime: event.endTime,
          location: event.location,
          locationType: event.locationType,
          imageUrl: event.imageUrl,
          additionalNotes: event.additionalNotes,
          publicSlug: event.publicSlug,
        },
        {
          platform: input.platform,
          tone: input.tone,
          targetAudience: input.targetAudience,
          callToAction: input.callToAction,
          customPrompt: input.customPrompt,
          eventUrl,
        }
      )

      const generationTime = Date.now() - startTime

      // Update usage metrics
      await updateUsage(ctx, now, 1, result.tokensUsed || 0)

      // Save to database if requested
      let savedPost = null
      if (input.saveToDb) {
        savedPost = await ctx.prisma.socialMediaPost.create({
          data: {
            organizationId: ctx.organization.id,
            eventId: input.eventId,
            platform: input.platform,
            content: result.content,
            hashtags: result.hashtags,
            tone: input.tone || null,
            targetAudience: input.targetAudience || null,
            callToAction: input.callToAction || null,
            customPrompt: input.customPrompt || null,
            tokensUsed: result.tokensUsed || null,
            generationTime: generationTime || null,
            status: 'draft',
          },
        })
      }

      return {
        post: result.content,
        hashtags: result.hashtags,
        savedPost,
        tokensUsed: result.tokensUsed,
        generationTime,
      }
    }),

  // Get all posts for an event
  getPostsByEvent: protectedProcedure
    .input(z.object({ eventId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.organization) {
        throw new TRPCError({ code: 'UNAUTHORIZED' })
      }

      // Verify event belongs to organization
      const event = await ctx.prisma.event.findFirst({
        where: {
          id: input.eventId,
          organizationId: ctx.organization.id,
        },
      })

      if (!event) {
        throw new TRPCError({ code: 'NOT_FOUND' })
      }

      return ctx.prisma.socialMediaPost.findMany({
        where: {
          eventId: input.eventId,
          organizationId: ctx.organization.id,
        },
        orderBy: {
          createdAt: 'desc',
        },
      })
    }),

  // Get a single post
  getPostById: protectedProcedure
    .input(z.object({ postId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.organization) {
        throw new TRPCError({ code: 'UNAUTHORIZED' })
      }

      const post = await ctx.prisma.socialMediaPost.findFirst({
        where: {
          id: input.postId,
          organizationId: ctx.organization.id,
        },
        include: {
          event: {
            select: {
              title: true,
              publicSlug: true,
            },
          },
        },
      })

      if (!post) {
        throw new TRPCError({ code: 'NOT_FOUND' })
      }

      return post
    }),

  // Update a post
  updatePost: protectedProcedure
    .input(
      z.object({
        postId: z.string(),
        content: z.string().optional(),
        hashtags: z.array(z.string()).optional(),
        status: z.enum(['draft', 'published', 'archived']).optional(),
        tone: z.enum(['friendly', 'formal', 'casual', 'professional', 'excited']).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.organization) {
        throw new TRPCError({ code: 'UNAUTHORIZED' })
      }

      const post = await ctx.prisma.socialMediaPost.findFirst({
        where: {
          id: input.postId,
          organizationId: ctx.organization.id,
        },
      })

      if (!post) {
        throw new TRPCError({ code: 'NOT_FOUND' })
      }

      return ctx.prisma.socialMediaPost.update({
        where: { id: input.postId },
        data: {
          content: input.content,
          hashtags: input.hashtags,
          status: input.status,
          tone: input.tone,
        },
      })
    }),

  // Delete a post
  deletePost: protectedProcedure
    .input(z.object({ postId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.organization) {
        throw new TRPCError({ code: 'UNAUTHORIZED' })
      }

      const post = await ctx.prisma.socialMediaPost.findFirst({
        where: {
          id: input.postId,
          organizationId: ctx.organization.id,
        },
      })

      if (!post) {
        throw new TRPCError({ code: 'NOT_FOUND' })
      }

      await ctx.prisma.socialMediaPost.delete({
        where: { id: input.postId },
      })

      return { success: true }
    }),

  // Get AI usage stats for admin
  getUsageStats: protectedProcedure.query(async ({ ctx }) => {
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
    const limit = limits.ai
    const currentCount = usage?.aiGenerations || 0
    const tokensUsed = usage?.aiTokensUsed || 0
    const postsGenerated = usage?.postsGenerated || 0

    // Get platform breakdown
    const platformStats = await ctx.prisma.socialMediaPost.groupBy({
      by: ['platform'],
      where: {
        organizationId: ctx.organization.id,
        createdAt: {
          gte: new Date(now.getFullYear(), now.getMonth(), 1),
        },
      },
      _count: {
        platform: true,
      },
    })

    return {
      currentCount,
      limit,
      remaining: Math.max(0, limit - currentCount),
      tokensUsed,
      postsGenerated,
      platformBreakdown: platformStats.map((stat) => ({
        platform: stat.platform,
        count: stat._count.platform,
      })),
    }
  }),

  // Legacy endpoint (kept for backward compatibility)
  generateSocialPost: protectedProcedure
    .input(
      z.object({
        eventId: z.string(),
        platform: z.enum(['instagram', 'facebook', 'whatsapp']),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.organization) {
        throw new TRPCError({ code: 'UNAUTHORIZED' })
      }

      const now = new Date()
      const { limit, currentCount } = await checkAILimits(ctx, now)

      if (currentCount >= limit) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: `You've reached your monthly AI generation limit (${limit}). Upgrade to continue.`,
        })
      }

      const event = await ctx.prisma.event.findFirst({
        where: {
          id: input.eventId,
          organizationId: ctx.organization.id,
        },
      })

      if (!event) {
        throw new TRPCError({ code: 'NOT_FOUND' })
      }

      const eventUrl = `${process.env.NEXT_PUBLIC_APP_URL}/event/${event.publicSlug}`
      const result = await generateSocialMediaPost(
        {
          title: event.title,
          description: event.description,
          eventDate: event.eventDate,
          endDate: event.endDate,
          startTime: event.startTime,
          endTime: event.endTime,
          location: event.location,
          locationType: event.locationType,
          imageUrl: event.imageUrl,
          additionalNotes: event.additionalNotes,
          publicSlug: event.publicSlug,
        },
        {
          platform: input.platform,
          eventUrl,
        }
      )

      await updateUsage(ctx, now, 1, result.tokensUsed || 0)

      return { post: result.content }
    }),
})

// Helper function to check AI limits
async function checkAILimits(ctx: any, now: Date) {
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
  const limit = limits.ai
  const currentCount = usage?.aiGenerations || 0

  return { usage, subscription, limit, currentCount }
}

// Helper function to update usage metrics
async function updateUsage(
  ctx: any,
  now: Date,
  generations: number,
  tokens: number
) {
  await ctx.prisma.usage.upsert({
    where: {
      organizationId_month_year: {
        organizationId: ctx.organization.id,
        month: now.getMonth() + 1,
        year: now.getFullYear(),
      },
    },
    update: {
      aiGenerations: { increment: generations },
      aiTokensUsed: { increment: tokens },
      postsGenerated: { increment: generations },
    },
    create: {
      organizationId: ctx.organization.id,
      month: now.getMonth() + 1,
      year: now.getFullYear(),
      aiGenerations: generations,
      aiTokensUsed: tokens,
      postsGenerated: generations,
    },
  })
}
