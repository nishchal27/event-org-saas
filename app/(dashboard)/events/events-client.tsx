'use client'

import { trpc } from '@/lib/trpc-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Calendar, MapPin, Clock, Users, MoreVertical, Edit, Copy, Trash2, CalendarDays } from 'lucide-react'
import Link from 'next/link'
import { formatDate, formatTime } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import { useUser } from '@clerk/nextjs'

export function EventsClient() {
  const router = useRouter()
  const { toast } = useToast()
  const utils = trpc.useUtils()
  const { isLoaded: userLoaded } = useUser()
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false)
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const [daysOffset, setDaysOffset] = useState(7)
  
  const { data: events, isLoading } = trpc.event.getAll.useQuery(undefined, {
    staleTime: 60 * 1000,
    enabled: userLoaded,
  })
  const duplicateMutation = trpc.event.duplicate.useMutation({
    onSuccess: (newEvent) => {
      // Invalidate events list to refetch with new duplicated event
      utils.event.getAll.invalidate()
      setDuplicateDialogOpen(false)
      toast({
        title: 'Event duplicated',
        description: 'Your event has been duplicated successfully.',
      })
      router.push(`/events/${newEvent.id}`)
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    },
  })
  const deleteMutation = trpc.event.delete.useMutation({
    onSuccess: () => {
      // Invalidate events list to remove deleted event
      utils.event.getAll.invalidate()
      toast({
        title: 'Event deleted',
        description: 'Your event has been deleted successfully.',
      })
    },
  })

  const handleDuplicate = (id: string) => {
    setSelectedEventId(id)
    setDuplicateDialogOpen(true)
  }

  const handleDuplicateConfirm = () => {
    if (selectedEventId) {
      duplicateMutation.mutate({ 
        id: selectedEventId,
        daysOffset: daysOffset,
      })
    }
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this event?')) {
      deleteMutation.mutate({ id })
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Events</h1>
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
        {isLoading ? (
          <div className="py-8 text-center text-gray-500">Loading events...</div>
        ) : !events || events.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-semibold">No events yet</h3>
              <p className="mt-2 text-gray-500">Create your first event to get started</p>
              <Link href="/events/new" className="mt-4 inline-block">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Event
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => {
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
                <Card key={event.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="line-clamp-2">{event.title}</CardTitle>
                        <CardDescription className="mt-2">
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4" />
                            {dateLabel}
                          </div>
                          <div className="flex items-center gap-2 text-sm mt-1">
                            <Clock className="h-4 w-4" />
                            {timeLabel}
                          </div>
                          <div className="flex items-center gap-2 text-sm mt-1">
                            <MapPin className="h-4 w-4" />
                            <span className="line-clamp-1">{event.location}</span>
                          </div>
                        </CardDescription>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.push(`/events/${event.id}`)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicate(event.id)}>
                            <Copy className="mr-2 h-4 w-4" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicate(event.id)}>
                            <CalendarDays className="mr-2 h-4 w-4" />
                            Duplicate (Next Week)
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(event.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Users className="h-4 w-4" />
                        {event._count.attendees} attendees
                      </div>
                      <Link href={`/events/${event.id}`}>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Duplicate Dialog */}
      <Dialog open={duplicateDialogOpen} onOpenChange={setDuplicateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Duplicate Event</DialogTitle>
            <DialogDescription>
              Create a copy of this event. You can shift the date for recurring events or series.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="daysOffset">Shift date by (days)</Label>
              <Input
                id="daysOffset"
                type="number"
                value={daysOffset}
                onChange={(e) => setDaysOffset(Number(e.target.value))}
                placeholder="7 (for next week)"
                className="mt-1"
              />
              <p className="mt-1 text-xs text-gray-500">
                Enter 7 for next week, 14 for 2 weeks later, or 0 to keep the same date.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDuplicateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleDuplicateConfirm} disabled={duplicateMutation.isLoading}>
              {duplicateMutation.isLoading ? 'Duplicating...' : 'Duplicate Event'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
