import { z } from 'zod'
import { router, protectedProcedure } from '@/lib/trpc'
import { TRPCError } from '@trpc/server'

export const analyticsRouter = router({
  getOverview: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.organization) {
      throw new TRPCError({ code: 'UNAUTHORIZED' })
    }

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

    // Current month stats
    const currentMonthEvents = await ctx.prisma.event.count({
      where: {
        organizationId: ctx.organization.id,
        createdAt: { gte: startOfMonth },
        deletedAt: null,
      },
    })

    const currentMonthAttendees = await ctx.prisma.attendee.count({
      where: {
        event: {
          organizationId: ctx.organization.id,
          createdAt: { gte: startOfMonth },
        },
      },
    })

    const currentMonthConfirmed = await ctx.prisma.attendee.count({
      where: {
        event: {
          organizationId: ctx.organization.id,
          createdAt: { gte: startOfMonth },
        },
        status: 'confirmed',
        isWaitlist: false,
      },
    })

    // Last month stats for comparison
    const lastMonthEvents = await ctx.prisma.event.count({
      where: {
        organizationId: ctx.organization.id,
        createdAt: {
          gte: startOfLastMonth,
          lte: endOfLastMonth,
        },
        deletedAt: null,
      },
    })

    const lastMonthConfirmed = await ctx.prisma.attendee.count({
      where: {
        event: {
          organizationId: ctx.organization.id,
          createdAt: {
            gte: startOfLastMonth,
            lte: endOfLastMonth,
          },
        },
        status: 'confirmed',
        isWaitlist: false,
      },
    })

    // Response rate
    const totalInvited = await ctx.prisma.attendee.count({
      where: {
        event: {
          organizationId: ctx.organization.id,
          createdAt: { gte: startOfMonth },
        },
      },
    })

    const totalResponses = await ctx.prisma.attendee.count({
      where: {
        event: {
          organizationId: ctx.organization.id,
          createdAt: { gte: startOfMonth },
        },
        status: { in: ['confirmed', 'declined'] },
      },
    })

    const responseRate = totalInvited > 0 ? (totalResponses / totalInvited) * 100 : 0

    // Upcoming events
    const upcomingEvents = await ctx.prisma.event.count({
      where: {
        organizationId: ctx.organization.id,
        eventDate: { gte: now },
        deletedAt: null,
      },
    })

    // Recent events (last 6 months) for trend
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1)
    const monthlyEvents = await ctx.prisma.event.groupBy({
      by: ['createdAt'],
      where: {
        organizationId: ctx.organization.id,
        createdAt: { gte: sixMonthsAgo },
        deletedAt: null,
      },
      _count: true,
    })

    // Attendance trends
    const monthlyAttendance = await ctx.prisma.attendee.groupBy({
      by: ['createdAt'],
      where: {
        event: {
          organizationId: ctx.organization.id,
          createdAt: { gte: sixMonthsAgo },
        },
        status: 'confirmed',
        isWaitlist: false,
      },
      _count: true,
    })

    return {
      currentMonth: {
        events: currentMonthEvents,
        attendees: currentMonthAttendees,
        confirmed: currentMonthConfirmed,
        responseRate: Math.round(responseRate),
      },
      lastMonth: {
        events: lastMonthEvents,
        confirmed: lastMonthConfirmed,
      },
      trends: {
        eventsChange: lastMonthEvents > 0
          ? Math.round(((currentMonthEvents - lastMonthEvents) / lastMonthEvents) * 100)
          : currentMonthEvents > 0 ? 100 : 0,
        attendanceChange: lastMonthConfirmed > 0
          ? Math.round(((currentMonthConfirmed - lastMonthConfirmed) / lastMonthConfirmed) * 100)
          : currentMonthConfirmed > 0 ? 100 : 0,
      },
      upcomingEvents,
      monthlyEvents: monthlyEvents.map((e) => ({
        month: new Date(e.createdAt).toISOString().slice(0, 7),
        count: e._count,
      })),
      monthlyAttendance: monthlyAttendance.map((a) => ({
        month: new Date(a.createdAt).toISOString().slice(0, 7),
        count: a._count,
      })),
    }
  }),

  getEventStats: protectedProcedure
    .input(z.object({ eventId: z.string() }))
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
          attendees: true,
          _count: {
            select: {
              attendees: true,
            },
          },
        },
      })

      if (!event) {
        throw new TRPCError({ code: 'NOT_FOUND' })
      }

      const confirmed = event.attendees.filter((a) => a.status === 'confirmed' && !a.isWaitlist).length
      const declined = event.attendees.filter((a) => a.status === 'declined').length
      const pending = event.attendees.filter((a) => a.status === 'pending').length
      const waitlist = event.attendees.filter((a) => a.isWaitlist).length
      const checkedIn = event.attendees.filter((a) => a.checkedIn).length

      // Check-in method breakdown
      const qrScanned = event.attendees.filter((a) => a.checkInMethod === 'qr_scan').length
      const manualCheckIn = event.attendees.filter((a) => a.checkInMethod === 'manual').length
      const eventQrCheckIn = event.attendees.filter((a) => a.checkInMethod === 'event_qr').length
      const selfQrCheckIn = event.attendees.filter((a) => a.checkInMethod === 'self_qr').length

      const totalInvited = event.attendees.length
      const totalResponses = confirmed + declined
      const responseRate = totalInvited > 0 ? (totalResponses / totalInvited) * 100 : 0
      const attendanceRate = confirmed > 0 ? (checkedIn / confirmed) * 100 : 0

      // WhatsApp delivery stats
      const whatsappSent = event.attendees.filter((a) => a.whatsappSent).length
      const whatsappDeliveryRate = totalInvited > 0 ? (whatsappSent / totalInvited) * 100 : 0

      return {
        totalInvited,
        confirmed,
        declined,
        pending,
        waitlist,
        checkedIn,
        responseRate: Math.round(responseRate),
        attendanceRate: Math.round(attendanceRate),
        whatsappSent,
        whatsappDeliveryRate: Math.round(whatsappDeliveryRate),
        capacity: event.maxCapacity,
        capacityUsed: event.maxCapacity ? (confirmed / event.maxCapacity) * 100 : null,
        checkInMethods: {
          qrScanned,
          manualCheckIn,
          eventQrCheckIn,
          selfQrCheckIn,
        },
      }
    }),

  getContactEngagement: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.organization) {
      throw new TRPCError({ code: 'UNAUTHORIZED' })
    }

    const contacts = await ctx.prisma.contact.findMany({
      where: {
        organizationId: ctx.organization.id,
      },
      include: {
        attendees: {
          include: {
            event: true,
          },
        },
      },
    })

    const engagement = contacts.map((contact) => {
      const totalEvents = contact.attendees.length
      const confirmedEvents = contact.attendees.filter((a) => a.status === 'confirmed').length
      const checkedInEvents = contact.attendees.filter((a) => a.checkedIn).length

      return {
        contactId: contact.id,
        name: contact.name,
        phone: contact.phone,
        totalEvents,
        confirmedEvents,
        checkedInEvents,
        engagementRate: totalEvents > 0 ? (confirmedEvents / totalEvents) * 100 : 0,
        lastEventDate: contact.attendees.length > 0
          ? contact.attendees[contact.attendees.length - 1].event.eventDate
          : null,
      }
    })

    return engagement.sort((a, b) => b.totalEvents - a.totalEvents)
  }),
})
