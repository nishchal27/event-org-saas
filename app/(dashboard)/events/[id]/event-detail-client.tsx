'use client'

import { trpc } from '@/lib/trpc-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatDate, formatTime } from '@/lib/utils'
import { Calendar, MapPin, Clock, Users, CheckCircle, XCircle, MessageSquare, Eye, Share2, Copy, Download, QrCode, FileText } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'
import { ContactSelection } from '@/components/contact-selection'
import { useToast } from '@/hooks/use-toast'
import { PostsTabClient } from './posts-tab-client'
import { Sparkles } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

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
                <Link href={`/events/${eventId}/checkin`}>
                  <Button variant="outline">
                    <QrCode className="mr-2 h-4 w-4" />
                    Check-in
                  </Button>
                </Link>
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
                <TabsTrigger value="posts">
                  <Sparkles className="mr-1 h-4 w-4" />
                  Posts {posts && posts.length > 0 && `(${posts.length})`}
                </TabsTrigger>
                <TabsTrigger value="invite">Invite</TabsTrigger>
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
                                <div className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                                  ✓ Checked In
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

              <TabsContent value="invite">
                <Card>
                  <CardHeader>
                    <CardTitle>Send Invitations</CardTitle>
                    <CardDescription>
                      Select contacts to send WhatsApp invitations
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {contacts && contacts.length > 0 ? (
                      <>
                        <ContactSelection
                          contacts={contacts}
                          selectedContacts={selectedContacts}
                          onSelectionChange={setSelectedContacts}
                        />
                        
                        {/* Message Template Selection */}
                        {messageTemplates && messageTemplates.length > 0 && (
                          <div className="space-y-2">
                            <Label>Message Template (Optional)</Label>
                            <Select
                              value={selectedMessageTemplateId}
                              onValueChange={(value) => {
                                setSelectedMessageTemplateId(value)
                                setCustomMessage('')
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Use default message or select a template..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="">Default Message</SelectItem>
                                {messageTemplates.map((template) => (
                                  <SelectItem key={template.id} value={template.id}>
                                    <div className="flex items-center gap-2">
                                      <FileText className="h-4 w-4" />
                                      <span>{template.name}</span>
                                      <span className="text-xs text-muted-foreground">
                                        ({template.type})
                                      </span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {selectedMessageTemplate && (
                              <div className="rounded-lg bg-muted p-3 text-sm">
                                <p className="font-medium mb-1">Template Preview:</p>
                                <p className="text-muted-foreground whitespace-pre-wrap">
                                  {selectedMessageTemplate.content}
                                </p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Custom Message Override */}
                        <div className="space-y-2">
                          <Label>Custom Message (Optional - Overrides template)</Label>
                          <Textarea
                            value={customMessage}
                            onChange={(e) => setCustomMessage(e.target.value)}
                            placeholder="Enter custom message or leave empty to use template/default..."
                            rows={4}
                            className="font-mono text-sm"
                          />
                          <p className="text-xs text-muted-foreground">
                            Available variables: {'{name}'}, {'{eventTitle}'}, {'{eventDate}'}, {'{eventTime}'}, {'{eventLocation}'}
                          </p>
                        </div>

                        <Button
                          onClick={handleSendInvites}
                          disabled={whatsappMutation.isLoading || selectedContacts.length === 0}
                          className="w-full"
                        >
                          <MessageSquare className="mr-2 h-4 w-4" />
                          {whatsappMutation.isLoading
                            ? 'Sending...'
                            : `Send to ${selectedContacts.length} contact${selectedContacts.length !== 1 ? 's' : ''}`}
                        </Button>
                      </>
                    ) : (
                      <div className="py-8 text-center">
                        <p className="text-gray-500">No contacts available</p>
                        <Link href="/contacts" className="mt-4 inline-block">
                          <Button variant="outline">Add Contacts</Button>
                        </Link>
                      </div>
                    )}
                  </CardContent>
                </Card>
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
