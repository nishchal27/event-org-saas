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
        },
      })
    }),

  checkInByQR: publicProcedure
    .input(
      z.object({
        qrCode: z.string(),
        phone: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const event = await ctx.prisma.event.findUnique({
        where: {
          qrCode: input.qrCode,
        },
      })

      if (!event) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Event not found' })
      }

      const attendee = await ctx.prisma.attendee.findUnique({
        where: {
          eventId_phone: {
            eventId: event.id,
            phone: input.phone,
          },
        },
      })

      if (!attendee) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Attendee not found for this event' })
      }

      if (attendee.checkedIn) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Already checked in' })
      }

      return ctx.prisma.attendee.update({
        where: { id: attendee.id },
        data: {
          checkedIn: true,
          checkedInAt: new Date(),
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

        // Update existing attendee
        return ctx.prisma.attendee.update({
          where: { id: existingAttendee.id },
          data: {
            name: input.name,
            email: input.email,
            status: input.status,
            isWaitlist: isWaitlist,
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
        },
      })
    }),
})
