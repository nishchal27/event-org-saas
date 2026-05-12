import { DateTime } from 'luxon'

export type EventScheduleInput = {
  eventDate: Date
  endDate?: Date | null
  startTime: string
  endTime?: string | null
  timeZone?: string | null
  checkInOpensMinutesBefore?: number | null
  checkInClosesMinutesAfter?: number | null
  registrationClosesMinutesBeforeStart?: number | null
}

export type EventSchedule = {
  timeZone: string
  start: DateTime
  end: DateTime
  registrationClosesAt: DateTime
  checkInOpensAt: DateTime
  checkInClosesAt: DateTime
}

function assertTimeHHMM(value: string, label: string) {
  if (!/^\d{2}:\d{2}$/.test(value)) {
    throw new Error(`${label} must be in HH:mm format`)
  }
  const [hh, mm] = value.split(':').map((v) => Number(v))
  if (hh < 0 || hh > 23 || mm < 0 || mm > 59) {
    throw new Error(`${label} must be a valid 24-hour time`)
  }
}

function utcDateOnlyISO(d: Date): string {
  // Contract in this app: eventDate/endDate are stored from date inputs like \"YYYY-MM-DD\"
  // which become UTC-midnight JS Dates. We treat these as date-only values.
  return DateTime.fromJSDate(d, { zone: 'utc' }).toISODate()!
}

export function computeEventSchedule(input: EventScheduleInput): EventSchedule {
  const tz = input.timeZone || 'Asia/Kolkata'
  assertTimeHHMM(input.startTime, 'startTime')
  if (input.endTime) assertTimeHHMM(input.endTime, 'endTime')

  const startDateISO = utcDateOnlyISO(input.eventDate)
  const endDateISO = utcDateOnlyISO(input.endDate ?? input.eventDate)

  const start = DateTime.fromISO(`${startDateISO}T${input.startTime}`, { zone: tz })
  if (!start.isValid) throw new Error('Invalid event start datetime')

  // If endTime missing, assume a short event (2 hours) to avoid never-ending check-ins.
  const endTime = input.endTime ?? start.plus({ hours: 2 }).toFormat('HH:mm')
  const end = DateTime.fromISO(`${endDateISO}T${endTime}`, { zone: tz })
  if (!end.isValid) throw new Error('Invalid event end datetime')

  const opensBefore = Math.max(0, input.checkInOpensMinutesBefore ?? 60)
  const closesAfter = Math.max(0, input.checkInClosesMinutesAfter ?? 240)
  // Positive values close registration before start; negative values close it after start.
  const regClosesBefore = input.registrationClosesMinutesBeforeStart ?? -120

  const registrationClosesAt = start.minus({ minutes: regClosesBefore })
  const checkInOpensAt = start.minus({ minutes: opensBefore })
  const checkInClosesAt = end.plus({ minutes: closesAfter })

  return { timeZone: tz, start, end, registrationClosesAt, checkInOpensAt, checkInClosesAt }
}

export type ScheduleGateResult =
  | { ok: true }
  | { ok: false; reason: 'registration_closed' | 'registration_ended' | 'checkin_not_open' | 'checkin_closed' }

export function gateRegistration(now: DateTime, schedule: EventSchedule, registrationClosedFlag: boolean): ScheduleGateResult {
  if (registrationClosedFlag) return { ok: false, reason: 'registration_closed' }
  if (now >= schedule.registrationClosesAt) return { ok: false, reason: 'registration_ended' }
  return { ok: true }
}

export function gateCheckIn(now: DateTime, schedule: EventSchedule): ScheduleGateResult {
  if (now < schedule.checkInOpensAt) return { ok: false, reason: 'checkin_not_open' }
  if (now > schedule.checkInClosesAt) return { ok: false, reason: 'checkin_closed' }
  return { ok: true }
}

