import { z } from 'zod'
import { router, protectedProcedure } from '@/lib/trpc'
import { TRPCError } from '@trpc/server'

export const whatsappRouter = router({
  sendInvite: protectedProcedure
    .input(
      z.object({
        eventId: z.string(),
        contactIds: z.array(z.string()),
        message: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.organization) {
        throw new TRPCError({ code: 'UNAUTHORIZED' })
      }

      // Check WhatsApp usage limits
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
        free: { whatsapp: 50 },
        monthly: { whatsapp: 500 },
        yearly: { whatsapp: 3000 },
        enterprise: { whatsapp: 999999 },
      }

      const limit = planLimits[subscription?.plan as keyof typeof planLimits]?.whatsapp || 50
      const currentCount = usage?.whatsappSent || 0

      if (currentCount + input.contactIds.length > limit) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: `Sending to ${input.contactIds.length} contacts would exceed your monthly WhatsApp limit (${limit}).`,
        })
      }

      // Get event and contacts
      const event = await ctx.prisma.event.findFirst({
        where: {
          id: input.eventId,
          organizationId: ctx.organization.id,
        },
      })

      if (!event) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Event not found' })
      }

      const contacts = await ctx.prisma.contact.findMany({
        where: {
          id: { in: input.contactIds },
          organizationId: ctx.organization.id,
        },
      })

      // Build WhatsApp message
      const eventUrl = `${process.env.NEXT_PUBLIC_APP_URL}/event/${event.publicSlug}`
      const defaultMessage = `🎉 *${event.title}*\n\n📅 ${new Date(event.eventDate).toLocaleDateString('en-IN')}\n🕐 ${event.startTime}${event.endTime ? ` - ${event.endTime}` : ''}\n📍 ${event.location}\n\n${event.description}\n\n👉 Register: ${eventUrl}`

      const message = input.message || defaultMessage

      // Send WhatsApp messages (implement actual WhatsApp API call)
      const sentCount = await sendWhatsAppMessages(contacts, message, eventUrl)

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
          whatsappSent: { increment: sentCount },
        },
        create: {
          organizationId: ctx.organization.id,
          month: now.getMonth() + 1,
          year: now.getFullYear(),
          whatsappSent: sentCount,
        },
      })

      return { sent: sentCount }
    }),
})

async function sendWhatsAppMessages(
  contacts: Array<{ phone: string; name: string }>,
  message: string,
  eventUrl: string
): Promise<number> {
  // TODO: Implement actual WhatsApp Cloud API integration
  // This is a placeholder
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID

  if (!accessToken || !phoneNumberId) {
    console.warn('WhatsApp credentials not configured')
    return 0
  }

  let sent = 0
  for (const contact of contacts) {
    try {
      // Format phone number (remove +, spaces, etc.)
      const phone = contact.phone.replace(/\D/g, '')

      const response = await fetch(
        `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: phone,
            type: 'text',
            text: {
              body: message.replace(contact.name, contact.name),
            },
          }),
        }
      )

      if (response.ok) {
        sent++
      }
    } catch (error) {
      console.error(`Failed to send WhatsApp to ${contact.phone}:`, error)
    }
  }

  return sent
}
