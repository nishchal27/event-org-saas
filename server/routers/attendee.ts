import { z } from 'zod'
import { router, publicProcedure, protectedProcedure } from '@/lib/trpc'
import { TRPCError } from '@trpc/server'

export const attendeeRouter = router({
  checkIn: protectedProcedure
    .input(
      z.object({
        eventId: z.string(),
        attendeeId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.organization) {
        throw new TRPCError({ code: 'UNAUTHORIZED' })
      }

      const event = await ctx.prisma.event.findFirst({
        where: {
          id: input.eventId,
          organizationId: ctx.organization.id,
        },
      })

      if (!event) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Event not found' })
      }

      const attendee = await ctx.prisma.attendee.findFirst({
        where: {
          id: input.attendeeId,
          eventId: input.eventId,
        },
      })

      if (!attendee) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Attendee not found' })
      }

      return ctx.prisma.attendee.update({
        where: { id: input.attendeeId },
        data: {
          checkedIn: true,
          checkedInAt: new Date(),
          checkInMethod: 'manual',
        },
      })
    }),

  checkInByQR: publicProcedure
    .input(
      z.object({
        qrCode: z.string(),
        phone: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // First try to find by attendee QR code (new method)
      let attendee = await ctx.prisma.attendee.findUnique({
        where: {
          attendeeQrCode: input.qrCode,
        },
        include: {
          event: true,
        },
      })

      // If not found, try event QR code (fallback method)
      if (!attendee) {
        const event = await ctx.prisma.event.findUnique({
          where: {
            qrCode: input.qrCode,
          },
        })

        if (!event) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Invalid QR code' })
        }

        if (!input.phone) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Phone number required for event QR check-in' })
        }

        attendee = await ctx.prisma.attendee.findUnique({
          where: {
            eventId_phone: {
              eventId: event.id,
              phone: input.phone,
            },
          },
          include: {
            event: true,
          },
        })

        if (!attendee) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Attendee not found for this event' })
        }
      }

      if (attendee.checkedIn) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Already checked in' })
      }

      // Determine check-in method
      const checkInMethod = attendee.attendeeQrCode === input.qrCode ? 'qr_scan' : 'event_qr'

      return ctx.prisma.attendee.update({
        where: { id: attendee.id },
        data: {
          checkedIn: true,
          checkedInAt: new Date(),
          checkInMethod: checkInMethod,
        },
      })
    }),

  checkInByAttendeeQR: protectedProcedure
    .input(
      z.object({
        attendeeQrCode: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.organization) {
        throw new TRPCError({ code: 'UNAUTHORIZED' })
      }

      const attendee = await ctx.prisma.attendee.findUnique({
        where: {
          attendeeQrCode: input.attendeeQrCode,
        },
        include: {
          event: true,
        },
      })

      if (!attendee) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Invalid QR code' })
      }

      // Verify attendee belongs to organization's event
      if (attendee.event.organizationId !== ctx.organization.id) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'This QR code is not for your organization' })
      }

      if (attendee.checkedIn) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Already checked in' })
      }

      return ctx.prisma.attendee.update({
        where: { id: attendee.id },
        data: {
          checkedIn: true,
          checkedInAt: new Date(),
          checkInMethod: 'qr_scan',
        },
      })
    }),

  register: publicProcedure
    .input(
      z.object({
        eventSlug: z.string(),
        name: z.string().min(1),
        phone: z.string().min(10),
        email: z.string().email().optional().nullable(),
        status: z.enum(['confirmed', 'declined', 'maybe']),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Find event by slug
      const event = await ctx.prisma.event.findUnique({
        where: {
          publicSlug: input.eventSlug,
        },
      })

      if (!event) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Event not found' })
      }

      if (event.registrationClosed) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Registration for this event is closed',
        })
      }

      // Check if attendee already exists
      const existingAttendee = await ctx.prisma.attendee.findUnique({
        where: {
          eventId_phone: {
            eventId: event.id,
            phone: input.phone,
          },
        },
      })

      if (existingAttendee) {
        // Check capacity when updating to confirmed
        let isWaitlist = existingAttendee.isWaitlist
        if (event.maxCapacity && input.status === 'confirmed' && !existingAttendee.isWaitlist) {
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
        
        // If changing from waitlist to confirmed and there's space, remove from waitlist
        if (existingAttendee.isWaitlist && input.status === 'confirmed' && event.maxCapacity) {
          const confirmedCount = await ctx.prisma.attendee.count({
            where: {
              eventId: event.id,
              status: 'confirmed',
              isWaitlist: false,
            },
          })
          
          if (confirmedCount < event.maxCapacity) {
            isWaitlist = false
          }
        }

        // Generate QR code if attendee doesn't have one
        let attendeeQrCode = existingAttendee.attendeeQrCode
        if (!attendeeQrCode) {
          const generateAttendeeQrCode = () => {
            const timestamp = Date.now().toString(36)
            const random = Math.random().toString(36).substring(2, 9)
            return `att-${timestamp}-${random}`
          }

          attendeeQrCode = generateAttendeeQrCode()
          // Ensure uniqueness
          let existing = await ctx.prisma.attendee.findUnique({
            where: { attendeeQrCode },
          })
          while (existing) {
            attendeeQrCode = generateAttendeeQrCode()
            existing = await ctx.prisma.attendee.findUnique({
              where: { attendeeQrCode },
            })
          }
        }

        // Update existing attendee
        return ctx.prisma.attendee.update({
          where: { id: existingAttendee.id },
          data: {
            name: input.name,
            email: input.email,
            status: input.status,
            isWaitlist: isWaitlist,
            attendeeQrCode: attendeeQrCode,
          },
        })
      }

      // Check capacity if event has maxCapacity set
      let isWaitlist = false
      if (event.maxCapacity && input.status === 'confirmed') {
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

      // Try to find existing contact
      const contact = await ctx.prisma.contact.findFirst({
        where: {
          organizationId: event.organizationId,
          phone: input.phone,
        },
      })

      // Generate unique QR code for attendee
      const generateAttendeeQrCode = () => {
        const timestamp = Date.now().toString(36)
        const random = Math.random().toString(36).substring(2, 9)
        return `att-${timestamp}-${random}`
      }

      let attendeeQrCode = generateAttendeeQrCode()
      // Ensure uniqueness
      let existing = await ctx.prisma.attendee.findUnique({
        where: { attendeeQrCode },
      })
      while (existing) {
        attendeeQrCode = generateAttendeeQrCode()
        existing = await ctx.prisma.attendee.findUnique({
          where: { attendeeQrCode },
        })
      }

      // Create new attendee
      return ctx.prisma.attendee.create({
        data: {
          eventId: event.id,
          contactId: contact?.id,
          name: input.name,
          phone: input.phone,
          email: input.email,
          status: input.status,
          isWaitlist: isWaitlist,
          attendeeQrCode: attendeeQrCode,
        },
      })
    }),
})
