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
import { trackEvent } from '@/lib/analytics'

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
    onSuccess: (_data, variables) => {
      toast({
        title: 'Success',
        description: 'WhatsApp invitations sent successfully!',
      })
      if (event) {
        trackEvent(
          'whatsapp_invite_sent',
          { eventId, count: variables.contactIds.length },
          undefined,
          event.organizationId
        )
      }
      // Invalidate event query to refetch updated attendee data
      utils.event.getById.invalidate({ id: eventId })
      setShowContactSelection(false)
    },
    onError: (error, variables) => {
      if (event) {
        trackEvent(
          'whatsapp_invite_failed',
          { eventId, count: variables.contactIds.length },
          undefined,
          event.organizationId
        )
      }
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
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
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center text-muted-foreground">Loading event...</div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground">Event not found</h2>
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
    <div className="min-h-screen bg-background overflow-x-hidden">
      <div className="border-b bg-card border-border">
        <div className="container mx-auto px-4 py-4 md:px-6 max-w-full">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="pt-12 md:pt-0">
              <h1 className="text-xl md:text-2xl font-bold break-words">{event.title}</h1>
              <p className="text-sm text-muted-foreground">
                Created {formatDate(event.createdAt)}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href={`/event/${event.publicSlug}`} target="_blank">
                <Button variant="outline" size="sm" className="text-xs md:text-sm">
                  <Eye className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
                  <span className="hidden sm:inline">Preview</span>
                  <span className="sm:hidden">View</span>
                </Button>
              </Link>
              <Button variant="outline" size="sm" onClick={copyEventLink} className="text-xs md:text-sm">
                <Copy className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden sm:inline">Copy Link</span>
                <span className="sm:hidden">Link</span>
              </Button>
              <Button variant="outline" size="sm" onClick={handleExport} className="text-xs md:text-sm">
                <Download className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden sm:inline">Export</span>
                <span className="sm:hidden">Export</span>
              </Button>
              {event.qrCode && (
                <>
                  <Link href={`/events/${eventId}/scan`}>
                    <Button size="sm" className="text-xs md:text-sm">
                      <ScanLine className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
                      <span className="hidden sm:inline">Scan QR</span>
                      <span className="sm:hidden">Scan</span>
                    </Button>
                  </Link>
                  <Link href={`/events/${eventId}/checkin`}>
                    <Button variant="outline" size="sm" className="text-xs md:text-sm">
                      <QrCode className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
                      <span className="hidden sm:inline">Check-in</span>
                      <span className="sm:hidden">Check-in</span>
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 md:px-6 md:py-8 max-w-full">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Tabs defaultValue="details" className="space-y-4">
              <div className="overflow-x-auto scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0 snap-x snap-mandatory">
                <TabsList className="inline-flex w-auto min-w-full md:min-w-0 snap-start">
                  <TabsTrigger value="details" className="whitespace-nowrap">Details</TabsTrigger>
                  <TabsTrigger value="attendees" className="whitespace-nowrap">
                    Attendees <span className="ml-1">({event.attendees.length})</span>
                    {checkedInCount > 0 && (
                      <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-800">
                        {checkedInCount}
                      </span>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="invite" className="whitespace-nowrap">
                    <MessageSquare className="mr-1 h-3 w-3 md:h-4 md:w-4" />
                    <span className="hidden sm:inline">Invite</span>
                    <span className="sm:hidden">Invite</span>
                  </TabsTrigger>
                  <TabsTrigger value="reminders" className="whitespace-nowrap">
                    <Bell className="mr-1 h-3 w-3 md:h-4 md:w-4" />
                    <span className="hidden sm:inline">Reminders</span>
                    <span className="sm:hidden">Remind</span>
                  </TabsTrigger>
                  <TabsTrigger value="posts" className="whitespace-nowrap">
                    <Sparkles className="mr-1 h-3 w-3 md:h-4 md:w-4" />
                    <span className="hidden sm:inline">Posts</span>
                    <span className="sm:hidden">Posts</span>
                    {posts && posts.length > 0 && ` (${posts.length})`}
                  </TabsTrigger>
                </TabsList>
              </div>

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
                        className="h-48 md:h-64 w-full rounded-lg object-cover"
                      />
                    )}

                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <Calendar className="mt-1 h-5 w-5 text-muted-foreground flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-foreground">Date & Time</p>
                          <p className="text-sm text-muted-foreground break-words">
                            {dateLabel} • {timeLabel}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <MapPin className="mt-1 h-5 w-5 text-muted-foreground flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-foreground">Location</p>
                          <p className="text-sm text-muted-foreground break-words">{event.location}</p>
                        </div>
                      </div>

                      <div>
                        <p className="font-medium text-foreground">Description</p>
                        <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                          {event.description}
                        </p>
                      </div>

                      {event.additionalNotes && (
                        <div>
                          <p className="font-medium text-foreground">Additional Notes</p>
                          <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                            {event.additionalNotes}
                          </p>
                        </div>
                      )}

                      {(event.customField1Label || event.customField2Label) && (
                        <div>
                          <p className="font-medium text-foreground">Custom Fields</p>
                          <div className="mt-2 space-y-2">
                            {event.customField1Label && (
                              <div className="text-sm">
                                <span className="font-medium text-foreground">{event.customField1Label}:</span>{' '}
                                <span className="text-muted-foreground">{event.customField1Value}</span>
                              </div>
                            )}
                            {event.customField2Label && (
                              <div className="text-sm">
                                <span className="font-medium text-foreground">{event.customField2Label}:</span>{' '}
                                <span className="text-muted-foreground">{event.customField2Value}</span>
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
                      <div className="mb-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 p-4">
                        <p className="text-sm font-medium text-blue-900 dark:text-blue-200">Capacity</p>
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{capacityInfo}</p>
                        {waitlistCount > 0 && (
                          <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">{waitlistCount} on waitlist</p>
                        )}
                      </div>
                    )}
                    {(() => {
                      const checkedInCount = event.attendees.filter((a) => a.checkedIn).length
                      const hasCheckedIn = checkedInCount > 0
                      const gridCols = event.maxCapacity 
                        ? (hasCheckedIn ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-5' : 'grid-cols-2 sm:grid-cols-4')
                        : (hasCheckedIn ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4' : 'grid-cols-2 sm:grid-cols-3')
                      
                      return (
                        <div className={`mb-4 grid gap-3 md:gap-4 ${gridCols}`}>
                          {hasCheckedIn && (
                            <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-4 text-center">
                              <CheckCircle className="mx-auto h-6 w-6 text-blue-600 dark:text-blue-400" />
                              <p className="mt-2 text-2xl font-bold text-blue-600 dark:text-blue-400">{checkedInCount}</p>
                              <p className="text-sm text-muted-foreground">Checked In</p>
                              {qrScannedCount > 0 && (
                                <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                                  {qrScannedCount} via QR
                                </p>
                              )}
                            </div>
                          )}
                          <div className="rounded-lg bg-green-50 dark:bg-green-900/20 p-4 text-center">
                            <CheckCircle className="mx-auto h-6 w-6 text-green-600 dark:text-green-400" />
                            <p className="mt-2 text-2xl font-bold text-green-600 dark:text-green-400">{confirmedCount}</p>
                            <p className="text-sm text-muted-foreground">Confirmed</p>
                          </div>
                          {waitlistCount > 0 && (
                            <div className="rounded-lg bg-yellow-50 dark:bg-yellow-900/20 p-4 text-center">
                              <Users className="mx-auto h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                              <p className="mt-2 text-2xl font-bold text-yellow-600 dark:text-yellow-400">{waitlistCount}</p>
                              <p className="text-sm text-muted-foreground">Waitlist</p>
                            </div>
                          )}
                          <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-4 text-center">
                            <XCircle className="mx-auto h-6 w-6 text-red-600 dark:text-red-400" />
                            <p className="mt-2 text-2xl font-bold text-red-600 dark:text-red-400">{declinedCount}</p>
                            <p className="text-sm text-muted-foreground">Declined</p>
                          </div>
                          <div className="rounded-lg bg-muted p-4 text-center">
                            <Users className="mx-auto h-6 w-6 text-muted-foreground" />
                            <p className="mt-2 text-2xl font-bold text-foreground">{pendingCount}</p>
                            <p className="text-sm text-muted-foreground">Pending</p>
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
                        <div className="grid grid-cols-2 gap-2 sm:gap-3 sm:grid-cols-4">
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
                              className="rounded-lg bg-purple-50 dark:bg-purple-900/20 p-3 text-center border border-purple-200 dark:border-purple-800"
                            >
                              <Users className="mx-auto h-5 w-5 text-purple-600 dark:text-purple-400 mb-1" />
                              <p className="text-lg font-bold text-purple-600 dark:text-purple-400">{manualCheckInCount}</p>
                              <p className="text-xs text-muted-foreground">Manual</p>
                              <p className="text-xs text-purple-600/70 dark:text-purple-400/70 mt-1">
                                {Math.round((manualCheckInCount / checkedInCount) * 100)}%
                              </p>
                            </motion.div>
                          )}
                          {eventQrCheckInCount > 0 && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: 0.2 }}
                              className="rounded-lg bg-orange-50 dark:bg-orange-900/20 p-3 text-center border border-orange-200 dark:border-orange-800"
                            >
                              <QrCode className="mx-auto h-5 w-5 text-orange-600 dark:text-orange-400 mb-1" />
                              <p className="text-lg font-bold text-orange-600 dark:text-orange-400">{eventQrCheckInCount}</p>
                              <p className="text-xs text-muted-foreground">Event QR</p>
                              <p className="text-xs text-orange-600/70 dark:text-orange-400/70 mt-1">
                                {Math.round((eventQrCheckInCount / checkedInCount) * 100)}%
                              </p>
                            </motion.div>
                          )}
                          {checkedInCount - qrScannedCount - manualCheckInCount - eventQrCheckInCount > 0 && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: 0.3 }}
                              className="rounded-lg bg-muted p-3 text-center border border-border"
                            >
                              <CheckCircle className="mx-auto h-5 w-5 text-muted-foreground mb-1" />
                              <p className="text-lg font-bold text-foreground">
                                {checkedInCount - qrScannedCount - manualCheckInCount - eventQrCheckInCount}
                              </p>
                              <p className="text-xs text-muted-foreground">Other</p>
                              <p className="text-xs text-muted-foreground/70 mt-1">
                                {Math.round(((checkedInCount - qrScannedCount - manualCheckInCount - eventQrCheckInCount) / checkedInCount) * 100)}%
                              </p>
                            </motion.div>
                          )}
                        </div>
                        {qrScannedCount > 0 && (
                          <div className="mt-3 rounded-lg bg-green-50 dark:bg-green-900/20 p-2 text-center border border-green-200 dark:border-green-800">
                            <p className="text-xs font-medium text-green-700 dark:text-green-300">
                              ✨ {qrScannedCount} attendee{qrScannedCount !== 1 ? 's' : ''} used fast QR scan check-in!
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="space-y-2">
                      {event.attendees.length === 0 ? (
                        <p className="py-8 text-center text-muted-foreground">No attendees yet</p>
                      ) : (
                        event.attendees.map((attendee) => (
                          <div
                            key={attendee.id}
                            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-lg border border-border p-3"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-foreground break-words">{attendee.name}</p>
                              <p className="text-sm text-muted-foreground break-words">{attendee.phone}</p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              {attendee.checkedIn && (
                                <div className="flex flex-wrap items-center gap-2">
                                  <div className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800 whitespace-nowrap">
                                    ✓ Checked In
                                  </div>
                                  {attendee.checkInMethod && (
                                    <div className="text-xs text-muted-foreground whitespace-nowrap">
                                      {attendee.checkInMethod === 'qr_scan' && '📱 QR Scan'}
                                      {attendee.checkInMethod === 'manual' && '✋ Manual'}
                                      {attendee.checkInMethod === 'event_qr' && '📋 Event QR'}
                                      {attendee.checkInMethod === 'self_qr' && '📱 Self QR'}
                                    </div>
                                  )}
                                </div>
                              )}
                              <div
                                className={`rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap ${
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
                <div className="rounded-lg border-2 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-4">
                  <div className="flex items-start gap-3">
                    <MessageSquare className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                    <div>
                      <p className="font-medium text-blue-900 dark:text-blue-200 mb-1">Manual WhatsApp (MVP)</p>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
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

          <div className="space-y-4 lg:sticky lg:top-4">
            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Invited</p>
                  <p className="text-2xl font-bold text-foreground">{event.attendees.length}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Confirmed</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">{confirmedCount}</p>
                </div>
                {event.maxCapacity && (
                  <div>
                    <p className="text-sm text-muted-foreground">Capacity</p>
                    <p className="text-2xl font-bold text-foreground">{capacityInfo}</p>
                  </div>
                )}
                {waitlistCount > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground">Waitlist</p>
                    <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{waitlistCount}</p>
                  </div>
                )}
                {checkedInCount > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground">Checked In</p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{checkedInCount}</p>
                    {qrScannedCount > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {qrScannedCount} via QR scan
                      </p>
                    )}
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Response Rate</p>
                  <p className="text-2xl font-bold text-foreground">
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
