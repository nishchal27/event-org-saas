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
import { cn } from '@/lib/utils'

export function PublicEventClient({ slug }: { slug: string }) {
  const { toast } = useToast()
  const { data: event, isLoading } = trpc.event.getBySlug.useQuery({ slug })
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'confirmed' | 'declined' | 'maybe' | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const registerMutation = trpc.attendee.register.useMutation({
    onSuccess: (data) => {
      setSubmitted(true)
      const message = data.isWaitlist 
        ? 'You\'ve been added to the waitlist. We\'ll notify you if a spot opens up!'
        : 'Your attendance has been confirmed!'
      toast({
        title: 'Success!',
        description: message,
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

  // Get organization customization
  const org = event.organization
  const themeColor = org?.accentColor || '#3b82f6'
  const backgroundColor = org?.backgroundColor || 'light'
  const fontStyle = org?.fontStyle || 'default'
  const orgLogo = org?.logo
  const orgName = org?.name || 'Organization'
  const startDateLabel = formatDate(event.eventDate)
  const endDateLabel = event.endDate ? formatDate(event.endDate) : null
  const dateLabel =
    endDateLabel && endDateLabel !== startDateLabel
      ? `${startDateLabel} - ${endDateLabel}`
      : startDateLabel
  const timeLabel = event.endTime
    ? `${formatTime(event.startTime)} - ${formatTime(event.endTime)}`
    : formatTime(event.startTime)

  // Font style classes
  const fontClasses = {
    default: 'font-sans',
    modern: 'font-sans',
    classic: 'font-serif',
  }

  // Background gradient based on theme color and background setting
  const getBackgroundGradient = () => {
    if (backgroundColor === 'dark') {
      // Dark background with theme color accent
      return `linear-gradient(135deg, ${themeColor}15 0%, ${themeColor}05 100%)`
    }
    // Light background with theme color accent
    const rgb = hexToRgb(themeColor)
    if (rgb) {
      return `linear-gradient(135deg, rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1) 0%, rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.05) 100%)`
    }
    return 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)'
  }

  // Helper to convert hex to RGB
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null
  }

  return (
    <div
      className={cn(
        'min-h-screen',
        backgroundColor === 'dark' ? 'bg-gray-900' : 'bg-gray-50',
        fontClasses[fontStyle as keyof typeof fontClasses]
      )}
      style={{
        background: backgroundColor === 'light' ? getBackgroundGradient() : undefined,
      }}
    >
      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-2xl">
          {/* Organization Logo/Name Header */}
          <div className="mb-6 flex items-center justify-center">
            {orgLogo ? (
              <img
                src={orgLogo}
                alt={orgName}
                className="h-16 w-auto object-contain"
              />
            ) : (
              <h2
                className="text-2xl font-bold"
                style={{ color: themeColor }}
              >
                {orgName}
              </h2>
            )}
          </div>

          <Card
            className={cn(
              'overflow-hidden',
              backgroundColor === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white'
            )}
          >
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
              <h1
                className={cn(
                  'mb-4 text-3xl font-bold',
                  backgroundColor === 'dark' ? 'text-white' : 'text-gray-900'
                )}
              >
                {event.title}
              </h1>

              <div className="mb-6 space-y-3">
                <div className="flex items-start gap-3">
                  <Calendar
                    className={cn(
                      'mt-1 h-5 w-5',
                      backgroundColor === 'dark' ? 'text-gray-400' : 'text-gray-400'
                    )}
                  />
                  <div>
                    <p
                      className={cn(
                        'font-medium',
                        backgroundColor === 'dark' ? 'text-gray-200' : 'text-gray-900'
                      )}
                    >
                      Date & Time
                    </p>
                    <p
                      className={cn(
                        'text-sm',
                        backgroundColor === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      )}
                    >
                      {dateLabel} • {timeLabel}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin
                    className={cn(
                      'mt-1 h-5 w-5',
                      backgroundColor === 'dark' ? 'text-gray-400' : 'text-gray-400'
                    )}
                  />
                  <div>
                    <p
                      className={cn(
                        'font-medium',
                        backgroundColor === 'dark' ? 'text-gray-200' : 'text-gray-900'
                      )}
                    >
                      Location
                    </p>
                    <p
                      className={cn(
                        'text-sm',
                        backgroundColor === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      )}
                    >
                      {event.location}
                    </p>
                  </div>
                </div>

                <div>
                  <p
                    className={cn(
                      'font-medium',
                      backgroundColor === 'dark' ? 'text-gray-200' : 'text-gray-900'
                    )}
                  >
                    Description
                  </p>
                  <p
                    className={cn(
                      'mt-1 whitespace-pre-wrap text-sm',
                      backgroundColor === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    )}
                  >
                    {event.description}
                  </p>
                </div>

                {event.additionalNotes && (
                  <div>
                    <p
                      className={cn(
                        'font-medium',
                        backgroundColor === 'dark' ? 'text-gray-200' : 'text-gray-900'
                      )}
                    >
                      Additional Notes
                    </p>
                    <p
                      className={cn(
                        'mt-1 whitespace-pre-wrap text-sm',
                        backgroundColor === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      )}
                    >
                      {event.additionalNotes}
                    </p>
                  </div>
                )}

                {event.maxCapacity && (
                  <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
                    <p
                      className={cn(
                        'font-medium',
                        backgroundColor === 'dark' ? 'text-blue-200' : 'text-blue-900'
                      )}
                    >
                      Capacity
                    </p>
                    <p
                      className={cn(
                        'text-sm mt-1',
                        backgroundColor === 'dark' ? 'text-blue-300' : 'text-blue-700'
                      )}
                    >
                      Maximum {event.maxCapacity} spots available. If full, you'll be added to the waitlist.
                    </p>
                  </div>
                )}

                {(event.customField1Label || event.customField2Label) && (
                  <div>
                    <p
                      className={cn(
                        'font-medium',
                        backgroundColor === 'dark' ? 'text-gray-200' : 'text-gray-900'
                      )}
                    >
                      Additional Information
                    </p>
                    <div className="mt-2 space-y-2">
                      {event.customField1Label && (
                        <div className="text-sm">
                          <span
                            className={cn(
                              'font-medium',
                              backgroundColor === 'dark' ? 'text-gray-200' : 'text-gray-900'
                            )}
                          >
                            {event.customField1Label}:
                          </span>{' '}
                          <span
                            className={cn(
                              backgroundColor === 'dark' ? 'text-gray-400' : 'text-gray-600'
                            )}
                          >
                            {event.customField1Value}
                          </span>
                        </div>
                      )}
                      {event.customField2Label && (
                        <div className="text-sm">
                          <span
                            className={cn(
                              'font-medium',
                              backgroundColor === 'dark' ? 'text-gray-200' : 'text-gray-900'
                            )}
                          >
                            {event.customField2Label}:
                          </span>{' '}
                          <span
                            className={cn(
                              backgroundColor === 'dark' ? 'text-gray-400' : 'text-gray-600'
                            )}
                          >
                            {event.customField2Value}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {!submitted ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label
                      htmlFor="name"
                      className={backgroundColor === 'dark' ? 'text-gray-200' : ''}
                    >
                      Your Name *
                    </Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your name"
                      className={cn(
                        'mt-1',
                        backgroundColor === 'dark'
                          ? 'bg-gray-700 border-gray-600 text-white placeholder:text-gray-400'
                          : ''
                      )}
                      required
                    />
                  </div>

                  <div>
                    <Label
                      htmlFor="phone"
                      className={backgroundColor === 'dark' ? 'text-gray-200' : ''}
                    >
                      Phone Number *
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Enter your phone number"
                      className={cn(
                        'mt-1',
                        backgroundColor === 'dark'
                          ? 'bg-gray-700 border-gray-600 text-white placeholder:text-gray-400'
                          : ''
                      )}
                      required
                    />
                  </div>

                  <div>
                    <Label
                      htmlFor="email"
                      className={backgroundColor === 'dark' ? 'text-gray-200' : ''}
                    >
                      Email (Optional)
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className={cn(
                        'mt-1',
                        backgroundColor === 'dark'
                          ? 'bg-gray-700 border-gray-600 text-white placeholder:text-gray-400'
                          : ''
                      )}
                    />
                  </div>

                  <div>
                    <Label className={backgroundColor === 'dark' ? 'text-gray-200' : ''}>
                      Will you be attending? *
                    </Label>
                    <div className="mt-2 grid grid-cols-3 gap-2">
                      <Button
                        type="button"
                        variant={status === 'confirmed' ? 'default' : 'outline'}
                        onClick={() => setStatus('confirmed')}
                        className="w-full"
                        style={
                          status === 'confirmed'
                            ? {
                                backgroundColor: themeColor,
                                borderColor: themeColor,
                              }
                            : {}
                        }
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
                        style={
                          status === 'maybe'
                            ? {
                                backgroundColor: themeColor,
                                borderColor: themeColor,
                              }
                            : {}
                        }
                      >
                        <HelpCircle className="mr-2 h-4 w-4" />
                        Maybe
                      </Button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={!status || registerMutation.isLoading}
                    style={{
                      backgroundColor: themeColor,
                      borderColor: themeColor,
                    }}
                  >
                    Confirm Attendance
                  </Button>
                </form>
              ) : (
                <div
                  className="rounded-lg p-6 text-center"
                  style={{
                    backgroundColor: `${themeColor}15`,
                    borderColor: `${themeColor}30`,
                    borderWidth: '1px',
                  }}
                >
                  <CheckCircle
                    className="mx-auto h-12 w-12"
                    style={{ color: themeColor }}
                  />
                  <h3
                    className={cn(
                      'mt-4 text-lg font-semibold',
                      backgroundColor === 'dark' ? 'text-white' : 'text-gray-900'
                    )}
                  >
                    Thank you for confirming!
                  </h3>
                  <p
                    className={cn(
                      'mt-2 text-sm',
                      backgroundColor === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    )}
                  >
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
