'use client'

import { trpc } from '@/lib/trpc-client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { QRCodeDisplay } from '@/components/qr-code-display'
import { ArrowLeft, Users, CheckCircle2, Clock, ScanLine, QrCode as QrCodeIcon } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { computeEventSchedule } from '@/lib/event-schedule'

const SELF_CHECK_IN_DEFAULTS = {
  opensBefore: 60,
  closesAfter: 240,
  registrationClosesBefore: -120,
  timeZone: 'Asia/Kolkata',
}

const OPEN_SELF_CHECK_IN_OPTIONS = [
  { label: 'At event start', value: 0 },
  { label: '15 minutes before', value: 15 },
  { label: '30 minutes before', value: 30 },
  { label: '1 hour before', value: 60 },
  { label: '2 hours before', value: 120 },
  { label: '6 hours before', value: 360 },
  { label: '1 day before', value: 1440 },
]

const CLOSE_SELF_CHECK_IN_OPTIONS = [
  { label: 'At event end', value: 0 },
  { label: '30 minutes after', value: 30 },
  { label: '1 hour after', value: 60 },
  { label: '2 hours after', value: 120 },
  { label: '4 hours after', value: 240 },
  { label: '8 hours after', value: 480 },
  { label: '1 day after', value: 1440 },
]

const REGISTRATION_CLOSE_OPTIONS = [
  { label: '1 day before event starts', value: 1440 },
  { label: '6 hours before event starts', value: 360 },
  { label: '1 hour before event starts', value: 60 },
  { label: '30 minutes before event starts', value: 30 },
  { label: '15 minutes before event starts', value: 15 },
  { label: 'At event start', value: 0 },
  { label: '30 minutes after event starts', value: -30 },
  { label: '1 hour after event starts', value: -60 },
  { label: '2 hours after event starts', value: -120 },
  { label: '4 hours after event starts', value: -240 },
]

function withCurrentTimingOption(
  options: Array<{ label: string; value: number }>,
  value: number,
  suffix: string
) {
  if (options.some((option) => option.value === value)) return options
  const customSuffix = value < 0 ? 'after event starts' : suffix
  return [...options, { label: `Custom: ${Math.abs(value)} minutes ${customSuffix}`, value }]
}

function formatScheduleDate(date: import('luxon').DateTime) {
  return date.toFormat('h:mm a \'on\' d LLL yyyy')
}

function toEventDate(value: Date | string) {
  return value instanceof Date ? value : new Date(value)
}

function TimingSelect({
  id,
  label,
  helperText,
  value,
  options,
  onChange,
}: {
  id: string
  label: string
  helperText: string
  value: number
  options: Array<{ label: string; value: number }>
  onChange: (value: number) => void
}) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Select value={String(value)} onValueChange={(nextValue) => onChange(Number(nextValue))}>
        <SelectTrigger id={id} className="mt-1">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={String(option.value)}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="mt-1 text-xs text-muted-foreground">{helperText}</p>
    </div>
  )
}

type ScheduleSummary =
  | {
      isReady: true
      items: Array<{ label: string; value: string }>
    }
  | {
      isReady: false
      message: string
    }

