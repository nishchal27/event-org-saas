import { z } from 'zod'
import { router, protectedProcedure, publicProcedure } from '@/lib/trpc'
import { TRPCError } from '@trpc/server'
import { generateSlug } from '@/lib/utils'
import { getPlanLimits, type PlanType } from '@/lib/plan-limits'
import { getEffectivePlan } from '@/lib/early-access'
import { hashVenuePin } from '@/lib/venue-pin'

const timeToMinutes = (time: string) => {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

const eventSchema = z
  .object({
    title: z.string().min(1, 'Title is required'),
    imageUrl: z.string().optional().nullable(),
    eventDate: z.string().min(1, 'Event date is required'),
    endDate: z.string().min(1, 'End date is required'),
    startTime: z.string().min(1, 'Start time is required'),
    endTime: z.string().min(1, 'End time is required'),
    locationType: z.enum(['physical', 'online']),
    location: z.string().min(1, 'Location is required'),
    description: z.string().min(1, 'Description is required'),
    additionalNotes: z.string().optional().nullable(),
    audienceType: z.enum(['all', 'selected', 'public']),
    maxCapacity: z.number().int().positive().optional().nullable(),
    customField1Label: z.string().optional().nullable(),
    customField1Value: z.string().optional().nullable(),
    customField2Label: z.string().optional().nullable(),
    customField2Value: z.string().optional().nullable(),
  })
  .superRefine((data, ctx) => {
    const startDate = new Date(data.eventDate)
    const endDate = new Date(data.endDate)

    if (!Number.isNaN(startDate.getTime()) && !Number.isNaN(endDate.getTime())) {
      if (endDate < startDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['endDate'],
          message: 'End date must be the same as or after the start date',
        })
      }

      const isSameDay = startDate.toDateString() === endDate.toDateString()
      if (isSameDay && timeToMinutes(data.endTime) <= timeToMinutes(data.startTime)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['endTime'],
          message: 'End time must be after the start time',
        })
      }
    }
  })

