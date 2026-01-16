'use client'

import { trpc } from '@/lib/trpc-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatDate, formatTime } from '@/lib/utils'
import { Calendar, MapPin, Clock, Users, CheckCircle, XCircle, MessageSquare, Eye, Share2, Copy, Download, QrCode, FileText, ScanLine, PieChart } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'
import { ContactSelection } from '@/components/contact-selection'
import { useToast } from '@/hooks/use-toast'
import { PostsTabClient } from './posts-tab-client'
import { Sparkles, Bell } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { ManualWhatsAppInvite } from '@/components/manual-whatsapp-invite'
import { EventReminders } from '@/components/event-reminders'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { motion } from 'framer-motion'

export function EventDetailClient({ eventId }: { eventId: string }) {
  const router = useRouter()
  const { toast } = useToast()
  const utils = trpc.useUtils()
  const { data: event, isLoading } = trpc.event.getById.useQuery(
    { id: eventId },
    {
      // Event data is fresh for 2 minutes (doesn't change often)
      staleTime: 2 * 60 * 1000,
    }
  )

  const updateReminderMutation = trpc.event.updateReminderStatus.useMutation({
    onSuccess: () => {
      utils.event.getById.invalidate({ id: eventId })
      toast({
        title: 'Success',
        description: 'Reminder status updated',
      })
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update reminder status',
        variant: 'destructive',
      })
    },
  })

  const handleReminderUpdate = (reminderType: 'invitation' | 'reminder1' | 'reminder2' | 'reminder3', sent: boolean) => {
    updateReminderMutation.mutate({
      eventId,
      reminderType,
      sent,
    })
  }
  const { data: contacts } = trpc.contact.getAll.useQuery(undefined, {
    // Contacts list is fresh for 1 minute
    staleTime: 60 * 1000,
  })
  const { data: posts } = trpc.ai.getPostsByEvent.useQuery(
    { eventId },
    {
      enabled: !!eventId,
      // Posts are fresh for 1 minute
      staleTime: 60 * 1000,
    }
  )
  const [selectedContacts, setSelectedContacts] = useState<string[]>([])
  const [showContactSelection, setShowContactSelection] = useState(false)
  const [selectedMessageTemplateId, setSelectedMessageTemplateId] = useState<string>('')
  const [customMessage, setCustomMessage] = useState('')
  const { data: messageTemplates } = trpc.messageTemplate.getAll.useQuery()

  const exportMutation = trpc.export.exportEventAttendance.useQuery(
    { eventId, format: 'csv' },
    { enabled: false } // Only fetch on demand
  )

  const handleExport = async () => {
    try {
      const result = await exportMutation.refetch()
      if (result.data) {
        const blob = new Blob([result.data.data], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = result.data.filename
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        toast({
          title: 'Success',
          description: 'Attendance report downloaded',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to export attendance',
        variant: 'destructive',
      })
    }
  }

  const whatsappMutation = trpc.whatsapp.sendInvite.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'WhatsApp invitations sent successfully!',
      })
      // Invalidate event query to refetch updated attendee data
      utils.event.getById.invalidate({ id: eventId })
      setShowContactSelection(false)
    },
  })

  const { data: selectedMessageTemplate } = trpc.messageTemplate.getById.useQuery(
    { id: selectedMessageTemplateId },
    { enabled: !!selectedMessageTemplateId }
  )

  const handleSendInvites = () => {
    if (selectedContacts.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select at least one contact',
        variant: 'destructive',
      })
      return
    }

    // Use template message if selected, otherwise use custom or default
    let message = customMessage
    if (selectedMessageTemplate && selectedMessageTemplate.content) {
      // Replace template variables with event data
      const eventUrl = `${window.location.origin}/event/${event?.publicSlug}`
      const startDate = event ? new Date(event.eventDate).toLocaleDateString('en-IN') : ''
      const endDate = event?.endDate ? new Date(event.endDate).toLocaleDateString('en-IN') : ''
      const dateLabel = endDate && endDate !== startDate ? `${startDate} - ${endDate}` : startDate
      const timeLabel = event?.endTime ? `${event.startTime} - ${event.endTime}` : event?.startTime || ''
      
      message = selectedMessageTemplate.content
        .replace(/{eventTitle}/g, event?.title || '')
        .replace(/{eventDate}/g, dateLabel)
        .replace(/{eventTime}/g, timeLabel)
        .replace(/{eventLocation}/g, event?.location || '')
    }

    whatsappMutation.mutate({
      eventId,
      contactIds: selectedContacts,
      message: message || undefined,
    })
  }

  const copyEventLink = () => {
    if (event) {
      const link = `${window.location.origin}/event/${event.publicSlug}`
      navigator.clipboard.writeText(link)
      toast({
        title: 'Copied!',
        description: 'Event link copied to clipboard',
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center text-gray-500">Loading event...</div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Event not found</h2>
          <Button onClick={() => router.push('/events')} className="mt-4">
            Back to Events
          </Button>
        </div>
      </div>
    )
  }

  const confirmedCount = event.attendees.filter((a) => a.status === 'confirmed' && !a.isWaitlist).length
  const waitlistCount = event.attendees.filter((a) => a.isWaitlist).length
  const declinedCount = event.attendees.filter((a) => a.status === 'declined').length
  const pendingCount = event.attendees.filter((a) => a.status === 'pending').length
  const checkedInCount = event.attendees.filter((a) => a.checkedIn).length
  const qrScannedCount = event.attendees.filter((a) => a.checkInMethod === 'qr_scan').length
  const manualCheckInCount = event.attendees.filter((a) => a.checkInMethod === 'manual').length
  const eventQrCheckInCount = event.attendees.filter((a) => a.checkInMethod === 'event_qr').length
  const capacityInfo = event.maxCapacity
    ? `${confirmedCount} / ${event.maxCapacity} spots filled`
    : null
  const startDateLabel = formatDate(event.eventDate)
  const endDateLabel = event.endDate ? formatDate(event.endDate) : null
  const dateLabel =
    endDateLabel && endDateLabel !== startDateLabel
      ? `${startDateLabel} - ${endDateLabel}`
      : startDateLabel
  const timeLabel = event.endTime
    ? `${formatTime(event.startTime)} - ${formatTime(event.endTime)}`
    : formatTime(event.startTime)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">{event.title}</h1>
              <p className="text-sm text-gray-600">
                Created {formatDate(event.createdAt)}
              </p>
            </div>
            <div className="flex gap-2">
              <Link href={`/event/${event.publicSlug}`} target="_blank">
                <Button variant="outline">
                  <Eye className="mr-2 h-4 w-4" />
                  Preview
                </Button>
              </Link>
              <Button variant="outline" onClick={copyEventLink}>
                <Copy className="mr-2 h-4 w-4" />
                Copy Link
              </Button>
              <Button variant="outline" onClick={handleExport}>
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
              {event.qrCode && (
                <>
                  <Link href={`/events/${eventId}/scan`}>
                    <Button>
                      <ScanLine className="mr-2 h-4 w-4" />
                      Scan QR
                    </Button>
                  </Link>
                  <Link href={`/events/${eventId}/checkin`}>
                    <Button variant="outline">
                      <QrCode className="mr-2 h-4 w-4" />
                      Check-in
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Tabs defaultValue="details" className="space-y-4">
              <TabsList>
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="attendees">
                  Attendees ({event.attendees.length})
                  {checkedInCount > 0 && (
                    <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-800">
                      {checkedInCount} checked in
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="invite">
                  <MessageSquare className="mr-1 h-4 w-4" />
                  Invite
                </TabsTrigger>
                <TabsTrigger value="reminders">
                  <Bell className="mr-1 h-4 w-4" />
                  Reminders
                </TabsTrigger>
                <TabsTrigger value="posts">
                  <Sparkles className="mr-1 h-4 w-4" />
                  Posts {posts && posts.length > 0 && `(${posts.length})`}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="details">
                <Card>
                  <CardHeader>
                    <CardTitle>Event Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {event.imageUrl && (
                      <img
                        src={event.imageUrl}
                        alt={event.title}
                        className="h-64 w-full rounded-lg object-cover"
                      />
                    )}

                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <Calendar className="mt-1 h-5 w-5 text-gray-400" />
                        <div>
                          <p className="font-medium">Date & Time</p>
                          <p className="text-sm text-gray-600">
                            {dateLabel} • {timeLabel}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <MapPin className="mt-1 h-5 w-5 text-gray-400" />
                        <div>
                          <p className="font-medium">Location</p>
                          <p className="text-sm text-gray-600">{event.location}</p>
                        </div>
                      </div>

                      <div>
                        <p className="font-medium">Description</p>
                        <p className="mt-1 whitespace-pre-wrap text-sm text-gray-600">
                          {event.description}
                        </p>
                      </div>

                      {event.additionalNotes && (
                        <div>
                          <p className="font-medium">Additional Notes</p>
                          <p className="mt-1 whitespace-pre-wrap text-sm text-gray-600">
                            {event.additionalNotes}
                          </p>
                        </div>
                      )}

                      {(event.customField1Label || event.customField2Label) && (
                        <div>
                          <p className="font-medium">Custom Fields</p>
                          <div className="mt-2 space-y-2">
                            {event.customField1Label && (
                              <div className="text-sm">
                                <span className="font-medium">{event.customField1Label}:</span>{' '}
                                <span className="text-gray-600">{event.customField1Value}</span>
                              </div>
                            )}
                            {event.customField2Label && (
                              <div className="text-sm">
                                <span className="font-medium">{event.customField2Label}:</span>{' '}
                                <span className="text-gray-600">{event.customField2Value}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="attendees">
                <Card>
                  <CardHeader>
                    <CardTitle>Attendees</CardTitle>
                    <CardDescription>
                      Track who's coming to your event
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {event.maxCapacity && (
                      <div className="mb-4 rounded-lg bg-blue-50 p-4">
                        <p className="text-sm font-medium text-blue-900">Capacity</p>
                        <p className="text-2xl font-bold text-blue-600">{capacityInfo}</p>
                        {waitlistCount > 0 && (
                          <p className="mt-1 text-sm text-blue-700">{waitlistCount} on waitlist</p>
                        )}
                      </div>
                    )}
                    {(() => {
                      const checkedInCount = event.attendees.filter((a) => a.checkedIn).length
                      const hasCheckedIn = checkedInCount > 0
                      const gridCols = event.maxCapacity 
                        ? (hasCheckedIn ? 'grid-cols-5' : 'grid-cols-4')
                        : (hasCheckedIn ? 'grid-cols-4' : 'grid-cols-3')
                      
                      return (
                        <div className={`mb-4 grid gap-4 ${gridCols}`}>
                          {hasCheckedIn && (
                            <div className="rounded-lg bg-blue-50 p-4 text-center">
                              <CheckCircle className="mx-auto h-6 w-6 text-blue-600" />
                              <p className="mt-2 text-2xl font-bold text-blue-600">{checkedInCount}</p>
                              <p className="text-sm text-gray-600">Checked In</p>
                              {qrScannedCount > 0 && (
                                <p className="text-xs text-blue-700 mt-1">
                                  {qrScannedCount} via QR
                                </p>
                              )}
                            </div>
                          )}
                          <div className="rounded-lg bg-green-50 p-4 text-center">
                            <CheckCircle className="mx-auto h-6 w-6 text-green-600" />
                            <p className="mt-2 text-2xl font-bold text-green-600">{confirmedCount}</p>
                            <p className="text-sm text-gray-600">Confirmed</p>
                          </div>
                          {waitlistCount > 0 && (
                            <div className="rounded-lg bg-yellow-50 p-4 text-center">
                              <Users className="mx-auto h-6 w-6 text-yellow-600" />
                              <p className="mt-2 text-2xl font-bold text-yellow-600">{waitlistCount}</p>
                              <p className="text-sm text-gray-600">Waitlist</p>
                            </div>
                          )}
                          <div className="rounded-lg bg-red-50 p-4 text-center">
                            <XCircle className="mx-auto h-6 w-6 text-red-600" />
                            <p className="mt-2 text-2xl font-bold text-red-600">{declinedCount}</p>
                            <p className="text-sm text-gray-600">Declined</p>
                          </div>
                          <div className="rounded-lg bg-gray-50 p-4 text-center">
                            <Users className="mx-auto h-6 w-6 text-gray-600" />
                            <p className="mt-2 text-2xl font-bold text-gray-600">{pendingCount}</p>
                            <p className="text-sm text-gray-600">Pending</p>
                          </div>
                        </div>
                      )
                    })()}

                    {/* Check-in Method Breakdown */}
                    {checkedInCount > 0 && (
                      <div className="mb-4 rounded-lg border bg-gradient-to-br from-primary/5 to-background p-4">
                        <div className="mb-3 flex items-center gap-2">
                          <PieChart className="h-4 w-4 text-primary" />
                          <h4 className="text-sm font-semibold text-foreground">Check-in Methods Breakdown</h4>
                        </div>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                          {qrScannedCount > 0 && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="rounded-lg bg-primary/10 p-3 text-center border border-primary/20"
                            >
                              <QrCode className="mx-auto h-5 w-5 text-primary mb-1" />
                              <p className="text-lg font-bold text-primary">{qrScannedCount}</p>
                              <p className="text-xs text-muted-foreground">QR Scan</p>
                              <p className="text-xs text-primary/70 mt-1">
                                {Math.round((qrScannedCount / checkedInCount) * 100)}%
                              </p>
                            </motion.div>
                          )}
                          {manualCheckInCount > 0 && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: 0.1 }}
                              className="rounded-lg bg-purple-50 p-3 text-center border border-purple-200"
                            >
                              <Users className="mx-auto h-5 w-5 text-purple-600 mb-1" />
                              <p className="text-lg font-bold text-purple-600">{manualCheckInCount}</p>
                              <p className="text-xs text-muted-foreground">Manual</p>
                              <p className="text-xs text-purple-600/70 mt-1">
                                {Math.round((manualCheckInCount / checkedInCount) * 100)}%
                              </p>
                            </motion.div>
                          )}
                          {eventQrCheckInCount > 0 && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: 0.2 }}
                              className="rounded-lg bg-orange-50 p-3 text-center border border-orange-200"
                            >
                              <QrCode className="mx-auto h-5 w-5 text-orange-600 mb-1" />
                              <p className="text-lg font-bold text-orange-600">{eventQrCheckInCount}</p>
                              <p className="text-xs text-muted-foreground">Event QR</p>
                              <p className="text-xs text-orange-600/70 mt-1">
                                {Math.round((eventQrCheckInCount / checkedInCount) * 100)}%
                              </p>
                            </motion.div>
                          )}
                          {checkedInCount - qrScannedCount - manualCheckInCount - eventQrCheckInCount > 0 && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: 0.3 }}
                              className="rounded-lg bg-gray-50 p-3 text-center border border-gray-200"
                            >
                              <CheckCircle className="mx-auto h-5 w-5 text-gray-600 mb-1" />
                              <p className="text-lg font-bold text-gray-600">
                                {checkedInCount - qrScannedCount - manualCheckInCount - eventQrCheckInCount}
                              </p>
                              <p className="text-xs text-muted-foreground">Other</p>
                              <p className="text-xs text-gray-600/70 mt-1">
                                {Math.round(((checkedInCount - qrScannedCount - manualCheckInCount - eventQrCheckInCount) / checkedInCount) * 100)}%
                              </p>
                            </motion.div>
                          )}
                        </div>
                        {qrScannedCount > 0 && (
                          <div className="mt-3 rounded-lg bg-green-50 p-2 text-center border border-green-200">
                            <p className="text-xs font-medium text-green-700">
                              ✨ {qrScannedCount} attendee{qrScannedCount !== 1 ? 's' : ''} used fast QR scan check-in!
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="space-y-2">
                      {event.attendees.length === 0 ? (
                        <p className="py-8 text-center text-gray-500">No attendees yet</p>
                      ) : (
                        event.attendees.map((attendee) => (
                          <div
                            key={attendee.id}
                            className="flex items-center justify-between rounded-lg border p-3"
                          >
                            <div>
                              <p className="font-medium">{attendee.name}</p>
                              <p className="text-sm text-gray-600">{attendee.phone}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              {attendee.checkedIn && (
                                <div className="flex items-center gap-2">
                                  <div className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                                    ✓ Checked In
                                  </div>
                                  {attendee.checkInMethod && (
                                    <div className="text-xs text-muted-foreground">
                                      {attendee.checkInMethod === 'qr_scan' && '📱 QR Scan'}
                                      {attendee.checkInMethod === 'manual' && '✋ Manual'}
                                      {attendee.checkInMethod === 'event_qr' && '📋 Event QR'}
                                      {attendee.checkInMethod === 'self_qr' && '📱 Self QR'}
                                    </div>
                                  )}
                                </div>
                              )}
                              <div
                                className={`rounded-full px-3 py-1 text-xs font-medium ${
                                  attendee.status === 'confirmed'
                                    ? attendee.isWaitlist
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : 'bg-green-100 text-green-800'
                                    : attendee.status === 'declined'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}
                              >
                                {attendee.isWaitlist ? 'Waitlist' : attendee.status}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="posts" className="space-y-4">
                <PostsTabClient eventId={eventId} />
              </TabsContent>

              <TabsContent value="invite" className="space-y-4">
                <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-4">
                  <div className="flex items-start gap-3">
                    <MessageSquare className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-blue-900 mb-1">Manual WhatsApp (MVP)</p>
                      <p className="text-sm text-blue-700">
                        Generate invitation message, copy it, and send manually via WhatsApp. 
                        Automation features will be available in future phases.
                      </p>
                    </div>
                  </div>
                </div>
                {event && (
                  <ManualWhatsAppInvite
                    event={{
                      id: event.id,
                      title: event.title,
                      eventDate: event.eventDate,
                      endDate: event.endDate,
                      startTime: event.startTime,
                      endTime: event.endTime,
                      location: event.location,
                      description: event.description,
                      publicSlug: event.publicSlug,
                    }}
                    onMessageGenerated={(message) => {
                      // Optional: Track that invitation was generated
                    }}
                  />
                )}
              </TabsContent>

              <TabsContent value="reminders" className="space-y-4">
                {event && (
                  <EventReminders
                    event={{
                      id: event.id,
                      title: event.title,
                      eventDate: event.eventDate,
                      endDate: event.endDate,
                      startTime: event.startTime,
                      endTime: event.endTime,
                      location: event.location,
                      description: event.description,
                      invitationSent: (event as any).invitationSent ?? false,
                      reminder1Sent: (event as any).reminder1Sent ?? false,
                      reminder2Sent: (event as any).reminder2Sent ?? false,
                      reminder3Sent: (event as any).reminder3Sent ?? false,
                    }}
                    onReminderUpdate={handleReminderUpdate}
                  />
                )}
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Total Invited</p>
                  <p className="text-2xl font-bold">{event.attendees.length}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Confirmed</p>
                  <p className="text-2xl font-bold text-green-600">{confirmedCount}</p>
                </div>
                {event.maxCapacity && (
                  <div>
                    <p className="text-sm text-gray-600">Capacity</p>
                    <p className="text-2xl font-bold">{capacityInfo}</p>
                  </div>
                )}
                {waitlistCount > 0 && (
                  <div>
                    <p className="text-sm text-gray-600">Waitlist</p>
                    <p className="text-2xl font-bold text-yellow-600">{waitlistCount}</p>
                  </div>
                )}
                {checkedInCount > 0 && (
                  <div>
                    <p className="text-sm text-gray-600">Checked In</p>
                    <p className="text-2xl font-bold text-blue-600">{checkedInCount}</p>
                    {qrScannedCount > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {qrScannedCount} via QR scan
                      </p>
                    )}
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-600">Response Rate</p>
                  <p className="text-2xl font-bold">
                    {event.attendees.length > 0
                      ? Math.round(
                          ((confirmedCount + declinedCount) / event.attendees.length) * 100
                        )
                      : 0}
                    %
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
