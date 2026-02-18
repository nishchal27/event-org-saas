import { z } from 'zod'
import { router, publicProcedure, protectedProcedure } from '@/lib/trpc'
import { TRPCError } from '@trpc/server'
import { DateTime } from 'luxon'
import { computeEventSchedule, gateCheckIn, gateRegistration } from '@/lib/event-schedule'
import { normalizePhoneMixed } from '@/lib/phone'
import { verifyVenuePin } from '@/lib/venue-pin'

async function publicCheckInByCode(
  ctx: any,
  input: { qrCode: string; phone?: string; pin?: string }
) {
  // 1) Try attendee QR
  let attendee = await ctx.prisma.attendee.findUnique({
    where: { attendeeQrCode: input.qrCode },
    include: { event: true },
  })

  // 2) Else try event QR
  if (!attendee) {
    const event = await ctx.prisma.event.findUnique({
      where: { qrCode: input.qrCode },
    })

    if (!event) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Invalid QR code' })
    }

    // Gate check-in by event time window
    const schedule = computeEventSchedule({
      eventDate: event.eventDate,
      endDate: event.endDate,
      startTime: event.startTime,
      endTime: event.endTime,
      timeZone: event.timeZone,
      checkInOpensMinutesBefore: event.checkInOpensMinutesBefore,
      checkInClosesMinutesAfter: event.checkInClosesMinutesAfter,
      registrationClosesMinutesBeforeStart: event.registrationClosesMinutesBeforeStart,
    })
    const now = DateTime.now().setZone(schedule.timeZone)
    const gate = gateCheckIn(now, schedule)
    if (!gate.ok) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message:
          gate.reason === 'checkin_not_open'
            ? 'Check-in has not opened yet'
            : 'Check-in is closed for this event',
      })
    }

    // PIN gate (when enabled)
    if (event.selfCheckInEnabled) {
      if (!event.selfCheckInPinHash) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Self check-in is not configured for this event' })
      }
      if (!input.pin || input.pin.trim().length === 0) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Venue PIN is required' })
      }
      if (!verifyVenuePin(input.pin, event.selfCheckInPinHash)) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Invalid venue PIN' })
      }
    }

    if (!input.phone) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Phone number required for event QR check-in',
      })
    }

    const normalized = normalizePhoneMixed(input.phone)
    const phoneCandidates = Array.from(
      new Set(
        [
          normalized.canonicalForLookup,
          input.phone.trim(),
          normalized.digits,
          normalized.e164OrNull ?? undefined,
        ].filter(Boolean) as string[]
      )
    )

    for (const phoneCandidate of phoneCandidates) {
      attendee = await ctx.prisma.attendee.findUnique({
        where: {
          eventId_phone: {
            eventId: event.id,
            phone: phoneCandidate,
          },
        },
        include: { event: true },
      })
      if (attendee) break
    }

    if (!attendee) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Attendee not found for this event',
      })
    }

    // Opportunistic normalization backfill
    if (attendee.phone !== normalized.canonicalForLookup || attendee.phoneNormalized !== normalized.e164OrNull) {
      attendee = await ctx.prisma.attendee.update({
        where: { id: attendee.id },
        data: {
          phone: normalized.canonicalForLookup,
          phoneNormalized: normalized.e164OrNull,
        },
        include: { event: true },
      })
    }
  }

  // Gate check-in by event time window (attendee QR or event QR resolved)
  const schedule = computeEventSchedule({
    eventDate: attendee.event.eventDate,
    endDate: attendee.event.endDate,
    startTime: attendee.event.startTime,
    endTime: attendee.event.endTime,
    timeZone: attendee.event.timeZone,
    checkInOpensMinutesBefore: attendee.event.checkInOpensMinutesBefore,
    checkInClosesMinutesAfter: attendee.event.checkInClosesMinutesAfter,
    registrationClosesMinutesBeforeStart: attendee.event.registrationClosesMinutesBeforeStart,
  })
  const now = DateTime.now().setZone(schedule.timeZone)
  const gate = gateCheckIn(now, schedule)
  if (!gate.ok) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message:
        gate.reason === 'checkin_not_open'
          ? 'Check-in has not opened yet'
          : 'Check-in is closed for this event',
    })
  }

  // PIN gate for attendee QR as well (prevents remote self check-in with shared attendee QR)
  if (attendee.event.selfCheckInEnabled) {
    if (!attendee.event.selfCheckInPinHash) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Self check-in is not configured for this event' })
    }
    if (!input.pin || input.pin.trim().length === 0) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'Venue PIN is required' })
    }
    if (!verifyVenuePin(input.pin, attendee.event.selfCheckInPinHash)) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Invalid venue PIN' })
    }
  }

  if (attendee.checkedIn) {
    return attendee
  }

  const isAttendeeQr = attendee.attendeeQrCode === input.qrCode
  const checkInMethod = isAttendeeQr ? 'self_qr' : 'event_qr'

  return ctx.prisma.attendee.update({
    where: { id: attendee.id },
    data: {
      checkedIn: true,
      checkedInAt: new Date(),
      checkInMethod,
    },
    include: { event: true },
  })
}