export const eventRouter = router({
  create: protectedProcedure
    .input(eventSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.organization) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'No organization found. Please create or select an organization first.',
        })
      }

      // Check usage limits
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
      const limit = limits.events
      const currentCount = usage?.eventsCreated || 0

      if (currentCount >= limit) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: `You've reached your monthly event limit (${limit}). Upgrade to create more events.`,
        })
      }

      // Parse dates safely
      const eventDate = new Date(input.eventDate)
      const endDate = new Date(input.endDate)
      
      if (isNaN(eventDate.getTime())) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid event date format',
        })
      }
      
      if (isNaN(endDate.getTime())) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid end date format',
        })
      }

      try {
        const event = await ctx.prisma.event.create({
          data: {
            organizationId: ctx.organization.id,
            title: input.title,
            imageUrl:
              input.imageUrl && input.imageUrl !== '' && input.imageUrl.startsWith('http')
                ? input.imageUrl
                : null,
            eventDate: eventDate,
            startTime: input.startTime,
            endTime: input.endTime,
            endDate: endDate,
            locationType: input.locationType,
            location: input.location,
            description: input.description,
            additionalNotes: input.additionalNotes ?? null,
            audienceType: input.audienceType,
            isPublic: input.audienceType === 'public',
            publicSlug: generateSlug(),
            qrCode: generateSlug(), // Generate unique QR code for check-in
            maxCapacity: input.maxCapacity ?? null,
            customField1Label: input.customField1Label ?? null,
            customField1Value: input.customField1Value ?? null,
            customField2Label: input.customField2Label ?? null,
            customField2Value: input.customField2Value ?? null,
          },
        })

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
            eventsCreated: { increment: 1 },
          },
          create: {
            organizationId: ctx.organization.id,
            month: now.getMonth() + 1,
            year: now.getFullYear(),
            eventsCreated: 1,
          },
        })

        return event
      } catch (error: any) {
        console.error('❌ Error creating event:', error)
        console.error('Error name:', error?.name)
        console.error('Error code:', error?.code)
        console.error('Error message:', error?.message)
        console.error('Error stack:', error?.stack)
        console.error('Input data:', JSON.stringify(input, null, 2))
        console.error('Organization ID:', ctx.organization?.id)
        
        // Check if it's a Prisma validation error
        if (error?.code === 'P2002') {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'An event with this slug already exists. Please try again.',
          })
        }
        
        // Check for Prisma validation errors (missing required fields)
        if (error?.code === 'P2003' || error?.message?.includes('Argument') || error?.message?.includes('missing')) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Database error: ${error.message || 'Invalid data provided'}`,
            cause: error,
          })
        }
        
        // Re-throw TRPC errors as-is
        if (error instanceof TRPCError) {
          throw error
        }
        
        // Wrap other errors
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error?.message || 'Failed to create event. Please check server logs for details.',
          cause: error,
        })
      }
    }),

  getAll: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.organization) {
      throw new TRPCError({ code: 'UNAUTHORIZED' })
    }

    return ctx.prisma.event.findMany({
      where: {
        organizationId: ctx.organization.id,
        deletedAt: null,
      },
      orderBy: {
        eventDate: 'desc',
      },
      include: {
        _count: {
          select: {
            attendees: true,
          },
        },
      },
    })
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.organization) {
        throw new TRPCError({ code: 'UNAUTHORIZED' })
      }

      const event = await ctx.prisma.event.findFirst({
        where: {
          id: input.id,
          organizationId: ctx.organization.id,
        },
        include: {
          attendees: {
            include: {
              contact: true,
            },
          },
          selectedContacts: {
            include: {
              contact: true,
            },
          },
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

      return event
    }),

  getCheckInSummary: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.organization) {
        throw new TRPCError({ code: 'UNAUTHORIZED' })
      }

      const event = await ctx.prisma.event.findFirst({
        where: {
          id: input.id,
          organizationId: ctx.organization.id,
          deletedAt: null,
        },
        select: {
          id: true,
          title: true,
          organizationId: true,
        },
      })

      if (!event) {
        throw new TRPCError({ code: 'NOT_FOUND' })
      }

      const [totalAttendees, checkedInCount, qrScannedCount] = await Promise.all([
        ctx.prisma.attendee.count({ where: { eventId: event.id } }),
        ctx.prisma.attendee.count({ where: { eventId: event.id, checkedIn: true } }),
        ctx.prisma.attendee.count({ where: { eventId: event.id, checkInMethod: 'qr_scan' } }),
      ])

      return {
        ...event,
        totalAttendees,
        checkedInCount,
        qrScannedCount,
      }
    }),

  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const event = await ctx.prisma.event.findUnique({
        where: {
          publicSlug: input.slug,
        },
        include: {
          organization: {
            select: {
              name: true,
              logo: true,
              accentColor: true,
              backgroundColor: true,
              fontStyle: true,
            },
          },
        },
      })

      if (!event) {
        throw new TRPCError({ code: 'NOT_FOUND' })
      }

      return event
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        data: z
          .object({
            title: z.string().min(1, 'Title is required').optional(),
            imageUrl: z.string().optional().nullable(),
            eventDate: z.string().min(1, 'Event date is required').optional(),
            endDate: z.string().min(1, 'End date is required').optional(),
            startTime: z.string().min(1, 'Start time is required').optional(),
            endTime: z.string().min(1, 'End time is required').optional(),
            locationType: z.enum(['physical', 'online']).optional(),
            location: z.string().min(1, 'Location is required').optional(),
            description: z.string().min(1, 'Description is required').optional(),
            additionalNotes: z.string().optional().nullable(),
            audienceType: z.enum(['all', 'selected', 'public']).optional(),
            customField1Label: z.string().optional().nullable(),
            customField1Value: z.string().optional().nullable(),
            customField2Label: z.string().optional().nullable(),
            customField2Value: z.string().optional().nullable(),
            maxCapacity: z.number().int().positive().optional().nullable(),
            timeZone: z.string().min(1).optional(),
            registrationClosesMinutesBeforeStart: z.number().int().min(0).max(7 * 24 * 60).optional(),
            checkInOpensMinutesBefore: z.number().int().min(0).max(24 * 60).optional(),
            checkInClosesMinutesAfter: z.number().int().min(0).max(7 * 24 * 60).optional(),
            selfCheckInEnabled: z.boolean().optional(),
            selfCheckInPin: z.string().optional().nullable(),
          })
          .superRefine((data, ctx) => {
            // Only validate dates if both are provided
            if (data.eventDate && data.endDate) {
              const startDate = new Date(data.eventDate)
              const endDate = new Date(data.endDate)

              if (!Number.isNaN(startDate.getTime()) && !Number.isNaN(endDate.getTime())) {
                if (endDate < startDate) {
                  ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ['endDate'],
                    message: 'End date must be the same as or after the start date',
                  })
                }

                const isSameDay = startDate.toDateString() === endDate.toDateString()
                if (isSameDay && data.startTime && data.endTime && timeToMinutes(data.endTime) <= timeToMinutes(data.startTime)) {
                  ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ['endTime'],
                    message: 'End time must be after the start time',
                  })
                }
              }
            }
          }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.organization) {
        throw new TRPCError({ code: 'UNAUTHORIZED' })
      }

      const event = await ctx.prisma.event.findFirst({
        where: {
          id: input.id,
          organizationId: ctx.organization.id,
        },
      })

      if (!event) {
        throw new TRPCError({ code: 'NOT_FOUND' })
      }

      const updateData: any = {}
      if (input.data.title !== undefined) updateData.title = input.data.title
      if (input.data.imageUrl !== undefined) updateData.imageUrl = input.data.imageUrl || null
      if (input.data.eventDate !== undefined) updateData.eventDate = new Date(input.data.eventDate)
      if (input.data.endDate !== undefined) updateData.endDate = input.data.endDate ? new Date(input.data.endDate) : null
      if (input.data.startTime !== undefined) updateData.startTime = input.data.startTime
      if (input.data.endTime !== undefined) updateData.endTime = input.data.endTime || null
      if (input.data.locationType !== undefined) updateData.locationType = input.data.locationType
      if (input.data.location !== undefined) updateData.location = input.data.location
      if (input.data.description !== undefined) updateData.description = input.data.description
      if (input.data.additionalNotes !== undefined) updateData.additionalNotes = input.data.additionalNotes || null
      if (input.data.audienceType !== undefined) {
        updateData.audienceType = input.data.audienceType
        updateData.isPublic = input.data.audienceType === 'public'
      }
      if (input.data.customField1Label !== undefined) updateData.customField1Label = input.data.customField1Label || null
      if (input.data.customField1Value !== undefined) updateData.customField1Value = input.data.customField1Value || null
      if (input.data.customField2Label !== undefined) updateData.customField2Label = input.data.customField2Label || null
      if (input.data.customField2Value !== undefined) updateData.customField2Value = input.data.customField2Value || null
      if (input.data.maxCapacity !== undefined) updateData.maxCapacity = input.data.maxCapacity || null
      if (input.data.timeZone !== undefined) updateData.timeZone = input.data.timeZone
      if (input.data.registrationClosesMinutesBeforeStart !== undefined)
        updateData.registrationClosesMinutesBeforeStart = input.data.registrationClosesMinutesBeforeStart
      if (input.data.checkInOpensMinutesBefore !== undefined) updateData.checkInOpensMinutesBefore = input.data.checkInOpensMinutesBefore
      if (input.data.checkInClosesMinutesAfter !== undefined) updateData.checkInClosesMinutesAfter = input.data.checkInClosesMinutesAfter
      if (input.data.selfCheckInEnabled !== undefined) updateData.selfCheckInEnabled = input.data.selfCheckInEnabled

      if (input.data.selfCheckInPin !== undefined) {
        if (input.data.selfCheckInPin === null || input.data.selfCheckInPin.trim().length === 0) {
          updateData.selfCheckInPinHash = null
        } else {
          const pin = input.data.selfCheckInPin.trim()
          if (!/^[0-9]{4,12}$/.test(pin)) {
            throw new TRPCError({ code: 'BAD_REQUEST', message: 'PIN must be 4-12 digits' })
          }
          updateData.selfCheckInPinHash = hashVenuePin(pin)
        }
      }

      return ctx.prisma.event.update({
        where: { id: input.id },
        data: updateData,
      })
    }),

  duplicate: protectedProcedure
    .input(z.object({ 
      id: z.string(),
      daysOffset: z.number().int().optional().default(0), // For recurring events (e.g., +7 for next week)
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.organization) {
        throw new TRPCError({ code: 'UNAUTHORIZED' })
      }

      const original = await ctx.prisma.event.findFirst({
        where: {
          id: input.id,
          organizationId: ctx.organization.id,
        },
      })

      if (!original) {
        throw new TRPCError({ code: 'NOT_FOUND' })
      }

      // Check usage limits (same as create)
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
      const limit = limits.events
      const currentCount = usage?.eventsCreated || 0

      if (currentCount >= limit) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: `You've reached your monthly event limit (${limit}). Upgrade to create more events.`,
        })
      }

      // Calculate new dates with offset
      const newEventDate = new Date(original.eventDate)
      newEventDate.setDate(newEventDate.getDate() + input.daysOffset)
      
      const newEndDate = original.endDate ? new Date(original.endDate) : null
      if (newEndDate) {
        newEndDate.setDate(newEndDate.getDate() + input.daysOffset)
      }

      const titleSuffix = input.daysOffset > 0 
        ? ` (Next Session)` 
        : input.daysOffset < 0 
        ? ` (Previous Session)` 
        : ` (Copy)`

      const duplicated = await ctx.prisma.event.create({
        data: {
          organizationId: ctx.organization.id,
          title: `${original.title}${titleSuffix}`,
          imageUrl: original.imageUrl,
          eventDate: newEventDate,
          endDate: newEndDate,
          startTime: original.startTime,
          endTime: original.endTime,
          locationType: original.locationType,
          location: original.location,
          description: original.description,
          additionalNotes: original.additionalNotes,
          audienceType: original.audienceType,
          isPublic: original.isPublic,
          publicSlug: generateSlug(),
          maxCapacity: original.maxCapacity,
          customField1Label: original.customField1Label,
          customField1Value: original.customField1Value,
          customField2Label: original.customField2Label,
          customField2Value: original.customField2Value,
        },
      })

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
          eventsCreated: { increment: 1 },
        },
        create: {
          organizationId: ctx.organization.id,
          month: now.getMonth() + 1,
          year: now.getFullYear(),
          eventsCreated: 1,
        },
      })

      return duplicated
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.organization) {
        throw new TRPCError({ code: 'UNAUTHORIZED' })
      }

      const event = await ctx.prisma.event.findFirst({
        where: {
          id: input.id,
          organizationId: ctx.organization.id,
        },
      })

      if (!event) {
        throw new TRPCError({ code: 'NOT_FOUND' })
      }

      // Soft delete
      return ctx.prisma.event.update({
        where: { id: input.id },
        data: {
          deletedAt: new Date(),
        },
      })
    }),

  updateReminderStatus: protectedProcedure
    .input(
      z.object({
        eventId: z.string(),
        reminderType: z.enum(['invitation', 'reminder1', 'reminder2', 'reminder3']),
        sent: z.boolean(),
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

      const updateData: any = {}
      if (input.reminderType === 'invitation') {
        updateData.invitationSent = input.sent
      } else if (input.reminderType === 'reminder1') {
        updateData.reminder1Sent = input.sent
      } else if (input.reminderType === 'reminder2') {
        updateData.reminder2Sent = input.sent
      } else if (input.reminderType === 'reminder3') {
        updateData.reminder3Sent = input.sent
      }

      return ctx.prisma.event.update({
        where: { id: input.eventId },
        data: updateData,
      })
    }),

  toggleRegistration: protectedProcedure
    .input(z.object({ id: z.string(), closed: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.organization) {
        throw new TRPCError({ code: 'UNAUTHORIZED' })
      }

      return ctx.prisma.event.update({
        where: { id: input.id },
        data: {
          registrationClosed: input.closed,
        },
      })
    }),
})
