'use client'

import { trpc } from '@/lib/trpc-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Calendar, Users, MessageSquare } from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'

export function DashboardClient() {
  const { data: events, isLoading } = trpc.event.getAll.useQuery(undefined, {
    // Events list is fresh for 1 minute
    staleTime: 60 * 1000,
  })
  const { data: usage } = trpc.subscription.getUsage.useQuery(undefined, {
    // Usage stats are fresh for 2 minutes (they don't change frequently)
    staleTime: 2 * 60 * 1000,
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <Link href="/events/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Event
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Usage Stats */}
        {usage && (
          <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Events This Month</CardDescription>
                <CardTitle className="text-2xl">
                  {usage.usage.eventsCreated} / {usage.limits.events}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Contacts</CardDescription>
                <CardTitle className="text-2xl">
                  {usage.usage.contactsCount} / {usage.limits.contacts}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>WhatsApp Sent</CardDescription>
                <CardTitle className="text-2xl">
                  {usage.usage.whatsappSent} / {usage.limits.whatsapp}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>AI Generations</CardDescription>
                <CardTitle className="text-2xl">
                  {usage.usage.aiGenerations} / {usage.limits.ai}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>
        )}

        {/* Events List */}
        <Card>
          <CardHeader>
            <CardTitle>Your Events</CardTitle>
            <CardDescription>Manage and track your events</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="py-8 text-center text-gray-500">Loading events...</div>
            ) : !events || events.length === 0 ? (
              <div className="py-12 text-center">
                <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-lg font-semibold">No events yet</h3>
                <p className="mt-2 text-gray-500">Create your first event to get started</p>
                <Link href="/events/new" className="mt-4 inline-block">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Event
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {events.map((event) => (
                  <Link
                    key={event.id}
                    href={`/events/${event.id}`}
                    className="block rounded-lg border bg-white p-4 transition-shadow hover:shadow-md"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold">{event.title}</h3>
                        <p className="mt-1 text-sm text-gray-600">
                          {formatDate(event.eventDate)} • {event.startTime}
                        </p>
                        <p className="mt-1 text-sm text-gray-500">{event.location}</p>
                      </div>
                      <div className="ml-4 text-right">
                        <div className="text-sm font-medium">
                          <Users className="mr-1 inline h-4 w-4" />
                          {event._count.attendees} attendees
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
