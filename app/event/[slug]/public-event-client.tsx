'use client'

import { trpc } from '@/lib/trpc-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatDate, formatTime } from '@/lib/utils'
import { Calendar, MapPin, Clock, CheckCircle, XCircle, HelpCircle } from 'lucide-react'
import { useState } from 'react'
import { useToast } from '@/hooks/use-toast'

export function PublicEventClient({ slug }: { slug: string }) {
  const { toast } = useToast()
  const { data: event, isLoading } = trpc.event.getBySlug.useQuery({ slug })
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'confirmed' | 'declined' | 'maybe' | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const registerMutation = trpc.attendee.register.useMutation({
    onSuccess: () => {
      setSubmitted(true)
      toast({
        title: 'Success!',
        description: 'Your attendance has been confirmed',
      })
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name || !phone || !status) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      })
      return
    }

    registerMutation.mutate({
      eventSlug: slug,
      name,
      phone,
      email: email || null,
      status,
    })
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center text-gray-500">Loading event...</div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Event not found</h2>
          <p className="mt-2 text-gray-600">This event may have been removed or the link is invalid.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-2xl">
          <Card className="overflow-hidden">
            {event.imageUrl && (
              <div className="relative h-64 w-full">
                <img
                  src={event.imageUrl}
                  alt={event.title}
                  className="h-full w-full object-cover"
                />
              </div>
            )}

            <CardContent className="p-6 md:p-8">
              <h1 className="mb-4 text-3xl font-bold">{event.title}</h1>

              <div className="mb-6 space-y-3">
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
                    <p className="font-medium">Additional Information</p>
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

              {!submitted ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Your Name *</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your name"
                      className="mt-1"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Enter your phone number"
                      className="mt-1"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">Email (Optional)</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label>Will you be attending? *</Label>
                    <div className="mt-2 grid grid-cols-3 gap-2">
                      <Button
                        type="button"
                        variant={status === 'confirmed' ? 'default' : 'outline'}
                        onClick={() => setStatus('confirmed')}
                        className="w-full"
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Yes
                      </Button>
                      <Button
                        type="button"
                        variant={status === 'declined' ? 'destructive' : 'outline'}
                        onClick={() => setStatus('declined')}
                        className="w-full"
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        No
                      </Button>
                      <Button
                        type="button"
                        variant={status === 'maybe' ? 'default' : 'outline'}
                        onClick={() => setStatus('maybe')}
                        className="w-full"
                      >
                        <HelpCircle className="mr-2 h-4 w-4" />
                        Maybe
                      </Button>
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={!status}>
                    Confirm Attendance
                  </Button>
                </form>
              ) : (
                <div className="rounded-lg bg-green-50 p-6 text-center">
                  <CheckCircle className="mx-auto h-12 w-12 text-green-600" />
                  <h3 className="mt-4 text-lg font-semibold">Thank you for confirming!</h3>
                  <p className="mt-2 text-sm text-gray-600">
                    We look forward to seeing you at the event.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
