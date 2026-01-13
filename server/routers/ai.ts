import { z } from 'zod'
import { router, protectedProcedure } from '@/lib/trpc'
import { TRPCError } from '@trpc/server'

export const aiRouter = router({
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

      // Check AI usage limits
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
        free: { ai: 5 },
        monthly: { ai: 30 },
        yearly: { ai: 200 },
        enterprise: { ai: 999999 },
      }

      const limit = planLimits[subscription?.plan as keyof typeof planLimits]?.ai || 5
      const currentCount = usage?.aiGenerations || 0

      if (currentCount >= limit) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: `You've reached your monthly AI generation limit (${limit}). Upgrade to continue.`,
        })
      }

      // Get event
      const event = await ctx.prisma.event.findFirst({
        where: {
          id: input.eventId,
          organizationId: ctx.organization.id,
        },
      })

      if (!event) {
        throw new TRPCError({ code: 'NOT_FOUND' })
      }

      // Generate message using AI
      const eventUrl = `${process.env.NEXT_PUBLIC_APP_URL}/event/${event.publicSlug}`
      const generatedMessage = await generateAIMessage(event, input.tone, eventUrl)

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
          aiGenerations: { increment: 1 },
        },
        create: {
          organizationId: ctx.organization.id,
          month: now.getMonth() + 1,
          year: now.getFullYear(),
          aiGenerations: 1,
        },
      })

      return { message: generatedMessage }
    }),

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

      // Check AI usage (same as above)
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
        free: { ai: 5 },
        monthly: { ai: 30 },
        yearly: { ai: 200 },
        enterprise: { ai: 999999 },
      }

      const limit = planLimits[subscription?.plan as keyof typeof planLimits]?.ai || 5
      const currentCount = usage?.aiGenerations || 0

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
      const generatedPost = await generateSocialPost(event, input.platform, eventUrl)

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
          aiGenerations: { increment: 1 },
        },
        create: {
          organizationId: ctx.organization.id,
          month: now.getMonth() + 1,
          year: now.getFullYear(),
          aiGenerations: 1,
        },
      })

      return { post: generatedPost }
    }),
})

async function generateAIMessage(
  event: any,
  tone: string,
  eventUrl: string
): Promise<string> {
  // TODO: Implement actual AI/LLM integration (OpenAI, Anthropic, etc.)
  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    // Fallback to template-based generation
    return `🎉 *${event.title}*\n\n📅 ${new Date(event.eventDate).toLocaleDateString('en-IN')}\n🕐 ${event.startTime}${event.endTime ? ` - ${event.endTime}` : ''}\n📍 ${event.location}\n\n${event.description}\n\n👉 Register: ${eventUrl}`
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are a helpful assistant that creates friendly WhatsApp invitation messages for events in India. Use emojis appropriately and keep the tone ${tone}.`,
          },
          {
            role: 'user',
            content: `Create a WhatsApp invitation message for this event:\nTitle: ${event.title}\nDate: ${new Date(event.eventDate).toLocaleDateString('en-IN')}\nTime: ${event.startTime}${event.endTime ? ` - ${event.endTime}` : ''}\nLocation: ${event.location}\nDescription: ${event.description}\nRegistration Link: ${eventUrl}`,
          },
        ],
        max_tokens: 300,
      }),
    })

    const data = await response.json()
    return data.choices[0]?.message?.content || ''
  } catch (error) {
    console.error('AI generation error:', error)
    // Fallback
    return `🎉 *${event.title}*\n\n📅 ${new Date(event.eventDate).toLocaleDateString('en-IN')}\n🕐 ${event.startTime}${event.endTime ? ` - ${event.endTime}` : ''}\n📍 ${event.location}\n\n${event.description}\n\n👉 Register: ${eventUrl}`
  }
}

async function generateSocialPost(
  event: any,
  platform: string,
  eventUrl: string
): Promise<string> {
  // Similar to above but tailored for social media
  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    // Fallback
    return `${event.title}\n\n📅 ${new Date(event.eventDate).toLocaleDateString('en-IN')}\n🕐 ${event.startTime}\n📍 ${event.location}\n\n${event.description}\n\nRegister: ${eventUrl}`
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are a social media content creator. Create a ${platform} post for an event. Use appropriate hashtags and emojis.`,
          },
          {
            role: 'user',
            content: `Create a ${platform} post for:\n${event.title}\n${new Date(event.eventDate).toLocaleDateString('en-IN')}\n${event.startTime}\n${event.location}\n${event.description}`,
          },
        ],
        max_tokens: 300,
      }),
    })

    const data = await response.json()
    return data.choices[0]?.message?.content || ''
  } catch (error) {
    console.error('AI generation error:', error)
    return `${event.title}\n\n📅 ${new Date(event.eventDate).toLocaleDateString('en-IN')}\n🕐 ${event.startTime}\n📍 ${event.location}\n\n${event.description}\n\nRegister: ${eventUrl}`
  }
}
