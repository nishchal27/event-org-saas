import { z } from 'zod'
import { router, adminProcedure, protectedProcedure } from '@/lib/trpc'
import { prisma } from '@/lib/prisma'
import { TRPCError } from '@trpc/server'

/** Dashboard-relevant event types for recent activity feed (exclude noisy/low-value) */
const DASHBOARD_ACTIVITY_EVENTS = [
  'event_created',
  'event_updated',
  'event_deleted',
  'whatsapp_invite_sent',
  'whatsapp_invite_failed',
  'check_in_success',
  'check_in_manual',
  'self_check_in_success',
  'registration_success',
] as const

export const analyticsRouter = router({
  /**
   * Get recent activity for dashboard (org members). Last N actions for the current org.
   */
  getRecentActivity: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(50).default(15) }))
    .query(async ({ ctx, input }) => {
      if (!ctx.organization) {
        throw new TRPCError({ code: 'UNAUTHORIZED' })
      }
      const rows = await prisma.analyticsEvent.findMany({
        where: {
          organizationId: ctx.organization.id,
          event: { in: [...DASHBOARD_ACTIVITY_EVENTS] },
        },
        orderBy: { timestamp: 'desc' },
        take: input.limit,
        select: {
          id: true,
          event: true,
          properties: true,
          timestamp: true,
          userId: true,
        },
      })
      return rows
    }),

  /**
   * Get analytics summary for the organization (Admin only)
   */
  getSummary: adminProcedure.query(async ({ ctx }) => {
    if (!ctx.organization) {
      throw new TRPCError({ code: 'UNAUTHORIZED' })
    }

    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Get event counts
    const [
      totalEvents,
      totalCheckIns,
      qrScans,
      errors,
      recentEvents,
    ] = await Promise.all([
      // Total events
      prisma.event.count({
        where: {
          organizationId: ctx.organization.id,
          deletedAt: null,
        },
      }),
      // Total check-ins
      prisma.attendee.count({
        where: {
          event: {
            organizationId: ctx.organization.id,
          },
          checkedIn: true,
        },
      }),
      // QR scans (last 30 days)
      prisma.analyticsEvent.count({
        where: {
          organizationId: ctx.organization.id,
          event: 'qr_scan_success',
          timestamp: {
            gte: thirtyDaysAgo,
          },
        },
      }),
      // Errors (last 30 days)
      prisma.analyticsEvent.count({
        where: {
          organizationId: ctx.organization.id,
          event: {
            in: ['qr_scan_error', 'check_in_error', 'whatsapp_invite_failed'],
          },
          timestamp: {
            gte: thirtyDaysAgo,
          },
        },
      }),
      // Recent events (last 7 days)
      prisma.analyticsEvent.findMany({
        where: {
          organizationId: ctx.organization.id,
          timestamp: {
            gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
          },
        },
        orderBy: {
          timestamp: 'desc',
        },
        take: 50,
        select: {
          id: true,
          event: true,
          properties: true,
          timestamp: true,
        },
      }),
    ])

    // Group events by type
    const eventsByType = recentEvents.reduce((acc, event) => {
      const type = event.event
      acc[type] = (acc[type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Get daily stats for last 7 days
    const dailyStats = await prisma.analyticsEvent.groupBy({
      by: ['timestamp'],
      where: {
        organizationId: ctx.organization.id,
        timestamp: {
          gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        },
      },
      _count: {
        id: true,
      },
    })

    return {
      totalEvents,
      totalCheckIns,
      qrScans,
      errors,
      eventsByType,
      recentEvents: recentEvents.slice(0, 20),
      dailyStats: dailyStats.map((stat) => ({
        date: stat.timestamp.toISOString().split('T')[0],
        count: stat._count.id,
      })),
    }
  }),

  /**
   * Get error events (Admin only)
   */
  getErrors: adminProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        eventType: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.organization) {
        throw new TRPCError({ code: 'UNAUTHORIZED' })
      }

      const errors = await prisma.analyticsEvent.findMany({
        where: {
          organizationId: ctx.organization.id,
          event: {
            in: input.eventType
              ? [input.eventType]
              : ['qr_scan_error', 'check_in_error', 'whatsapp_invite_failed'],
          },
        },
        orderBy: {
          timestamp: 'desc',
        },
        take: input.limit,
        select: {
          id: true,
          event: true,
          properties: true,
          timestamp: true,
          userAgent: true,
          url: true,
        },
      })

      return errors
    }),

  /**
   * Get feature usage stats (Admin only)
   */
  getFeatureStats: adminProcedure
    .input(
      z.object({
        days: z.number().min(1).max(90).default(30),
      })
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.organization) {
        throw new TRPCError({ code: 'UNAUTHORIZED' })
      }

      const startDate = new Date(Date.now() - input.days * 24 * 60 * 60 * 1000)

      const stats = await prisma.analyticsEvent.groupBy({
        by: ['event'],
        where: {
          organizationId: ctx.organization.id,
          timestamp: {
            gte: startDate,
          },
        },
        _count: {
          id: true,
        },
      })

      return stats.map((stat) => ({
        event: stat.event,
        count: stat._count.id,
      }))
    }),
})
