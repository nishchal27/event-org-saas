import { z } from 'zod'
import { router, protectedProcedure } from '@/lib/trpc'
import { TRPCError } from '@trpc/server'
import { getPlanLimits, type PlanType } from '@/lib/plan-limits'
import twilio from 'twilio'

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

      const plan = (subscription?.plan || 'free') as PlanType
      const limits = getPlanLimits(plan)
      const limit = limits.whatsapp
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
      const startDate = new Date(event.eventDate)
      const endDate = event.endDate ? new Date(event.endDate) : null
      const startDateLabel = startDate.toLocaleDateString('en-IN')
      const endDateLabel = endDate ? endDate.toLocaleDateString('en-IN') : null
      const dateLabel =
        endDateLabel && endDateLabel !== startDateLabel
          ? `${startDateLabel} - ${endDateLabel}`
          : startDateLabel
      const timeLabel = event.endTime ? `${event.startTime} - ${event.endTime}` : event.startTime

      const defaultMessage = `🎉 *${event.title}*\n\n📅 ${dateLabel}\n🕐 ${timeLabel}\n📍 ${event.location}\n\n${event.description}\n\n👉 Register: ${eventUrl}`

      const message = input.message || defaultMessage

      // Send WhatsApp messages via Twilio
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

/**
 * Format phone number to E.164 format required by Twilio
 * E.164 format: +[country code][number] (e.g., +919876543210)
 */
function formatPhoneNumber(phone: string): string | null {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '')
  
  // If already starts with +, return as is (assuming it's already in E.164)
  if (phone.startsWith('+')) {
    return phone.replace(/\s/g, '')
  }
  
  // If starts with 0, remove it (common in India)
  const cleaned = digits.startsWith('0') ? digits.substring(1) : digits
  
  // If it's 10 digits, assume it's an Indian number and add +91
  if (cleaned.length === 10) {
    return `+91${cleaned}`
  }
  
  // If it's 12 digits and starts with 91, add +
  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    return `+${cleaned}`
  }
  
  // If it's 11 digits and starts with 1, assume US number
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+${cleaned}`
  }
  
  // If it's already 11-15 digits, try adding + (might be international)
  if (cleaned.length >= 11 && cleaned.length <= 15) {
    return `+${cleaned}`
  }
  
  // Invalid format
  console.warn(`Invalid phone number format: ${phone}`)
  return null
}

async function sendWhatsAppMessages(
  contacts: Array<{ phone: string; name: string }>,
  message: string,
  eventUrl: string
): Promise<number> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const whatsappFrom = process.env.TWILIO_WHATSAPP_FROM // Format: whatsapp:+14155238886

  if (!accountSid || !authToken || !whatsappFrom) {
    console.warn('Twilio WhatsApp credentials not configured')
    console.warn('Required: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM')
    return 0
  }

  // Initialize Twilio client
  const client = twilio(accountSid, authToken)

  let sent = 0
  const errors: Array<{ phone: string; error: string }> = []

  for (const contact of contacts) {
    try {
      // Format phone number to E.164 format
      const toPhone = formatPhoneNumber(contact.phone)
      
      if (!toPhone) {
        errors.push({ phone: contact.phone, error: 'Invalid phone number format' })
        continue
      }

      // Format the message with contact name if placeholder exists
      const personalizedMessage = message.includes('{name}') 
        ? message.replace(/{name}/g, contact.name)
        : message

      // Build status callback URL if webhook is configured
      const statusCallback = process.env.NEXT_PUBLIC_APP_URL
        ? `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/twilio`
        : undefined

      // Send WhatsApp message via Twilio
      const twilioMessage = await client.messages.create({
        from: whatsappFrom, // Must be in format: whatsapp:+14155238886
        to: `whatsapp:${toPhone}`, // Must be in format: whatsapp:+919876543210
        body: personalizedMessage,
        statusCallback: statusCallback, // Optional: for delivery status tracking
      })

      // Check if message was successfully queued
      if (twilioMessage.sid) {
        sent++
        console.log(`WhatsApp message sent to ${contact.phone} (${toPhone}): ${twilioMessage.sid}`)
      } else {
        errors.push({ phone: contact.phone, error: 'Message SID not returned' })
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Unknown error'
      errors.push({ phone: contact.phone, error: errorMessage })
      console.error(`Failed to send WhatsApp to ${contact.phone}:`, errorMessage)
      
      // Log more details for debugging
      if (error.code) {
        console.error(`Twilio error code: ${error.code}`)
      }
      if (error.moreInfo) {
        console.error(`Twilio more info: ${error.moreInfo}`)
      }
    }
  }

  // Log summary
  if (errors.length > 0) {
    console.warn(`WhatsApp sending completed with ${errors.length} error(s):`, errors)
  }

  return sent
}
