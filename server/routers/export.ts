import { z } from 'zod'
import { router, protectedProcedure } from '@/lib/trpc'
import { TRPCError } from '@trpc/server'

export const exportRouter = router({
  exportEvents: protectedProcedure
    .input(
      z.object({
        format: z.enum(['csv']).default('csv'),
      })
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.organization) {
        throw new TRPCError({ code: 'UNAUTHORIZED' })
      }

      const events = await ctx.prisma.event.findMany({
        where: {
          organizationId: ctx.organization.id,
          deletedAt: null,
        },
        include: {
          _count: {
            select: {
              attendees: true,
            },
          },
        },
        orderBy: {
          eventDate: 'desc',
        },
      })

      if (input.format === 'csv') {
        const headers = [
          'Title',
          'Date',
          'Start Time',
          'End Time',
          'Location',
          'Location Type',
          'Attendees',
          'Max Capacity',
          'Status',
          'Created At',
        ]

        const rows = events.map((event) => [
          event.title,
          event.eventDate.toISOString().split('T')[0],
          event.startTime,
          event.endTime || '',
          event.location,
          event.locationType,
          event._count.attendees.toString(),
          event.maxCapacity?.toString() || '',
          event.registrationClosed ? 'Closed' : 'Open',
          event.createdAt.toISOString(),
        ])

        const csv = [headers, ...rows]
          .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
          .join('\n')

        return { data: csv, format: 'csv', filename: `events-${Date.now()}.csv` }
      }

      throw new TRPCError({ code: 'BAD_REQUEST', message: 'Unsupported format' })
    }),

  exportContacts: protectedProcedure
    .input(
      z.object({
        format: z.enum(['csv']).default('csv'),
      })
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.organization) {
        throw new TRPCError({ code: 'UNAUTHORIZED' })
      }

      const contacts = await ctx.prisma.contact.findMany({
        where: {
          organizationId: ctx.organization.id,
        },
        include: {
          _count: {
            select: {
              attendees: true,
            },
          },
        },
        orderBy: {
          name: 'asc',
        },
      })

      if (input.format === 'csv') {
        const headers = ['Name', 'Phone', 'Email', 'Location', 'Tags', 'Events Attended', 'Created At']

        const rows = contacts.map((contact) => [
          contact.name,
          contact.phone,
          contact.email || '',
          contact.location || '',
          contact.tags.join('; '),
          contact._count.attendees.toString(),
          contact.createdAt.toISOString(),
        ])

        const csv = [headers, ...rows]
          .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
          .join('\n')

        return { data: csv, format: 'csv', filename: `contacts-${Date.now()}.csv` }
      }

      throw new TRPCError({ code: 'BAD_REQUEST', message: 'Unsupported format' })
    }),

  exportEventAttendance: protectedProcedure
    .input(
      z.object({
        eventId: z.string(),
        format: z.enum(['csv']).default('csv'),
      })
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.organization) {
        throw new TRPCError({ code: 'UNAUTHORIZED' })
      }

      const event = await ctx.prisma.event.findFirst({
        where: {
          id: input.eventId,
          organizationId: ctx.organization.id,
        },
        include: {
          attendees: {
            orderBy: {
              createdAt: 'asc',
            },
          },
        },
      })

      if (!event) {
        throw new TRPCError({ code: 'NOT_FOUND' })
      }

      if (input.format === 'csv') {
        const headers = [
          'Name',
          'Phone',
          'Email',
          'Status',
          'Waitlist',
          'Checked In',
          'WhatsApp Sent',
          'Registered At',
        ]

        const rows = event.attendees.map((attendee) => [
          attendee.name,
          attendee.phone,
          attendee.email || '',
          attendee.status,
          attendee.isWaitlist ? 'Yes' : 'No',
          attendee.checkedIn ? 'Yes' : 'No',
          attendee.whatsappSent ? 'Yes' : 'No',
          attendee.createdAt.toISOString(),
        ])

        const csv = [headers, ...rows]
          .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
          .join('\n')

        return {
          data: csv,
          format: 'csv',
          filename: `${event.title.replace(/[^a-z0-9]/gi, '_')}-attendance-${Date.now()}.csv`,
        }
      }

      throw new TRPCError({ code: 'BAD_REQUEST', message: 'Unsupported format' })
    }),
})
