'use client'

import { trpc } from '@/lib/trpc-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatDate, formatTime } from '@/lib/utils'
import { Calendar, MapPin, Clock, Users, CheckCircle, XCircle, MessageSquare, Eye, Share2, Copy } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'
import { ContactSelection } from '@/components/contact-selection'
import { useToast } from '@/hooks/use-toast'

export function EventDetailClient({ eventId }: { eventId: string }) {
  const router = useRouter()
  const { toast } = useToast()
  const { data: event, isLoading, refetch } = trpc.event.getById.useQuery({ id: eventId })
  const { data: contacts } = trpc.contact.getAll.useQuery()
  const [selectedContacts, setSelectedContacts] = useState<string[]>([])
  const [showContactSelection, setShowContactSelection] = useState(false)

  const whatsappMutation = trpc.whatsapp.sendInvite.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'WhatsApp invitations sent successfully!',
      })
      refetch()
      setShowContactSelection(false)
    },
  })

  const handleSendInvites = () => {
    if (selectedContacts.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select at least one contact',
        variant: 'destructive',
      })
      return
    }

    whatsappMutation.mutate({
      eventId,
      contactIds: selectedContacts,
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

  const confirmedCount = event.attendees.filter((a) => a.status === 'confirmed').length
  const declinedCount = event.attendees.filter((a) => a.status === 'declined').length
  const pendingCount = event.attendees.filter((a) => a.status === 'pending').length

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
                <TabsTrigger value="attendees">Attendees ({event.attendees.length})</TabsTrigger>
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
                            {formatDate(event.eventDate)} • {formatTime(event.startTime)}
                            {event.endTime && ` - ${formatTime(event.endTime)}`}
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
                    <div className="mb-4 grid grid-cols-3 gap-4">
                      <div className="rounded-lg bg-green-50 p-4 text-center">
                        <CheckCircle className="mx-auto h-6 w-6 text-green-600" />
                        <p className="mt-2 text-2xl font-bold text-green-600">{confirmedCount}</p>
                        <p className="text-sm text-gray-600">Confirmed</p>
                      </div>
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
                            <div
                              className={`rounded-full px-3 py-1 text-xs font-medium ${
                                attendee.status === 'confirmed'
                                  ? 'bg-green-100 text-green-800'
                                  : attendee.status === 'declined'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {attendee.status}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
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
