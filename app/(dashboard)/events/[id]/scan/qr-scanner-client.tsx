'use client'

import { trpc } from '@/lib/trpc-client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Camera, CheckCircle2, XCircle, Users, ScanLine, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { useToast } from '@/hooks/use-toast'
import { Html5Qrcode } from 'html5-qrcode'
import { motion, AnimatePresence } from 'framer-motion'

export function QRScannerClient({ eventId }: { eventId: string }) {
  const router = useRouter()
  const { toast } = useToast()
  const utils = trpc.useUtils()
  const { data: event, isLoading } = trpc.event.getById.useQuery({ id: eventId })
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(null)
  const [lastScanned, setLastScanned] = useState<string | null>(null)
  const [scanHistory, setScanHistory] = useState<Array<{ qrCode: string; timestamp: Date; success: boolean }>>([])

  const checkInMutation = trpc.attendee.checkInByAttendeeQR.useMutation({
    onSuccess: (data) => {
      setLastScanned(data.attendeeQrCode || 'success')
      setScanHistory((prev) => [
        { qrCode: data.attendeeQrCode || 'success', timestamp: new Date(), success: true },
        ...prev.slice(0, 4),
      ])
      toast({
        title: 'Success!',
        description: `${data.name} checked in successfully`,
      })
      utils.event.getById.invalidate({ id: eventId })
      // Reset last scanned after 2 seconds
      setTimeout(() => setLastScanned(null), 2000)
    },
    onError: (error) => {
      setLastScanned('error')
      setScanHistory((prev) => [
        { qrCode: 'error', timestamp: new Date(), success: false },
        ...prev.slice(0, 4),
      ])
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
      setTimeout(() => setLastScanned(null), 2000)
    },
  })

  useEffect(() => {
    // Check camera permission
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then(() => {
        setCameraPermission(true)
      })
      .catch(() => {
        setCameraPermission(false)
      })
  }, [])

  const startScanning = async () => {
    if (!cameraPermission) {
      toast({
        title: 'Camera Permission Required',
        description: 'Please allow camera access to scan QR codes',
        variant: 'destructive',
      })
      return
    }

    try {
      const html5QrCode = new Html5Qrcode('qr-reader')
      scannerRef.current = html5QrCode

      await html5QrCode.start(
        { facingMode: 'environment' }, // Use back camera on mobile
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          // Success callback
          handleQRScan(decodedText)
        },
        (errorMessage) => {
          // Error callback - ignore, just keep scanning
        }
      )

      setIsScanning(true)
    } catch (err) {
      console.error('Error starting scanner:', err)
      toast({
        title: 'Error',
        description: 'Failed to start camera. Please check permissions.',
        variant: 'destructive',
      })
    }
  }

  const stopScanning = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop()
        await scannerRef.current.clear()
      } catch (err) {
        console.error('Error stopping scanner:', err)
      }
      scannerRef.current = null
    }
    setIsScanning(false)
  }

  const handleQRScan = (qrCode: string) => {
    // Prevent duplicate scans within 2 seconds
    if (scanHistory.some((s) => s.qrCode === qrCode && Date.now() - s.timestamp.getTime() < 2000)) {
      return
    }

    // Pause scanning temporarily to show feedback
    if (scannerRef.current && isScanning) {
      try {
        scannerRef.current.pause()
      } catch (err) {
        // Ignore pause errors - pause might not be available in all versions
      }
    }

    checkInMutation.mutate(
      { attendeeQrCode: qrCode },
      {
        onSuccess: () => {
          // Resume scanning after successful check-in
          setTimeout(() => {
            if (scannerRef.current && isScanning) {
              try {
                scannerRef.current.resume()
              } catch {
                // If resume fails, restart scanner
                startScanning()
              }
            }
          }, 2000)
        },
        onError: () => {
          // Resume scanning after error
          setTimeout(() => {
            if (scannerRef.current && isScanning) {
              try {
                scannerRef.current.resume()
              } catch {
                startScanning()
              }
            }
          }, 2000)
        },
      }
    )
  }

  useEffect(() => {
    return () => {
      stopScanning()
    }
  }, [])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Event not found</p>
          <Link href="/events">
            <Button variant="outline" className="mt-4">
              Back to Events
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const checkedInCount = event.attendees?.filter((a) => a.checkedIn).length || 0
  const totalAttendees = event.attendees?.length || 0
  const qrScannedCount = event.attendees?.filter((a) => a.checkInMethod === 'qr_scan').length || 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b bg-white sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href={`/events/${eventId}`}>
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold">QR Scanner</h1>
                <p className="text-sm text-gray-600">{event.title}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="font-medium">{checkedInCount}</span>
                <span className="text-muted-foreground">checked in</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-gray-600" />
                <span className="font-medium">{totalAttendees}</span>
                <span className="text-muted-foreground">total</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Scanner Section */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ScanLine className="h-5 w-5" />
                  Scan Attendee QR Code
                </CardTitle>
                <CardDescription>
                  Point camera at attendee's QR code for instant check-in
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {cameraPermission === false ? (
                  <div className="p-8 text-center space-y-4">
                    <AlertCircle className="mx-auto h-12 w-12 text-yellow-500" />
                    <div>
                      <h3 className="font-semibold">Camera Permission Required</h3>
                      <p className="text-sm text-muted-foreground mt-2">
                        Please allow camera access in your browser settings to scan QR codes
                      </p>
                    </div>
                    <Button onClick={() => window.location.reload()}>
                      Grant Permission
                    </Button>
                  </div>
                ) : (
                  <>
                    {/* Scanner View */}
                    <div className="relative">
                      <div
                        id="qr-reader"
                        className={cn(
                          'w-full rounded-lg overflow-hidden bg-black',
                          isScanning ? 'min-h-[400px]' : 'min-h-[300px] flex items-center justify-center'
                        )}
                      >
                        {!isScanning && (
                          <div className="text-center text-white p-8">
                            <Camera className="mx-auto h-16 w-16 mb-4 opacity-50" />
                            <p className="text-lg font-medium">Camera Ready</p>
                            <p className="text-sm opacity-75 mt-2">
                              Click "Start Scanning" to begin
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Scan Feedback Overlay */}
                      <AnimatePresence>
                        {lastScanned === 'success' && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="absolute inset-0 bg-green-500/90 flex items-center justify-center rounded-lg"
                          >
                            <div className="text-center text-white">
                              <CheckCircle2 className="mx-auto h-16 w-16 mb-4" />
                              <p className="text-xl font-bold">Check-in Successful!</p>
                            </div>
                          </motion.div>
                        )}
                        {lastScanned === 'error' && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="absolute inset-0 bg-red-500/90 flex items-center justify-center rounded-lg"
                          >
                            <div className="text-center text-white">
                              <XCircle className="mx-auto h-16 w-16 mb-4" />
                              <p className="text-xl font-bold">Invalid QR Code</p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Control Buttons */}
                    <div className="flex gap-2">
                      {!isScanning ? (
                        <Button
                          onClick={startScanning}
                          className="flex-1"
                          size="lg"
                        >
                          <Camera className="mr-2 h-5 w-5" />
                          Start Scanning
                        </Button>
                      ) : (
                        <Button
                          onClick={stopScanning}
                          variant="destructive"
                          className="flex-1"
                          size="lg"
                        >
                          <XCircle className="mr-2 h-5 w-5" />
                          Stop Scanning
                        </Button>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Stats & History Sidebar */}
          <div className="space-y-4">
            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Check-in Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total Checked In</span>
                    <span className="text-lg font-bold">{checkedInCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">QR Scanned</span>
                    <span className="text-lg font-bold text-primary">{qrScannedCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Remaining</span>
                    <span className="text-lg font-bold">
                      {totalAttendees - checkedInCount}
                    </span>
                  </div>
                  {totalAttendees > 0 && (
                    <div className="pt-2">
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-500"
                          style={{ width: `${(checkedInCount / totalAttendees) * 100}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {Math.round((checkedInCount / totalAttendees) * 100)}% checked in
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recent Scans */}
            {scanHistory.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recent Scans</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {scanHistory.map((scan, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          'flex items-center gap-2 p-2 rounded text-sm',
                          scan.success
                            ? 'bg-green-50 text-green-700'
                            : 'bg-red-50 text-red-700'
                        )}
                      >
                        {scan.success ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          <XCircle className="h-4 w-4" />
                        )}
                        <span className="flex-1 truncate">
                          {scan.success ? 'Check-in successful' : 'Invalid QR'}
                        </span>
                        <span className="text-xs opacity-75">
                          {scan.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Fallback Options */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Other Options</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href={`/events/${eventId}/checkin`}>
                  <Button variant="outline" className="w-full justify-start">
                    <Users className="mr-2 h-4 w-4" />
                    Manual Check-in
                  </Button>
                </Link>
                <Link href={`/events/${eventId}`}>
                  <Button variant="outline" className="w-full justify-start">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Event
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}
