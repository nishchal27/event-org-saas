'use client'

import { trpc } from '@/lib/trpc-client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, CheckCircle2, ScanLine, Users, TrendingUp, AlertTriangle } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'

// Type definition for error items to avoid deep type inference
type ErrorItem = {
  id: string
  event: string
  properties: unknown
  timestamp: Date | string
  userAgent: string | null
  url: string | null
}

// Helper function to render error item (breaks type inference chain)
function renderErrorItem(error: ErrorItem) {
  const errorProps = error.properties && typeof error.properties === 'object' 
    ? (error.properties as Record<string, any>)
    : null
  const timestamp = error.timestamp instanceof Date 
    ? error.timestamp 
    : new Date(error.timestamp)
  
  return (
    <div
      key={error.id}
      className="border rounded-lg p-4 space-y-2"
    >
      <div className="flex items-center justify-between">
        <span className="font-medium">{error.event}</span>
        <span className="text-sm text-muted-foreground">
          {timestamp.toLocaleString()}
        </span>
      </div>
      {errorProps && (
        <div className="text-sm text-muted-foreground">
          {errorProps.errorMessage && (
            <p>Error: {String(errorProps.errorMessage)}</p>
          )}
          {errorProps.errorType && (
            <p>Type: {String(errorProps.errorType)}</p>
          )}
        </div>
      )}
      {error.url && (
        <p className="text-xs text-muted-foreground">URL: {error.url}</p>
      )}
    </div>
  )
}

export function AnalyticsDashboardClient() {
  const { data: summary, isLoading } = trpc.analytics.getSummary.useQuery()
  const { data: errors } = trpc.analytics.getErrors.useQuery({ limit: 10 })
  const { data: featureStats } = trpc.analytics.getFeatureStats.useQuery({ days: 30 })
  
  // Convert errors to ErrorItem[] to break type inference
  const errorItems: ErrorItem[] = errors ? (errors as unknown as ErrorItem[]) : []

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!summary) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-muted-foreground">No analytics data available</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Monitor your app's performance and track key metrics
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalEvents}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Check-ins</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalCheckIns}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">QR Scans (30d)</CardTitle>
            <ScanLine className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.qrScans}</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Errors (30d)</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{summary.errors}</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Feature Usage (30 days)</CardTitle>
            <CardDescription>Events by type</CardDescription>
          </CardHeader>
          <CardContent>
            {featureStats && featureStats.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={featureStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="event" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-center py-8">No data available</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Daily Activity (7 days)</CardTitle>
            <CardDescription>Events per day</CardDescription>
          </CardHeader>
          <CardContent>
            {summary.dailyStats && summary.dailyStats.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={summary.dailyStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-center py-8">No data available</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Errors */}
      {errors && Array.isArray(errors) && errors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Recent Errors
            </CardTitle>
            <CardDescription>Latest error events that need attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {errorItems.map(renderErrorItem)}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