export function CheckInClient({ eventId }: { eventId: string }) {
  const router = useRouter()
  const { toast } = useToast()
  const utils = trpc.useUtils()
  const { data: event, isLoading } = trpc.event.getById.useQuery({ id: eventId })
  const checkInMutation = trpc.attendee.checkIn.useMutation()
  const updateEventMutation = trpc.event.update.useMutation()
  const [searchPhone, setSearchPhone] = useState('')
  const [selectedAttendeeId, setSelectedAttendeeId] = useState<string | null>(null)
  const [selfCheckInEnabled, setSelfCheckInEnabled] = useState(true)
  const [venuePin, setVenuePin] = useState('')
  const [checkInOpensMinutesBefore, setCheckInOpensMinutesBefore] = useState<number>(30)
  const [checkInClosesMinutesAfter, setCheckInClosesMinutesAfter] = useState<number>(240)
  const [registrationClosesMinutesBeforeStart, setRegistrationClosesMinutesBeforeStart] = useState<number>(0)
  const [timeZone, setTimeZone] = useState<string>('Asia/Kolkata')
  const [didInitSettings, setDidInitSettings] = useState(false)

  const openSelfCheckInOptions = useMemo(
    () => withCurrentTimingOption(OPEN_SELF_CHECK_IN_OPTIONS, checkInOpensMinutesBefore, 'before'),
    [checkInOpensMinutesBefore]
  )
  const closeSelfCheckInOptions = useMemo(
    () => withCurrentTimingOption(CLOSE_SELF_CHECK_IN_OPTIONS, checkInClosesMinutesAfter, 'after'),
    [checkInClosesMinutesAfter]
  )
  const registrationCloseOptions = useMemo(
    () => withCurrentTimingOption(REGISTRATION_CLOSE_OPTIONS, registrationClosesMinutesBeforeStart, 'before event starts'),
    [registrationClosesMinutesBeforeStart]
  )

  const scheduleSummary = useMemo<ScheduleSummary>(() => {
    if (!event?.eventDate || !event?.startTime) {
      return {
        isReady: false,
        message: 'Add an event date and start time to preview the exact check-in schedule.',
      }
    }

    try {
      const schedule = computeEventSchedule({
        eventDate: toEventDate(event.eventDate),
        endDate: event.endDate ? toEventDate(event.endDate) : null,
        startTime: event.startTime,
        endTime: event.endTime,
        timeZone,
        checkInOpensMinutesBefore,
        checkInClosesMinutesAfter,
        registrationClosesMinutesBeforeStart,
      })

      return {
        isReady: true,
        items: [
          { label: 'Check-in opens', value: formatScheduleDate(schedule.checkInOpensAt) },
          { label: 'Check-in closes', value: formatScheduleDate(schedule.checkInClosesAt) },
          { label: 'Registration closes', value: formatScheduleDate(schedule.registrationClosesAt) },
        ],
      }
    } catch {
      return {
        isReady: false,
        message: 'The event date, time, or timezone needs a quick check before we can preview the schedule.',
      }
    }
  }, [
    event?.eventDate,
    event?.endDate,
    event?.startTime,
    event?.endTime,
    timeZone,
    checkInOpensMinutesBefore,
    checkInClosesMinutesAfter,
    registrationClosesMinutesBeforeStart,
  ])

  const handleManualCheckIn = async (attendeeId: string) => {
    setSelectedAttendeeId(attendeeId)
    try {
      await checkInMutation.mutateAsync({
        eventId,
        attendeeId,
      })
      toast({
        title: 'Success',
        description: 'Attendee checked in successfully',
      })
      // Invalidate event query to refresh attendees
      utils.event.getById.invalidate({ id: eventId })
      setSelectedAttendeeId(null)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to check in attendee',
        variant: 'destructive',
      })
      setSelectedAttendeeId(null)
    }
  }

  const attendees = event?.attendees || []
  const filteredAttendees = attendees.filter((attendee) =>
    attendee.phone.includes(searchPhone) ||
    attendee.name.toLowerCase().includes(searchPhone.toLowerCase())
  )

  const checkedInCount = attendees.filter((a) => a.checkedIn).length
  const totalAttendees = attendees.length

  useEffect(() => {
    if (!event || didInitSettings) return
    const useBeginnerDefaults = !event.selfCheckInEnabled
    setSelfCheckInEnabled(true)
    setCheckInOpensMinutesBefore(
      useBeginnerDefaults ? SELF_CHECK_IN_DEFAULTS.opensBefore : event.checkInOpensMinutesBefore ?? SELF_CHECK_IN_DEFAULTS.opensBefore
    )
    setCheckInClosesMinutesAfter(
      useBeginnerDefaults ? SELF_CHECK_IN_DEFAULTS.closesAfter : event.checkInClosesMinutesAfter ?? SELF_CHECK_IN_DEFAULTS.closesAfter
    )
    setRegistrationClosesMinutesBeforeStart(
      useBeginnerDefaults
        ? SELF_CHECK_IN_DEFAULTS.registrationClosesBefore
        : event.registrationClosesMinutesBeforeStart ?? SELF_CHECK_IN_DEFAULTS.registrationClosesBefore
    )
    setTimeZone(event.timeZone ?? SELF_CHECK_IN_DEFAULTS.timeZone)
    setDidInitSettings(true)
  }, [event, didInitSettings])

  const handleSelfCheckInEnabledChange = (checked: boolean) => {
    const wasDisabled = !selfCheckInEnabled
    setSelfCheckInEnabled(checked)
    if (!checked) return

    if (wasDisabled || !Number.isFinite(checkInOpensMinutesBefore)) setCheckInOpensMinutesBefore(SELF_CHECK_IN_DEFAULTS.opensBefore)
    if (wasDisabled || !Number.isFinite(checkInClosesMinutesAfter)) setCheckInClosesMinutesAfter(SELF_CHECK_IN_DEFAULTS.closesAfter)
    if (wasDisabled || !Number.isFinite(registrationClosesMinutesBeforeStart)) {
      setRegistrationClosesMinutesBeforeStart(SELF_CHECK_IN_DEFAULTS.registrationClosesBefore)
    }
    if (!timeZone.trim()) setTimeZone(event?.timeZone ?? SELF_CHECK_IN_DEFAULTS.timeZone)
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Event not found</p>
          <Link href="/events">
            <Button variant="outline" className="mt-4">
              Back to Events
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const handleSaveSelfCheckInSettings = async () => {
    try {
      if (selfCheckInEnabled) {
        const pinTrimmed = venuePin.trim()
        if (!/^[0-9]{4,12}$/.test(pinTrimmed)) {
          toast({
            title: 'Invalid PIN',
            description: 'PIN must be 4-12 digits.',
            variant: 'destructive',
          })
          return
        }
      }

      await updateEventMutation.mutateAsync({
        id: eventId,
        data: {
          selfCheckInEnabled,
          selfCheckInPin: selfCheckInEnabled ? venuePin.trim() : null,
          checkInOpensMinutesBefore,
          checkInClosesMinutesAfter,
          registrationClosesMinutesBeforeStart,
          timeZone,
        },
      })

      toast({
        title: 'Saved',
        description: 'Self check-in settings updated.',
      })
      utils.event.getById.invalidate({ id: eventId })
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err?.message || 'Failed to save settings',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href={`/events/${eventId}`}>
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold">Check-in</h1>
                <p className="text-sm text-gray-600">{event.title}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="font-medium">{checkedInCount}</span>
                <span className="text-muted-foreground">checked in</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-gray-600" />
                <span className="font-medium">{totalAttendees}</span>
                <span className="text-muted-foreground">total</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Quick Actions */}
        <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link href={`/events/${eventId}/scan`}>
            <Card className="cursor-pointer hover:border-primary transition-colors">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <ScanLine className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">Scan Attendee QR</h3>
                    <p className="text-sm text-muted-foreground">
                      Use camera to scan attendee QR codes
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Card className="border-2 border-primary/20 bg-primary/5">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/20">
                  <QrCodeIcon className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Event QR Code</h3>
                  <p className="text-sm text-muted-foreground">
                    Display for self check-in (fallback)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Self Check-in Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Self Check-in Settings</CardTitle>
              <CardDescription>
                Enable attendee self check-in via the event QR. Recommended for no-staff entry.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="font-medium">Enable Self Check-in</p>
                  <p className="text-xs text-muted-foreground">
                    Requires a venue PIN to prevent remote check-ins.
                  </p>
                </div>
                <Switch checked={selfCheckInEnabled} onCheckedChange={handleSelfCheckInEnabledChange} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="venuePin">Venue PIN</Label>
                  <Input
                    id="venuePin"
                    type="password"
                    inputMode="numeric"
                    placeholder="4-12 digits"
                    value={venuePin}
                    onChange={(e) => setVenuePin(e.target.value)}
                    disabled={!selfCheckInEnabled}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="timeZone">Time Zone</Label>
                  <Input
                    id="timeZone"
                    placeholder="e.g. Asia/Kolkata"
                    value={timeZone}
                    onChange={(e) => setTimeZone(e.target.value)}
                    className="mt-1"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Use an IANA timezone (e.g. Asia/Kolkata, America/New_York)
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <TimingSelect
                  id="opensBefore"
                  label="Open self check-in"
                  helperText="Attendees can start checking in at this time."
                  value={checkInOpensMinutesBefore}
                  options={openSelfCheckInOptions}
                  onChange={setCheckInOpensMinutesBefore}
                />
                <TimingSelect
                  id="closesAfter"
                  label="Close self check-in"
                  helperText="Attendees can no longer check in after this time."
                  value={checkInClosesMinutesAfter}
                  options={closeSelfCheckInOptions}
                  onChange={setCheckInClosesMinutesAfter}
                />
                <TimingSelect
                  id="regCloseBefore"
                  label="Stop registrations"
                  helperText="New registrations will be blocked after this time."
                  value={registrationClosesMinutesBeforeStart}
                  options={registrationCloseOptions}
                  onChange={setRegistrationClosesMinutesBeforeStart}
                />
              </div>

              <div className="rounded-lg border bg-muted/30 p-3">
                <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                  <Clock className="h-4 w-4 text-primary" />
                  Schedule preview
                </div>
                {scheduleSummary.isReady ? (
                  <div className="space-y-2 text-sm">
                    {scheduleSummary.items.map((item) => (
                      <div key={item.label} className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between">
                        <span className="text-muted-foreground">{item.label}</span>
                        <span className="font-medium">{item.value}</span>
                      </div>
                    ))}
                    <p className="pt-1 text-xs text-muted-foreground">Timezone: {timeZone || SELF_CHECK_IN_DEFAULTS.timeZone}</p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">{scheduleSummary.message}</p>
                )}
              </div>

              <Button onClick={handleSaveSelfCheckInSettings} disabled={updateEventMutation.isLoading} className="w-full">
                {updateEventMutation.isLoading ? 'Saving...' : 'Save Settings'}
              </Button>
            </CardContent>
          </Card>

          {/* Event QR Code Section (Fallback) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCodeIcon className="h-5 w-5" />
                Event QR Code (Self Check-in)
              </CardTitle>
              <CardDescription>
                Print and display this QR at the venue. Attendees scan it and check in with their phone (and PIN if enabled).
              </CardDescription>
            </CardHeader>
            <CardContent>
              {event.qrCode ? (
                <QRCodeDisplay
                  qrCode={event.qrCode}
                  eventTitle={event.title}
                  eventId={eventId}
                />
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  QR code not available for this event
                </div>
              )}
            </CardContent>
          </Card>

          {/* Manual Check-in Section */}
          <Card>
            <CardHeader>
              <CardTitle>Manual Check-in</CardTitle>
              <CardDescription>
                Search for attendees and check them in manually
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="search">Search Attendee</Label>
                <Input
                  id="search"
                  placeholder="Search by name or phone..."
                  value={searchPhone}
                  onChange={(e) => setSearchPhone(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div className="max-h-96 overflow-y-auto space-y-2">
                {filteredAttendees.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    {searchPhone ? 'No attendees found' : 'No attendees registered yet'}
                  </div>
                ) : (
                  filteredAttendees.map((attendee) => (
                    <div
                      key={attendee.id}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        attendee.checkedIn
                          ? 'bg-green-50 border-green-200'
                          : 'bg-white border-gray-200'
                      }`}
                    >
                      <div className="flex-1">
                        <div className="font-medium">{attendee.name}</div>
                        <div className="text-sm text-muted-foreground">{attendee.phone}</div>
                        {attendee.checkedIn && attendee.checkedInAt && (
                          <div className="text-xs text-green-600 mt-1 flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Checked in {new Date(attendee.checkedInAt).toLocaleTimeString()}
                          </div>
                        )}
                      </div>
                      <div>
                        {attendee.checkedIn ? (
                          <div className="flex items-center gap-2 text-green-600">
                            <CheckCircle2 className="h-5 w-5" />
                            <span className="text-sm font-medium">Checked In</span>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handleManualCheckIn(attendee.id)}
                            disabled={checkInMutation.isLoading}
                          >
                            {checkInMutation.isLoading && selectedAttendeeId === attendee.id ? (
                              <>
                                <Clock className="mr-2 h-4 w-4 animate-spin" />
                                Checking in...
                              </>
                            ) : (
                              'Check In'
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
