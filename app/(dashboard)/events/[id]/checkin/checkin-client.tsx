'use client'

import { trpc } from '@/lib/trpc-client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { QRCodeDisplay } from '@/components/qr-code-display'
import { ArrowLeft, Users, CheckCircle2, Clock } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function CheckInClient({ eventId }: { eventId: string }) {
  const router = useRouter()
  const { toast } = useToast()
  const utils = trpc.useUtils()
  const { data: event, isLoading } = trpc.event.getById.useQuery({ id: eventId })
  const checkInMutation = trpc.attendee.checkIn.useMutation()
  const [searchPhone, setSearchPhone] = useState('')
  const [selectedAttendeeId, setSelectedAttendeeId] = useState<string | null>(null)

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
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* QR Code Section */}
          <Card>
            <CardHeader>
              <CardTitle>QR Code Check-in</CardTitle>
              <CardDescription>
                Display this QR code at your event. Attendees can scan it to check in.
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
