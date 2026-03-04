'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { trpc } from '@/lib/trpc-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Calendar, Users, TrendingUp, Activity } from 'lucide-react'
import Link from 'next/link'
import { formatDate, formatRelativeTime } from '@/lib/utils'
import { useUser } from '@clerk/nextjs'
import { useToast } from '@/hooks/use-toast'
import { useDashboardOrg } from '../dashboard-org-context'

function getActivityLabel(event: string, properties: Record<string, unknown>): string {
  const count = typeof properties?.count === 'number' ? properties.count : null
  switch (event) {
    case 'event_created':
      return 'Event created'
    case 'event_updated':
      return 'Event updated'
    case 'event_deleted':
      return 'Event deleted'
    case 'whatsapp_invite_sent':
      return count != null ? `WhatsApp invites sent (${count})` : 'WhatsApp invites sent'
    case 'whatsapp_invite_failed':
      return 'WhatsApp invite failed'
    case 'check_in_success':
    case 'check_in_manual':
      return 'Check-in'
    case 'self_check_in_success':
      return 'Self check-in'
    case 'registration_success':
      return 'New registration'
    default:
      return event.replace(/_/g, ' ')
  }
}

export function DashboardClient() {
  const { isLoaded: userLoaded } = useUser()
  const { hasOrganization } = useDashboardOrg()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  useEffect(() => {
    if (searchParams.get('success') === 'early_access') {
      toast({
        title: 'Premium access unlocked',
        description: 'All premium features are now available for your account.',
      })
      const url = new URL(window.location.href)
      url.searchParams.delete('success')
      window.history.replaceState({}, '', url.pathname + (url.search || ''))
    }
  }, [searchParams, toast])

  const orgQueriesEnabled = userLoaded && hasOrganization
  const { data: events, isLoading: eventsLoading } = trpc.event.getAll.useQuery(undefined, {
    staleTime: 60 * 1000,
    enabled: orgQueriesEnabled,
  })
  const { data: usage } = trpc.subscription.getUsage.useQuery(undefined, {
    staleTime: 2 * 60 * 1000,
    enabled: orgQueriesEnabled,
  })
  const { data: recentActivity = [], isLoading: activityLoading } = trpc.analytics.getRecentActivity.useQuery(
    { limit: 15 },
    { staleTime: 60 * 1000, enabled: orgQueriesEnabled }
  )

  type RecentActivityItem = {
    id: string
    event: string
    properties: unknown | null
    timestamp: Date | string
  }

  const recentActivitySafe: RecentActivityItem[] = (recentActivity ?? []) as RecentActivityItem[]

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


        {/* Recent Activity */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent activity
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Latest actions across your organization
            </CardDescription>
          </CardHeader>
            <CardContent>
            {activityLoading ? (
              <div className="py-6 text-center text-muted-foreground text-sm">Loading activity...</div>
              ) : recentActivitySafe.length === 0 ? (
              <div className="py-6 text-center text-muted-foreground text-sm">
                Activity will appear here as you create events, send invites, and check in attendees.
              </div>
            ) : (
              <ul className="space-y-2">
                {recentActivitySafe.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between gap-4 rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm"
                  >
                    <span className="text-foreground">
                      {getActivityLabel(item.event, (item.properties as Record<string, unknown>) ?? {})}
                    </span>
                    <span className="text-muted-foreground shrink-0">
                      {formatRelativeTime(item.timestamp)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

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