export const attendeeRouter = router({
  getCheckInContext: publicProcedure
    .input(z.object({ qrCode: z.string() }))
    .query(async ({ ctx, input }) => {
      const attendee = await ctx.prisma.attendee.findUnique({
        where: { attendeeQrCode: input.qrCode },
        include: { event: true },
      })

      const event = attendee
        ? attendee.event
        : await ctx.prisma.event.findUnique({ where: { qrCode: input.qrCode } })

      if (!event) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Invalid QR code' })
      }

      const schedule = computeEventSchedule({
        eventDate: event.eventDate,
        endDate: event.endDate,
        startTime: event.startTime,
        endTime: event.endTime,
        timeZone: event.timeZone,
        checkInOpensMinutesBefore: event.checkInOpensMinutesBefore,
        checkInClosesMinutesAfter: event.checkInClosesMinutesAfter,
        registrationClosesMinutesBeforeStart: event.registrationClosesMinutesBeforeStart,
      })
      const now = DateTime.now().setZone(schedule.timeZone)
      const gate = gateCheckIn(now, schedule)

      return {
        kind: attendee ? ('attendee' as const) : ('event' as const),
        event: {
          id: event.id,
          organizationId: event.organizationId,
          title: event.title,
          location: event.location,
          timeZone: event.timeZone,
          selfCheckInEnabled: event.selfCheckInEnabled,
          pinRequired: event.selfCheckInEnabled,
        },
        requirements: {
          phoneRequired: !attendee,
          pinRequired: event.selfCheckInEnabled,
        },
        window: {
          status: gate.ok ? ('open' as const) : gate.reason === 'checkin_not_open' ? ('not_open' as const) : ('closed' as const),
          checkInOpensAt: schedule.checkInOpensAt.toISO(),
          checkInClosesAt: schedule.checkInClosesAt.toISO(),
        },
      }
    }),

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

      // Gate check-in by event time window
      const schedule = computeEventSchedule({
        eventDate: event.eventDate,
        endDate: event.endDate,
        startTime: event.startTime,
        endTime: event.endTime,
        timeZone: event.timeZone,
        checkInOpensMinutesBefore: event.checkInOpensMinutesBefore,
        checkInClosesMinutesAfter: event.checkInClosesMinutesAfter,
        registrationClosesMinutesBeforeStart: event.registrationClosesMinutesBeforeStart,
      })
      const now = DateTime.now().setZone(schedule.timeZone)
      const gate = gateCheckIn(now, schedule)
      if (!gate.ok) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: gate.reason === 'checkin_not_open'
            ? 'Check-in has not opened yet'
            : 'Check-in is closed for this event',
        })
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
        pin: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return publicCheckInByCode(ctx, input)
    }),

  selfCheckIn: publicProcedure
    .input(
      z.object({
        qrCode: z.string(),
        phone: z.string().optional(),
        pin: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return publicCheckInByCode(ctx, input)
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

      // Gate check-in by event time window (staff scanning)
      const schedule = computeEventSchedule({
        eventDate: attendee.event.eventDate,
        endDate: attendee.event.endDate,
        startTime: attendee.event.startTime,
        endTime: attendee.event.endTime,
        timeZone: attendee.event.timeZone,
        checkInOpensMinutesBefore: attendee.event.checkInOpensMinutesBefore,
        checkInClosesMinutesAfter: attendee.event.checkInClosesMinutesAfter,
        registrationClosesMinutesBeforeStart: attendee.event.registrationClosesMinutesBeforeStart,
      })
      const now = DateTime.now().setZone(schedule.timeZone)
      const gate = gateCheckIn(now, schedule)
      if (!gate.ok) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: gate.reason === 'checkin_not_open'
            ? 'Check-in has not opened yet'
            : 'Check-in is closed for this event',
        })
      }

      // Verify attendee belongs to organization's event
      if (attendee.event.organizationId !== ctx.organization.id) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'This QR code is not for your organization' })
      }

      if (attendee.checkedIn) {
        return attendee
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

      // Gate registration by event time window
      const schedule = computeEventSchedule({
        eventDate: event.eventDate,
        endDate: event.endDate,
        startTime: event.startTime,
        endTime: event.endTime,
        timeZone: event.timeZone,
        checkInOpensMinutesBefore: event.checkInOpensMinutesBefore,
        checkInClosesMinutesAfter: event.checkInClosesMinutesAfter,
        registrationClosesMinutesBeforeStart: event.registrationClosesMinutesBeforeStart,
      })
      const now = DateTime.now().setZone(schedule.timeZone)
      const regGate = gateRegistration(now, schedule, event.registrationClosed)
      if (!regGate.ok) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: regGate.reason === 'registration_ended'
            ? 'Registration has ended for this event'
            : 'Registration for this event is closed',
        })
      }

      const normalized = normalizePhoneMixed(input.phone)

      // Check if attendee already exists
      const phoneCandidates = Array.from(
        new Set(
          [
            normalized.canonicalForLookup,
            input.phone.trim(),
            normalized.digits,
            normalized.e164OrNull ?? undefined,
          ].filter(Boolean) as string[]
        )
      )

      let existingAttendee = null as any
      for (const phoneCandidate of phoneCandidates) {
        existingAttendee = await ctx.prisma.attendee.findUnique({
          where: {
            eventId_phone: {
              eventId: event.id,
              phone: phoneCandidate,
            },
          },
        })
        if (existingAttendee) break
      }

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
            phone: normalized.canonicalForLookup,
            phoneNormalized: normalized.e164OrNull,
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
          phone: {
            in: phoneCandidates,
          },
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
          phone: normalized.canonicalForLookup,
          phoneNormalized: normalized.e164OrNull,
          email: input.email,
          status: input.status,
          isWaitlist: isWaitlist,
          attendeeQrCode: attendeeQrCode,
        },
      })
    }),
})
