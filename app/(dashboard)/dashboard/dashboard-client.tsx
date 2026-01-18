'use client'

import { trpc } from '@/lib/trpc-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Calendar, Users, MessageSquare, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import { useUser } from '@clerk/nextjs'

export function DashboardClient() {
  const { isLoaded: userLoaded } = useUser()
  
  const { data: events, isLoading: eventsLoading } = trpc.event.getAll.useQuery(undefined, {
    staleTime: 60 * 1000,
    enabled: userLoaded, // Only fetch when user is loaded
    retry: (failureCount, error: any) => {
      // Retry on UNAUTHORIZED errors (might be timing issue)
      if (error?.data?.code === 'UNAUTHORIZED' && failureCount < 2) {
        return true
      }
      return false
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })
  const { data: usage } = trpc.subscription.getUsage.useQuery(undefined, {
    staleTime: 2 * 60 * 1000,
    enabled: userLoaded, // Only fetch when user is loaded
    retry: (failureCount, error: any) => {
      // Retry on UNAUTHORIZED errors (might be timing issue)
      if (error?.data?.code === 'UNAUTHORIZED' && failureCount < 2) {
        return true
      }
      return false
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })
  // Analytics dashboard is available at /analytics (admin-only)
  // Removed analytics call from main dashboard to avoid errors

  const recentEvents = events?.slice(0, 5) || []

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
              <p className="text-sm text-muted-foreground mt-1">Welcome back! Here's what's happening.</p>
            </div>
            <Link href="/events/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Event
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Note: Analytics dashboard is available at /analytics (admin-only) */}

        {/* Usage Stats */}
        {usage && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardDescription className="text-muted-foreground">Events This Month</CardDescription>
                <CardTitle className="text-2xl text-foreground">
                  {usage.usage.eventsCreated} / {usage.limits.events === 999999 ? '∞' : usage.limits.events}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardDescription className="text-muted-foreground">Contacts</CardDescription>
                <CardTitle className="text-2xl text-foreground">
                  {usage.usage.contactsCount}
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-1">Higher limit</p>
              </CardHeader>
            </Card>
            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardDescription className="text-muted-foreground">WhatsApp Sent</CardDescription>
                <CardTitle className="text-2xl text-foreground">
                  {usage.usage.whatsappSent} / {usage.limits.whatsapp}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardDescription className="text-muted-foreground">AI Generations</CardDescription>
                <CardTitle className="text-2xl text-foreground">
                  {usage.usage.aiGenerations} / {usage.limits.ai}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>
        )}


        {/* Recent Events & Quick Actions */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2 bg-card border-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-foreground">Recent Events</CardTitle>
                  <CardDescription className="text-muted-foreground">Your latest events</CardDescription>
                </div>
                <Link href="/events">
                  <Button variant="outline" size="sm">
                    View All
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {eventsLoading ? (
                <div className="py-8 text-center text-muted-foreground">Loading events...</div>
              ) : !events || events.length === 0 ? (
                <div className="py-12 text-center">
                  <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold text-foreground">No events yet</h3>
                  <p className="mt-2 text-muted-foreground">Create your first event to get started</p>
                  <Link href="/events/new" className="mt-4 inline-block">
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Event
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentEvents.map((event) => (
                    <Link
                      key={event.id}
                      href={`/events/${event.id}`}
                      className="block rounded-lg border border-border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-md"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-foreground">{event.title}</h3>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {formatDate(event.eventDate)} • {event.startTime}
                          </p>
                          <p className="mt-1 text-sm text-muted-foreground">{event.location}</p>
                        </div>
                        <div className="ml-4 text-right">
                          <div className="text-sm font-medium text-foreground">
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

          {/* Quick Actions */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Quick Actions</CardTitle>
              <CardDescription className="text-muted-foreground">Common tasks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/events/new" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <Plus className="mr-2 h-4 w-4" />
                  Create New Event
                </Button>
              </Link>
              <Link href="/contacts" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <Users className="mr-2 h-4 w-4" />
                  Manage Contacts
                </Button>
              </Link>
              <Link href="/pricing" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  View Plans
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
