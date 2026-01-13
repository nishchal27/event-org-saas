import { z } from 'zod'
import { router, publicProcedure } from '@/lib/trpc'
import { TRPCError } from '@trpc/server'

export const attendeeRouter = router({
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
        // Update existing attendee
        return ctx.prisma.attendee.update({
          where: { id: existingAttendee.id },
          data: {
            name: input.name,
            email: input.email,
            status: input.status,
          },
        })
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
        },
      })
    }),
})
