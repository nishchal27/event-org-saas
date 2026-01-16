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
import { cn } from '@/lib/utils'

export function QRScannerClient({ eventId }: { eventId: string }) {
  const router = useRouter()
  const { toast } = useToast()
  const utils = trpc.useUtils()
  const { data: event, isLoading } = trpc.event.getById.useQuery({ id: eventId })
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(null)
  const [isCheckingPermission, setIsCheckingPermission] = useState(true)
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

  // Check camera permission without requesting stream
  useEffect(() => {
    const checkCameraPermission = async () => {
      setIsCheckingPermission(true)
      
      // First, try to check permission status without requesting
      if (navigator.permissions && navigator.permissions.query) {
        try {
          // Type assertion for PermissionName - some browsers may not have this type
          const permissionStatus = await navigator.permissions.query({ 
            name: 'camera' as PermissionName 
          } as PermissionDescriptor)
          setCameraPermission(permissionStatus.state === 'granted')
          setIsCheckingPermission(false)
          
          // Listen for permission changes
          permissionStatus.onchange = () => {
            setCameraPermission(permissionStatus.state === 'granted')
          }
          
          // If already granted, we're done
          if (permissionStatus.state === 'granted') {
            return
          }
        } catch (err) {
          // Permissions API might not be supported or camera permission not queryable
          // Fall through to getUserMedia
          console.log('Permissions API not supported or camera not queryable, using getUserMedia')
        }
      }
      
      // If permission status is unknown or not granted, try to request access
      // This will prompt the user if needed
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true })
        // Immediately stop the stream - we just wanted to check permission
        stream.getTracks().forEach(track => track.stop())
        setCameraPermission(true)
      } catch (err: any) {
        console.error('Camera permission error:', err)
        setCameraPermission(false)
        
        // Provide helpful error messages
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          toast({
            title: 'Camera Permission Denied',
            description: 'Please enable camera access in your browser settings and reload the page.',
            variant: 'destructive',
          })
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          toast({
            title: 'No Camera Found',
            description: 'Please connect a camera device to use QR scanning.',
            variant: 'destructive',
          })
        } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
          toast({
            title: 'Camera In Use',
            description: 'Camera is being used by another application. Please close other apps using the camera.',
            variant: 'destructive',
          })
        }
      } finally {
        setIsCheckingPermission(false)
      }
    }
    
    checkCameraPermission()
  }, [toast])

  const startScanning = async () => {
    // Stop any existing scanner first
    if (scannerRef.current) {
      try {
        await stopScanning()
      } catch (err) {
        console.error('Error stopping existing scanner:', err)
      }
    }

    // Re-check permission before starting
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      // Stop the test stream immediately
      stream.getTracks().forEach(track => track.stop())
      setCameraPermission(true)
    } catch (err: any) {
      console.error('Camera permission check failed:', err)
      setCameraPermission(false)
      toast({
        title: 'Camera Permission Required',
        description: err.name === 'NotAllowedError' 
          ? 'Please allow camera access in your browser settings and reload the page.'
          : 'Please enable camera access to scan QR codes.',
        variant: 'destructive',
      })
      return
    }

    try {
      // Clear any existing scanner instance
      if (scannerRef.current) {
        try {
          await scannerRef.current.clear()
        } catch (err) {
          // Ignore clear errors
        }
      }

      const html5QrCode = new Html5Qrcode('qr-reader')
      scannerRef.current = html5QrCode

      // Try to get available cameras for better device selection
      let cameraId: string | { facingMode: string } = { facingMode: 'environment' }
      
      try {
        const devices = await Html5Qrcode.getCameras()
        if (devices && devices.length > 0) {
          // Prefer back camera on mobile
          const backCamera = devices.find(device => 
            device.label.toLowerCase().includes('back') || 
            device.label.toLowerCase().includes('rear') ||
            device.label.toLowerCase().includes('environment')
          )
          if (backCamera) {
            cameraId = backCamera.id
          } else {
            // Use last camera (usually back camera on mobile)
            cameraId = devices[devices.length - 1].id
          }
        }
      } catch (err) {
        console.log('Could not enumerate cameras, using default:', err)
        // Fall back to facingMode
        cameraId = { facingMode: 'environment' }
      }

      await html5QrCode.start(
        cameraId,
        {
          fps: 10,
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            // Make QR box responsive
            const minEdgePercentage = 0.7
            const minEdgeSize = Math.min(viewfinderWidth, viewfinderHeight)
            const qrboxSize = Math.floor(minEdgeSize * minEdgePercentage)
            return {
              width: qrboxSize,
              height: qrboxSize
            }
          },
          aspectRatio: 1.0,
          disableFlip: false,
        },
        (decodedText) => {
          // Success callback
          handleQRScan(decodedText)
        },
        (errorMessage) => {
          // Error callback - ignore scanning errors, just keep scanning
          // Only log if it's not a common "not found" error
          if (!errorMessage.includes('No QR code found')) {
            // Silently continue scanning
          }
        }
      )

      setIsScanning(true)
    } catch (err: any) {
      console.error('Error starting scanner:', err)
      
      // Clean up on error
      if (scannerRef.current) {
        try {
          await scannerRef.current.clear()
        } catch (clearErr) {
          // Ignore
        }
        scannerRef.current = null
      }
      
      setIsScanning(false)
      
      let errorMessage = 'Failed to start camera. Please check permissions and try again.'
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMessage = 'Camera permission denied. Please allow camera access in your browser settings and reload the page.'
        setCameraPermission(false)
      } else if (err.name === 'NotFoundError') {
        errorMessage = 'No camera found. Please connect a camera device.'
      } else if (err.name === 'NotReadableError') {
        errorMessage = 'Camera is being used by another application. Please close other apps using the camera.'
      } else if (err.message) {
        errorMessage = err.message
      }
      
      toast({
        title: 'Error Starting Scanner',
        description: errorMessage,
        variant: 'destructive',
      })
    }
  }

  const stopScanning = async () => {
    if (scannerRef.current) {
      try {
        // Stop the scanner
        await scannerRef.current.stop()
        // Clear the scanner
        await scannerRef.current.clear()
      } catch (err) {
        console.error('Error stopping scanner:', err)
        // Try to clear even if stop failed
        try {
          await scannerRef.current.clear()
        } catch (clearErr) {
          console.error('Error clearing scanner:', clearErr)
        }
      }
      scannerRef.current = null
    }
    
    // Stop any media streams
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop()
      })
      streamRef.current = null
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Cleanup scanner
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {
          // Ignore errors during cleanup
        })
        scannerRef.current.clear().catch(() => {
          // Ignore errors during cleanup
        })
        scannerRef.current = null
      }
      
      // Cleanup media streams
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          track.stop()
        })
        streamRef.current = null
      }
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
                {isCheckingPermission ? (
                  <div className="p-8 text-center space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <div>
                      <h3 className="font-semibold">Checking Camera Permission</h3>
                      <p className="text-sm text-muted-foreground mt-2">
                        Please wait...
                      </p>
                    </div>
                  </div>
                ) : cameraPermission === false ? (
                  <div className="p-8 text-center space-y-4">
                    <AlertCircle className="mx-auto h-12 w-12 text-yellow-500" />
                    <div>
                      <h3 className="font-semibold">Camera Permission Required</h3>
                      <p className="text-sm text-muted-foreground mt-2">
                        Please allow camera access in your browser settings to scan QR codes
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        After granting permission, click the button below to reload the page.
                      </p>
                    </div>
                    <Button onClick={async () => {
                      // Try to request permission again
                      try {
                        const stream = await navigator.mediaDevices.getUserMedia({ video: true })
                        stream.getTracks().forEach(track => track.stop())
                        setCameraPermission(true)
                        toast({
                          title: 'Permission Granted',
                          description: 'Camera access has been granted. You can now start scanning.',
                        })
                      } catch (err) {
                        // If still denied, reload the page
                        window.location.reload()
                      }
                    }}>
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
