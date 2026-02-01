import { z } from 'zod'
import { router, protectedProcedure } from '@/lib/trpc'
import { TRPCError } from '@trpc/server'
import { getPlanLimits, type PlanType } from '@/lib/plan-limits'
import { getEffectivePlan } from '@/lib/early-access'
import twilio from 'twilio'
import { prisma } from '@/lib/prisma'

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

      const plan = getEffectivePlan(subscription?.plan)
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

      // Get or create attendees for these contacts to get their QR codes
      const attendees = await Promise.all(
        contacts.map(async (contact) => {
          let attendee = await ctx.prisma.attendee.findFirst({
            where: {
              eventId: event.id,
              phone: contact.phone,
            },
          })

          // If attendee doesn't exist, create one (for QR code generation)
          if (!attendee) {
            // Check capacity
            let isWaitlist = false
            if (event.maxCapacity) {
              const confirmedCount = await ctx.prisma.attendee.count({
                where: {
                  eventId: event.id,
                  status: 'confirmed',
                  isWaitlist: false,
                },
              })
              if (confirmedCount >= event.maxCapacity) {
                isWaitlist = true
              }
            }

            // Generate unique QR code
            const generateAttendeeQrCode = () => {
              const timestamp = Date.now().toString(36)
              const random = Math.random().toString(36).substring(2, 9)
              return `att-${timestamp}-${random}`
            }

            let attendeeQrCode = generateAttendeeQrCode()
            let existing = await ctx.prisma.attendee.findUnique({
              where: { attendeeQrCode },
            })
            while (existing) {
              attendeeQrCode = generateAttendeeQrCode()
              existing = await ctx.prisma.attendee.findUnique({
                where: { attendeeQrCode },
              })
            }

            attendee = await ctx.prisma.attendee.create({
              data: {
                eventId: event.id,
                contactId: contact.id,
                name: contact.name,
                phone: contact.phone,
                email: contact.email,
                status: 'pending',
                isWaitlist: isWaitlist,
                attendeeQrCode: attendeeQrCode,
              },
            })
          } else if (!attendee.attendeeQrCode) {
            // Generate QR code for existing attendee without one
            const generateAttendeeQrCode = () => {
              const timestamp = Date.now().toString(36)
              const random = Math.random().toString(36).substring(2, 9)
              return `att-${timestamp}-${random}`
            }

            let attendeeQrCode = generateAttendeeQrCode()
            let existing = await ctx.prisma.attendee.findUnique({
              where: { attendeeQrCode },
            })
            while (existing) {
              attendeeQrCode = generateAttendeeQrCode()
              existing = await ctx.prisma.attendee.findUnique({
                where: { attendeeQrCode },
              })
            }

            attendee = await ctx.prisma.attendee.update({
              where: { id: attendee.id },
              data: { attendeeQrCode },
            })
          }

          return { contact, attendee }
        })
      )

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

      // Send WhatsApp messages via Twilio with QR codes
      const sentCount = await sendWhatsAppMessagesWithQR(ctx.prisma, attendees, message, eventUrl)

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

async function sendWhatsAppMessagesWithQR(
  prismaClient: any,
  attendees: Array<{ contact: { phone: string; name: string }; attendee: { id: string; attendeeQrCode: string | null } }>,
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

  for (const { contact, attendee } of attendees) {
    try {
      // Format phone number to E.164 format
      const toPhone = formatPhoneNumber(contact.phone)
      
      if (!toPhone) {
        errors.push({ phone: contact.phone, error: 'Invalid phone number format' })
        continue
      }

      // Format the message with contact name and event details if placeholders exist
      let personalizedMessage = message
      if (personalizedMessage.includes('{name}')) {
        personalizedMessage = personalizedMessage.replace(/{name}/g, contact.name)
      }
      // Note: Event-specific variables ({eventTitle}, {eventDate}, etc.) should be replaced before calling this function

      // Add QR code info to message if attendee has one
      if (attendee.attendeeQrCode) {
        const qrCodeImageUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/qr/generate?code=${attendee.attendeeQrCode}`
        personalizedMessage += `\n\n📱 *Your Check-in QR Code*\n\nShow this QR code at the event entrance for instant check-in! No need to type anything.`
      }

      // Build status callback URL if webhook is configured
      const statusCallback = process.env.NEXT_PUBLIC_APP_URL
        ? `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/twilio`
        : undefined

      // Prepare message payload
      const messagePayload: any = {
        from: whatsappFrom,
        to: `whatsapp:${toPhone}`,
        body: personalizedMessage,
        statusCallback: statusCallback,
      }

      // If attendee has QR code, attach QR image as media
      if (attendee.attendeeQrCode) {
        const qrCodeImageUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/qr/generate?code=${attendee.attendeeQrCode}`
        messagePayload.mediaUrl = [qrCodeImageUrl]
      }

      // Send WhatsApp message via Twilio
      const twilioMessage = await client.messages.create(messagePayload)

      // Check if message was successfully queued
      if (twilioMessage.sid) {
        sent++
        console.log(`WhatsApp message sent to ${contact.phone} (${toPhone}): ${twilioMessage.sid}`)
        
        // Update attendee's WhatsApp sent status
        await prismaClient.attendee.update({
          where: { id: attendee.id },
          data: {
            whatsappSent: true,
            whatsappSentAt: new Date(),
          },
        }).catch((err: any) => {
          console.warn('Failed to update attendee WhatsApp status:', err)
        })
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
