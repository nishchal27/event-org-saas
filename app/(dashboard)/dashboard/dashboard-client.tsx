'use client'

import { trpc } from '@/lib/trpc-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Calendar, Users, MessageSquare, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Activity, BarChart3 } from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'

export function DashboardClient() {
  const { data: events, isLoading: eventsLoading } = trpc.event.getAll.useQuery(undefined, {
    staleTime: 60 * 1000,
  })
  const { data: usage } = trpc.subscription.getUsage.useQuery(undefined, {
    staleTime: 2 * 60 * 1000,
  })
  const { data: analytics, isLoading: analyticsLoading } = trpc.analytics.getOverview.useQuery(undefined, {
    staleTime: 5 * 60 * 1000, // Analytics can be cached longer
  })

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
        {/* Key Metrics */}
        {analytics && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardDescription className="text-muted-foreground">Events This Month</CardDescription>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl text-foreground">
                    {analytics.currentMonth.events}
                  </CardTitle>
                  {analytics.trends.eventsChange !== 0 && (
                    <div className={`flex items-center gap-1 text-sm ${analytics.trends.eventsChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {analytics.trends.eventsChange > 0 ? (
                        <ArrowUpRight className="h-4 w-4" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4" />
                      )}
                      {Math.abs(analytics.trends.eventsChange)}%
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  {analytics.lastMonth.events} last month
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardDescription className="text-muted-foreground">Confirmed Attendees</CardDescription>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl text-foreground">
                    {analytics.currentMonth.confirmed}
                  </CardTitle>
                  {analytics.trends.attendanceChange !== 0 && (
                    <div className={`flex items-center gap-1 text-sm ${analytics.trends.attendanceChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {analytics.trends.attendanceChange > 0 ? (
                        <ArrowUpRight className="h-4 w-4" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4" />
                      )}
                      {Math.abs(analytics.trends.attendanceChange)}%
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  {analytics.lastMonth.confirmed} last month
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardDescription className="text-muted-foreground">Response Rate</CardDescription>
                <CardTitle className="text-2xl text-foreground">
                  {analytics.currentMonth.responseRate}%
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${analytics.currentMonth.responseRate}%` }}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardDescription className="text-muted-foreground">Upcoming Events</CardDescription>
                <CardTitle className="text-2xl text-foreground">
                  {analytics.upcomingEvents}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Scheduled events
                </p>
              </CardContent>
            </Card>
          </div>
        )}

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

        {/* Charts Row */}
        {analytics && analytics.monthlyEvents.length > 0 && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Events Created (6 Months)
                </CardTitle>
                <CardDescription>Track your event creation trends</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.monthlyEvents}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Attendance Trends (6 Months)
                </CardTitle>
                <CardDescription>Confirmed attendees over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={analytics.monthlyAttendance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="count" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
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
