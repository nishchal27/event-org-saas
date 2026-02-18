'use client'

import { trpc } from '@/lib/trpc-client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CheckCircle2, XCircle, Loader2, Lock, Phone } from 'lucide-react'
import { useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import { motion } from 'framer-motion'
import { trackEvent } from '@/lib/analytics'

export function CheckInPublicClient({ qrCode }: { qrCode: string }) {
  const { toast } = useToast()
  const [phone, setPhone] = useState('')
  const [pin, setPin] = useState('')
  const [isCheckingIn, setIsCheckingIn] = useState(false)
  const [checkInResult, setCheckInResult] = useState<'success' | 'error' | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState<string>('')

  const {
    data: context,
    isLoading: isLoadingContext,
    error: contextError,
  } = trpc.attendee.getCheckInContext.useQuery({ qrCode })

  const checkInByQrMutation = trpc.attendee.checkInByQR.useMutation({
    onSuccess: (data) => {
      setCheckInResult('success')
      setIsCheckingIn(false)
      setSuccessMessage(
        data.checkedInAt
          ? `Checked in for ${data.event?.title || 'the event'}.`
          : 'Check-in completed.'
      )
      toast({
        title: 'Success!',
        description: 'You have been checked in successfully.',
      })
      setPhone('')
      setPin('')

      trackEvent(
        'check_in_success',
        { eventId: context?.event?.id, kind: context?.kind, method: 'checkInByQR' },
        undefined,
        context?.event?.organizationId
      )
    },
    onError: (error) => {
      setCheckInResult('error')
      setErrorMessage(error.message)
      setIsCheckingIn(false)
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })

      trackEvent(
        'check_in_error',
        { eventId: context?.event?.id, kind: context?.kind, method: 'checkInByQR', errorMessage: error.message },
        undefined,
        context?.event?.organizationId
      )
    },
  })

  const selfCheckInMutation = trpc.attendee.selfCheckIn.useMutation({
    onSuccess: (data) => {
      setCheckInResult('success')
      setIsCheckingIn(false)
      setSuccessMessage(
        data.checkedInAt
          ? `Checked in for ${data.event?.title || 'the event'}.`
          : 'Check-in completed.'
      )
      toast({
        title: 'Success!',
        description: 'You have been checked in successfully.',
      })
      setPhone('')
      setPin('')

      trackEvent(
        'self_check_in_success',
        { eventId: context?.event?.id, kind: context?.kind, method: 'selfCheckIn' },
        undefined,
        context?.event?.organizationId
      )
    },
    onError: (error) => {
      setCheckInResult('error')
      setErrorMessage(error.message)
      setIsCheckingIn(false)
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })

      trackEvent(
        'self_check_in_error',
        { eventId: context?.event?.id, kind: context?.kind, method: 'selfCheckIn', errorMessage: error.message },
        undefined,
        context?.event?.organizationId
      )
    },
  })

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (context?.requirements.phoneRequired && !phone.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter your phone number',
        variant: 'destructive',
      })
      return
    }
    if (context?.requirements.pinRequired && !pin.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter the venue PIN',
        variant: 'destructive',
      })
      return
    }

    if (context?.window.status && context.window.status !== 'open') {
      toast({
        title: 'Check-in unavailable',
        description:
          context.window.status === 'not_open'
            ? 'Check-in has not opened yet.'
            : 'Check-in is closed for this event.',
        variant: 'destructive',
      })
      return
    }

    setIsCheckingIn(true)
    setCheckInResult(null)
    setErrorMessage('')
    setSuccessMessage('')

    if (context?.requirements.pinRequired) {
      selfCheckInMutation.mutate({
        qrCode,
        phone: context.requirements.phoneRequired ? phone.trim() : undefined,
        pin: pin.trim(),
      })
    } else {
      checkInByQrMutation.mutate({
        qrCode,
        phone: context?.requirements.phoneRequired ? phone.trim() : undefined,
      })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-2xl">
          <CardHeader className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10"
            >
              <CheckCircle2 className="h-8 w-8 text-primary" />
            </motion.div>
            <CardTitle className="text-2xl">
              {context?.event?.title ? `Check in to ${context.event.title}` : 'Event Check-in'}
            </CardTitle>
            <CardDescription>
              {isLoadingContext
                ? 'Loading event...'
                : contextError
                  ? 'Invalid or expired QR code'
                  : context?.requirements.phoneRequired
                    ? 'Enter your phone and venue PIN to check in'
                    : 'Enter the venue PIN to check in'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {checkInResult === 'success' ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-4"
              >
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                  <CheckCircle2 className="h-10 w-10 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-green-600">Checked In!</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {successMessage || 'You have been successfully checked in to this event.'}
                  </p>
                </div>
                <Button
                  onClick={() => {
                    setCheckInResult(null)
                    setPhone('')
                    setPin('')
                  }}
                  variant="outline"
                  className="w-full"
                >
                  Check In Another
                </Button>
              </motion.div>
            ) : (
              <form onSubmit={handleCheckIn} className="space-y-4">
                {context?.requirements.phoneRequired && (
                  <div>
                    <Label htmlFor="phone">Phone Number *</Label>
                    <div className="mt-1 relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => {
                          setPhone(e.target.value)
                          setCheckInResult(null)
                          setErrorMessage('')
                        }}
                        placeholder="e.g. 9876543210"
                        required
                        className="pl-10"
                        disabled={isCheckingIn || isLoadingContext || !!contextError}
                        autoComplete="tel"
                        inputMode="tel"
                      />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Use the same phone number you used to register
                    </p>
                  </div>
                )}

                {context?.requirements.pinRequired && (
                  <div>
                    <Label htmlFor="pin">Venue PIN *</Label>
                    <div className="mt-1 relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="pin"
                        type="password"
                        value={pin}
                        onChange={(e) => {
                          setPin(e.target.value)
                          setCheckInResult(null)
                          setErrorMessage('')
                        }}
                        placeholder="Enter venue PIN"
                        required
                        className="pl-10"
                        disabled={isCheckingIn || isLoadingContext || !!contextError}
                        autoComplete="one-time-code"
                        inputMode="numeric"
                      />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Ask the organizer for the PIN shown at the venue
                    </p>
                  </div>
                )}

                {checkInResult === 'error' && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-lg bg-red-50 border border-red-200 p-3 flex items-start gap-3"
                  >
                    <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-red-900">Check-in Failed</p>
                      <p className="text-xs text-red-700 mt-1">{errorMessage}</p>
                    </div>
                  </motion.div>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={
                    isCheckingIn ||
                    isLoadingContext ||
                    !!contextError ||
                    (context?.requirements.phoneRequired ? !phone.trim() : false) ||
                    (context?.requirements.pinRequired ? !pin.trim() : false) ||
                    (context?.window.status ? context.window.status !== 'open' : false)
                  }
                >
                  {isCheckingIn ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Checking in...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Check In
                    </>
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
