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
import { logger } from '@/lib/logger'
import { trackEvent } from '@/lib/analytics'

export function QRScannerClient({ eventId }: { eventId: string }) {
  const router = useRouter()
  const { toast } = useToast()
  const utils = trpc.useUtils()
  const { data: event, isLoading } = trpc.event.getById.useQuery({ id: eventId })
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const isMountedRef = useRef(true)
  const [isScanning, setIsScanning] = useState(false)
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(null)
  const [isCheckingPermission, setIsCheckingPermission] = useState(true)
  const [isInitializing, setIsInitializing] = useState(false) // Camera initialization state
  const [isDetecting, setIsDetecting] = useState(false) // QR detection in progress
  const [lastScanned, setLastScanned] = useState<string | null>(null)
  const [scanHistory, setScanHistory] = useState<Array<{ qrCode: string; timestamp: Date; success: boolean }>>([])
  const [successData, setSuccessData] = useState<{ name: string; timestamp: Date } | null>(null) // Success modal data
  const failedQRCodesRef = useRef<Set<string>>(new Set()) // Track failed QR codes to avoid retrying
  const isProcessingRef = useRef(false) // Prevent multiple simultaneous processing

  // Haptic feedback helper
  const triggerHaptic = (type: 'success' | 'error' | 'light' = 'light') => {
    if ('vibrate' in navigator) {
      try {
        if (type === 'success') {
          // Success pattern: short-long-short
          navigator.vibrate([50, 30, 100, 30, 50])
        } else if (type === 'error') {
          // Error pattern: three short pulses
          navigator.vibrate([50, 30, 50, 30, 50])
        } else {
          // Light feedback: single short pulse
          navigator.vibrate(50)
        }
      } catch (err) {
        // Ignore vibration errors
      }
    }
  }

  const checkInMutation = trpc.attendee.checkInByAttendeeQR.useMutation({
    onSuccess: (data) => {
      setIsDetecting(false)
      setLastScanned(data.attendeeQrCode || 'success')
      setSuccessData({ name: data.name, timestamp: new Date() })
      setScanHistory((prev) => [
        { qrCode: data.attendeeQrCode || 'success', timestamp: new Date(), success: true },
        ...prev.slice(0, 4),
      ])
      
      // Trigger haptic feedback
      triggerHaptic('success')
      
      // Track successful check-in
      trackEvent('qr_scan_success', {
        eventId,
        attendeeId: data.id,
      }, undefined, event?.organizationId)
      
      logger.checkIn.info('QR scan check-in successful', {
        eventId,
        attendeeId: data.id,
        attendeeQrCode: data.attendeeQrCode,
      })
      
      utils.event.getById.invalidate({ id: eventId })
      
      // Hide success modal after 3 seconds
      setTimeout(() => {
        setSuccessData(null)
        setLastScanned(null)
      }, 3000)
    },
    onError: (error) => {
      setIsDetecting(false)
      setLastScanned('error')
      setScanHistory((prev) => [
        { qrCode: 'error', timestamp: new Date(), success: false },
        ...prev.slice(0, 4),
      ])
      
      // Trigger haptic feedback for error
      triggerHaptic('error')
      
      // Track error
      const errorObj = error instanceof Error ? error : new Error(error.message)
      logger.checkIn.error('QR scan check-in failed', errorObj, {
        eventId,
        errorMessage: error.message,
      })
      
      trackEvent('check_in_error', {
        eventId,
        errorType: 'qr_scan',
        errorMessage: error.message,
      }, undefined, event?.organizationId)
      
      // Show user-friendly error messages
      let errorMessage = error.message
      if (error.message === 'Invalid QR code') {
        errorMessage = 'This QR code is not valid for this event. Please scan a valid attendee QR code.'
      } else if (error.message === 'Already checked in') {
        errorMessage = 'This attendee has already been checked in.'
      } else if (error.message.includes('UNAUTHORIZED')) {
        errorMessage = 'You do not have permission to check in attendees for this event.'
      }
      
      toast({
        title: 'Unable to Check In',
        description: errorMessage,
        variant: 'destructive',
        duration: 3000, // Show longer for errors
      })
      setTimeout(() => setLastScanned(null), 3000)
    },
  })

  // Check camera permission without requesting stream
  useEffect(() => {
    const checkCameraPermission = async () => {
      setIsCheckingPermission(true)
      
      logger.qrScan.info('Checking camera permission', { eventId })
      
      // First, try to check permission status without requesting
      if (navigator.permissions && navigator.permissions.query) {
        try {
          // Type assertion for PermissionName - some browsers may not have this type
          const permissionStatus = await navigator.permissions.query({ 
            name: 'camera' as PermissionName 
          } as PermissionDescriptor)
          const isGranted = permissionStatus.state === 'granted'
          setCameraPermission(isGranted)
          setIsCheckingPermission(false)
          
          logger.qrScan.info('Camera permission status checked', {
            eventId,
            permissionState: permissionStatus.state,
            granted: isGranted,
          })
          
          trackEvent('qr_scan_permission_checked', {
            eventId,
            permissionState: permissionStatus.state,
            granted: isGranted,
          }, undefined, event?.organizationId)
          
          // Listen for permission changes
          permissionStatus.onchange = () => {
            const newState = permissionStatus.state === 'granted'
            setCameraPermission(newState)
            logger.qrScan.info('Camera permission changed', {
              eventId,
              newState: permissionStatus.state,
              granted: newState,
            })
          }
          
          // If already granted, we're done
          if (isGranted) {
            return
          }
        } catch (err) {
          // Permissions API might not be supported or camera permission not queryable
          // Fall through to getUserMedia
          logger.qrScan.info('Permissions API not supported, using getUserMedia', {
            eventId,
            error: err instanceof Error ? err.message : String(err),
          })
        }
      }
      
      // If permission status is unknown or not granted, try to request access
      // This will prompt the user if needed
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true })
        // Immediately stop the stream - we just wanted to check permission
        stream.getTracks().forEach(track => track.stop())
        setCameraPermission(true)
        
        logger.qrScan.info('Camera permission granted via getUserMedia', { eventId })
        trackEvent('qr_scan_permission_granted', { eventId }, undefined, event?.organizationId)
      } catch (err: any) {
        console.error('Camera permission error:', err)
        setCameraPermission(false)
        
        const errorName = err?.name || err?.constructor?.name || 'UnknownError'
        const errorMsg = err?.message || String(err) || 'Unknown error'
        
        logger.qrScan.error('Camera permission denied', err instanceof Error ? err : new Error(errorMsg), {
          eventId,
          errorType: errorName,
          errorMessage: errorMsg,
        })
        
        trackEvent('qr_scan_permission_denied', {
          eventId,
          errorType: errorName,
          errorMessage: errorMsg,
        }, undefined, event?.organizationId)
        
        // Provide helpful error messages
        if (errorName === 'NotAllowedError' || errorName === 'PermissionDeniedError') {
          toast({
            title: 'Camera Permission Denied',
            description: 'Please enable camera access in your browser settings and reload the page.',
            variant: 'destructive',
          })
        } else if (errorName === 'NotFoundError' || errorName === 'DevicesNotFoundError') {
          toast({
            title: 'No Camera Found',
            description: 'Please connect a camera device to use QR scanning.',
            variant: 'destructive',
          })
        } else if (errorName === 'NotReadableError' || errorName === 'TrackStartError') {
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
  }, [toast, eventId, event?.organizationId])

  const startScanning = async () => {
    // Stop any existing scanner first
    if (scannerRef.current) {
      try {
        await stopScanning()
      } catch (err) {
        console.error('Error stopping existing scanner:', err)
      }
    }

    logger.qrScan.info('Starting QR scanner', { eventId })

    // Ensure DOM element exists before proceeding
    const qrReaderElement = document.getElementById('qr-reader')
    if (!qrReaderElement) {
      const error = new Error('QR scanner element not found in DOM')
      logger.qrScan.error('Failed to start QR scanner - element missing', error, {
        eventId,
        errorType: 'DOMError',
        errorMessage: 'QR scanner element not found',
      })
      trackEvent('qr_scan_error', {
        eventId,
        errorType: 'DOMError',
        errorMessage: 'QR scanner element not found',
      }, undefined, event?.organizationId)
      toast({
        title: 'Error Starting Scanner',
        description: 'Scanner element not found. Please refresh the page and try again.',
        variant: 'destructive',
      })
      return
    }

    // Re-check permission before starting
    try {
      logger.qrScan.info('Re-checking camera permission before starting', { eventId })
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      // Stop the test stream immediately
      stream.getTracks().forEach(track => track.stop())
      setCameraPermission(true)
      logger.qrScan.info('Camera permission confirmed', { eventId })
    } catch (err: any) {
      console.error('Camera permission check failed:', err)
      setCameraPermission(false)
      const errorName = err?.name || err?.constructor?.name || 'UnknownError'
      const errorMsg = err?.message || String(err) || 'Unknown error'
      
      logger.qrScan.error('Camera permission check failed', err instanceof Error ? err : new Error(errorMsg), {
        eventId,
        errorType: errorName,
        errorMessage: errorMsg,
      })
      
      trackEvent('qr_scan_permission_denied', {
        eventId,
        errorType: errorName,
        errorMessage: errorMsg,
      }, undefined, event?.organizationId)
      
      toast({
        title: 'Camera Permission Required',
        description: errorName === 'NotAllowedError' || errorName === 'PermissionDeniedError'
          ? 'Please allow camera access in your browser settings and reload the page.'
          : 'Please enable camera access to scan QR codes.',
        variant: 'destructive',
      })
      return
    }

    try {
      setIsInitializing(true)
      
      // Clear any existing scanner instance
      if (scannerRef.current) {
        try {
          await scannerRef.current.clear()
          logger.qrScan.info('Cleared existing scanner instance', { eventId })
        } catch (err) {
          // Ignore clear errors
          logger.qrScan.info('Error clearing existing scanner (ignored)', {
            eventId,
            error: err instanceof Error ? err.message : String(err),
          })
        }
      }

      // Ensure element is visible and has dimensions before initializing
      const element = document.getElementById('qr-reader')
      if (!element) {
        throw new Error('QR scanner element not found')
      }

      // Wait a brief moment to ensure element is fully rendered
      await new Promise(resolve => setTimeout(resolve, 100))

      // Check if element has dimensions
      const rect = element.getBoundingClientRect()
      logger.qrScan.info('QR scanner element dimensions', {
        eventId,
        width: rect.width,
        height: rect.height,
      })
      
      if (rect.width === 0 || rect.height === 0) {
        throw new Error('QR scanner element has no dimensions. Please ensure it is visible.')
      }

      // Clear any React children before html5-qrcode takes over to prevent DOM conflicts
      // This must happen synchronously before creating the scanner instance
      const qrElement = document.getElementById('qr-reader')
      if (qrElement) {
        // Use innerHTML to completely clear React-managed children
        // This prevents React from trying to reconcile nodes that html5-qrcode will create
        qrElement.innerHTML = ''
      }

      const html5QrCode = new Html5Qrcode('qr-reader')
      scannerRef.current = html5QrCode

      // Try to get available cameras for better device selection
      let camerasToTry: Array<{ id: string; label: string }> = []
      let cameraId: string | { facingMode: string } = { facingMode: 'environment' }
      
      try {
        const devices = await Html5Qrcode.getCameras()
        logger.qrScan.info('Enumerated cameras', {
          eventId,
          cameraCount: devices?.length || 0,
          cameras: devices?.map(d => ({ id: d.id, label: d.label })) || [],
        })
        
        if (devices && devices.length > 0) {
          // Filter out virtual cameras (OBS, ManyCam, etc.) and prioritize real cameras
          const virtualCameraKeywords = ['obs', 'virtual', 'manycam', 'snap camera', 'camo', 'droidcam']
          const realCameras = devices.filter(device => 
            !virtualCameraKeywords.some(keyword => device.label.toLowerCase().includes(keyword))
          )
          const virtualCameras = devices.filter(device => 
            virtualCameraKeywords.some(keyword => device.label.toLowerCase().includes(keyword))
          )
          
          logger.qrScan.info('Filtered cameras', {
            eventId,
            realCameraCount: realCameras.length,
            virtualCameraCount: virtualCameras.length,
            realCameras: realCameras.map(d => ({ id: d.id, label: d.label })),
            virtualCameras: virtualCameras.map(d => ({ id: d.id, label: d.label })),
          })
          
          // Build list of cameras to try, prioritizing real cameras
          if (realCameras.length > 0) {
            // Prefer back camera on mobile (real cameras first)
            const backCamera = realCameras.find(device => 
              device.label.toLowerCase().includes('back') || 
              device.label.toLowerCase().includes('rear') ||
              device.label.toLowerCase().includes('environment')
            )
            
            if (backCamera) {
              camerasToTry.push({ id: backCamera.id, label: backCamera.label })
              // Add other real cameras as fallbacks
              realCameras.forEach(cam => {
                if (cam.id !== backCamera.id) {
                  camerasToTry.push({ id: cam.id, label: cam.label })
                }
              })
            } else {
              // Add all real cameras
              realCameras.forEach(cam => {
                camerasToTry.push({ id: cam.id, label: cam.label })
              })
            }
          }
          
          // Add virtual cameras as last resort fallbacks
          virtualCameras.forEach(cam => {
            camerasToTry.push({ id: cam.id, label: cam.label })
          })
          
          // If we have cameras to try, use the first one
          if (camerasToTry.length > 0) {
            cameraId = camerasToTry[0].id
            logger.qrScan.info('Selected camera', {
              eventId,
              cameraId: camerasToTry[0].id,
              cameraLabel: camerasToTry[0].label,
              totalCamerasToTry: camerasToTry.length,
            })
          } else {
            // Fallback: use last camera from original list
            cameraId = devices[devices.length - 1].id
            camerasToTry.push({ id: cameraId as string, label: devices[devices.length - 1].label })
            logger.qrScan.info('Selected last camera (no real cameras found)', {
              eventId,
              cameraId: devices[devices.length - 1].id,
              cameraLabel: devices[devices.length - 1].label,
            })
          }
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err)
        logger.qrScan.info('Could not enumerate cameras, using default', {
          eventId,
          error: errorMsg,
        })
        // Fall back to facingMode
        cameraId = { facingMode: 'environment' }
      }

      // Try to start with the selected camera, with fallback to other cameras
      let started = false
      let lastError: any = null
      
      // If we have multiple cameras to try, attempt each one
      // If cameraId is a facingMode object, we'll try it directly
      const camerasToAttempt = camerasToTry.length > 0 
        ? camerasToTry 
        : (typeof cameraId === 'string' 
          ? [{ id: cameraId, label: 'Unknown' }]
          : []) // Empty array means we'll use facingMode directly
      
      // If we have cameras to attempt, try each one
      if (camerasToAttempt.length > 0) {
        for (let i = 0; i < camerasToAttempt.length; i++) {
          const currentCamera = camerasToAttempt[i]
          const currentCameraId = currentCamera.id
          
          try {
            logger.qrScan.info(`Attempting to start with camera ${i + 1}/${camerasToAttempt.length}`, {
              eventId,
              cameraId: currentCameraId,
              cameraLabel: currentCamera.label,
              attempt: i + 1,
              totalAttempts: camerasToAttempt.length,
            })
            
            await html5QrCode.start(
              currentCameraId,
            {
              fps: 20, // Increased FPS for better performance
              qrbox: (viewfinderWidth, viewfinderHeight) => {
                // Make QR box responsive with minimum 50px size (html5-qrcode requirement)
                // Use larger box (0.85) for better mobile screen detection
                const minEdgePercentage = 0.85
                const minEdgeSize = Math.min(viewfinderWidth, viewfinderHeight)
                const qrboxSize = Math.max(50, Math.floor(minEdgeSize * minEdgePercentage))
                return {
                  width: qrboxSize,
                  height: qrboxSize
                }
              },
              aspectRatio: 1.0,
              disableFlip: false,
              videoConstraints: {
                facingMode: 'environment',
                width: { ideal: 1280 },
                height: { ideal: 720 },
              },
            },
            (decodedText) => {
              // Success callback - trigger light haptic on detection
              triggerHaptic('light')
              handleQRScan(decodedText)
            },
            (errorMessage) => {
              // Error callback - log scanning errors (but continue scanning)
              // Only log if it's not a common "not found" error
              if (!errorMessage.includes('No QR code found') && !errorMessage.includes('NotFoundException')) {
                logger.qrScan.info('QR scanning error (continuing)', {
                  eventId,
                  errorMessage,
                })
              }
            }
          )
          
            // Success! Update cameraId for logging
            cameraId = currentCameraId
            started = true
            logger.qrScan.info('Successfully started with camera', {
              eventId,
              cameraId: currentCameraId,
              cameraLabel: currentCamera.label,
              attempt: i + 1,
            })
            break
          } catch (err: any) {
            lastError = err
            logger.qrScan.info(`Failed to start with camera ${i + 1}`, {
              eventId,
              cameraId: currentCameraId,
              cameraLabel: currentCamera.label,
              attempt: i + 1,
              error: err instanceof Error ? err.message : String(err),
              errorName: err?.name || 'Unknown',
            })
            
            // If this isn't the last camera, try the next one
            if (i < camerasToAttempt.length - 1) {
              logger.qrScan.info('Trying next camera as fallback', {
                eventId,
                nextCamera: camerasToAttempt[i + 1].label,
              })
              // Clear the scanner before trying next camera
              try {
                await html5QrCode.clear()
              } catch (clearErr) {
                // Ignore clear errors
              }
              continue
            }
          }
        }
      } else {
        // No cameras enumerated, try with facingMode
        try {
          logger.qrScan.info('Attempting to start with facingMode (no cameras enumerated)', {
            eventId,
            facingMode: typeof cameraId === 'object' ? cameraId.facingMode : 'unknown',
          })
          
          await html5QrCode.start(
            cameraId,
            {
              fps: 20, // Increased FPS for better performance
              qrbox: (viewfinderWidth, viewfinderHeight) => {
                // Make QR box responsive with minimum 50px size (html5-qrcode requirement)
                // Use larger box (0.85) for better mobile screen detection
                const minEdgePercentage = 0.85
                const minEdgeSize = Math.min(viewfinderWidth, viewfinderHeight)
                const qrboxSize = Math.max(50, Math.floor(minEdgeSize * minEdgePercentage))
                return {
                  width: qrboxSize,
                  height: qrboxSize
                }
              },
              aspectRatio: 1.0,
              disableFlip: false,
              videoConstraints: {
                facingMode: 'environment',
                width: { ideal: 1280 },
                height: { ideal: 720 },
              },
            },
            (decodedText) => {
              // Success callback - trigger light haptic on detection
              triggerHaptic('light')
              handleQRScan(decodedText)
            },
            (errorMessage) => {
              // Error callback - log scanning errors (but continue scanning)
              // Only log if it's not a common "not found" error
              if (!errorMessage.includes('No QR code found') && !errorMessage.includes('NotFoundException')) {
                logger.qrScan.info('QR scanning error (continuing)', {
                  eventId,
                  errorMessage,
                })
              }
            }
          )
          
          started = true
          logger.qrScan.info('Successfully started with facingMode', {
            eventId,
            facingMode: typeof cameraId === 'object' ? cameraId.facingMode : 'unknown',
          })
        } catch (err: any) {
          lastError = err
          logger.qrScan.error('Failed to start with facingMode', err instanceof Error ? err : new Error(String(err)), {
            eventId,
            error: err instanceof Error ? err.message : String(err),
            errorName: err?.name || 'Unknown',
          })
        }
      }
      
      // If we couldn't start with any camera, throw the last error
      if (!started) {
        throw lastError || new Error('Failed to start scanner with any available camera')
      }

      // Clear processing state and failed QR codes when starting fresh
      isProcessingRef.current = false
      failedQRCodesRef.current.clear()
      
      setIsInitializing(false)
      setIsScanning(true)
      
      // Track successful scan start
      logger.qrScan.info('QR scanner started successfully', {
        eventId,
        cameraId: typeof cameraId === 'string' ? cameraId : cameraId.facingMode,
      })
      
      trackEvent('qr_scan_started', {
        eventId,
        cameraId: typeof cameraId === 'string' ? cameraId : cameraId.facingMode,
      }, undefined, event?.organizationId)
    } catch (err: any) {
      // Properly extract error information from different error types
      const errorName = err?.name || err?.constructor?.name || (err instanceof Error ? err.name : 'UnknownError')
      const errorMessage = err?.message || String(err) || 'Unknown error occurred'
      const error = err instanceof Error ? err : new Error(errorMessage)
      
      // Log error with proper error information
      logger.qrScan.error('Failed to start QR scanner', error, {
        eventId,
        errorType: errorName,
        errorMessage: errorMessage,
      })
      
      // Track error
      trackEvent('qr_scan_error', {
        eventId,
        errorType: errorName,
        errorMessage: errorMessage,
      }, undefined, event?.organizationId)
      
      // Clean up on error
      if (scannerRef.current) {
        try {
          await scannerRef.current.clear()
        } catch (clearErr) {
          // Ignore
        }
        scannerRef.current = null
      }
      
      setIsInitializing(false)
      setIsScanning(false)
      
      // Determine user-friendly error message
      let userErrorMessage = 'Failed to start camera. Please check permissions and try again.'
      if (errorName === 'NotAllowedError' || errorName === 'PermissionDeniedError') {
        userErrorMessage = 'Camera permission denied. Please allow camera access in your browser settings and reload the page.'
        setCameraPermission(false)
        trackEvent('qr_scan_permission_denied', { eventId }, undefined, event?.organizationId)
      } else if (errorName === 'NotFoundError' || errorName === 'DevicesNotFoundError') {
        userErrorMessage = 'No camera found. Please connect a camera device.'
      } else if (errorName === 'NotReadableError' || errorName === 'TrackStartError') {
        userErrorMessage = 'Camera is being used by another application. Please close other apps using the camera.'
      } else if (errorName === 'OverconstrainedError' || errorName === 'ConstraintNotSatisfiedError') {
        userErrorMessage = 'Camera constraints not supported. Please try a different camera or browser.'
      } else if (errorMessage && errorMessage !== 'Unknown error occurred') {
        // Use the actual error message if available and meaningful
        userErrorMessage = errorMessage
      }
      
      toast({
        title: 'Error Starting Scanner',
        description: userErrorMessage,
        variant: 'destructive',
      })
    }
  }

  const stopScanning = async () => {
    logger.qrScan.info('Stopping QR scanner', { eventId })
    
    // Immediately update state to prevent new scans
    setIsScanning(false)
    isProcessingRef.current = false
    
    // Stop scanner with timeout to prevent hanging
    const stopPromise = (async () => {
      if (scannerRef.current) {
        try {
          // Try to resume first if paused (some versions require this before stop)
          try {
            const scanner = scannerRef.current as any
            if (scanner.getState && typeof scanner.getState === 'function') {
              const state = scanner.getState()
              if (state === 'PAUSED') {
                await scannerRef.current.resume()
                // Give it a moment to resume
                await new Promise(resolve => setTimeout(resolve, 100))
              }
            }
          } catch {
            // Ignore resume errors - might not be paused or method not available
          }
          
          // Stop the scanner
          await scannerRef.current.stop()
          logger.qrScan.info('QR scanner stopped', { eventId })
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : String(err)
          logger.qrScan.info('Error stopping scanner (continuing cleanup)', {
            eventId,
            errorMessage: errorMsg,
          })
        }
        
        // Clear the scanner DOM - let html5-qrcode handle it completely
        try {
          // Just call clear() - html5-qrcode will handle DOM cleanup
          await scannerRef.current.clear()
          logger.qrScan.info('QR scanner cleared successfully', { eventId })
        } catch (clearErr) {
          const clearErrorMsg = clearErr instanceof Error ? clearErr.message : String(clearErr)
          logger.qrScan.info('Error clearing scanner (non-critical)', {
            eventId,
            errorMessage: clearErrorMsg,
          })
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
    })()
    
    // Add timeout to force completion
    try {
      await Promise.race([
        stopPromise,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Stop timeout')), 3000)
        )
      ])
    } catch (err) {
      logger.qrScan.info('Stop scanner timeout or error, forcing cleanup', {
        eventId,
        error: err instanceof Error ? err.message : String(err),
      })
      // Force cleanup even on timeout
      if (scannerRef.current) {
        scannerRef.current = null
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
        streamRef.current = null
      }
    }
    
    trackEvent('qr_scan_stopped', { eventId }, undefined, event?.organizationId)
  }

  const handleQRScan = (qrCode: string) => {
    // Show detecting state
    setIsDetecting(true)
    
    // Extract attendee QR code from URL if it's a check-in URL
    // QR codes from the public page are URLs like: https://event-org-sa.../checkin/att-xxx-xxx
    let attendeeQrCode = qrCode.trim()
    
    try {
      // If it's a URL, extract the code from the path
      if (attendeeQrCode.startsWith('http://') || attendeeQrCode.startsWith('https://')) {
        const url = new URL(attendeeQrCode)
        const pathParts = url.pathname.split('/').filter(Boolean)
        
        // Check if it's a checkin URL: /checkin/{code}
        if (pathParts.length >= 2 && pathParts[0] === 'checkin') {
          attendeeQrCode = pathParts[1]
          logger.qrScan.info('Extracted attendee QR code from URL', {
            eventId,
            originalUrl: qrCode.substring(0, 50) + '...',
            extractedCode: attendeeQrCode.substring(0, 20) + '...',
          })
        } else if (pathParts.length === 1 && pathParts[0].startsWith('att-')) {
          // Sometimes the URL might be just /att-xxx-xxx
          attendeeQrCode = pathParts[0]
          logger.qrScan.info('Extracted attendee QR code from URL path', {
            eventId,
            extractedCode: attendeeQrCode.substring(0, 20) + '...',
          })
        }
      } else if (attendeeQrCode.includes('/checkin/')) {
        // Handle relative URLs like /checkin/att-xxx-xxx
        const match = attendeeQrCode.match(/\/checkin\/([^\/\s]+)/)
        if (match && match[1]) {
          attendeeQrCode = match[1]
          logger.qrScan.info('Extracted attendee QR code from relative URL', {
            eventId,
            extractedCode: attendeeQrCode.substring(0, 20) + '...',
          })
        }
      }
    } catch (err) {
      // If URL parsing fails, use the original code
      logger.qrScan.info('Could not parse QR code as URL, using as-is', {
        eventId,
        error: err instanceof Error ? err.message : String(err),
      })
    }

    // Validate that we have a valid attendee QR code format (starts with 'att-')
    if (!attendeeQrCode.startsWith('att-')) {
      logger.qrScan.error('Invalid QR code format - does not start with att-', new Error('Invalid QR code format'), {
        eventId,
        qrCode: attendeeQrCode.substring(0, 50) + '...',
      })
      
      // Clear processing flag
      isProcessingRef.current = false
      
      // Show error
      toast({
        title: 'Invalid QR Code',
        description: 'This QR code is not a valid attendee QR code. Please scan an attendee QR code from the event.',
        variant: 'destructive',
        duration: 4000,
      })
      
      // Resume scanning after error
      setTimeout(() => {
        if (!isMountedRef.current || !isScanning) return
        if (scannerRef.current) {
          try {
            scannerRef.current.resume()
          } catch {
            if (isMountedRef.current && isScanning) {
              startScanning()
            }
          }
        }
      }, 2000)
      
      return
    }

    // Use the original qrCode for tracking failed codes (to handle URL variations)
    const originalQrCode = qrCode.trim()

    // Prevent processing if already processing another QR code
    if (isProcessingRef.current) {
      logger.qrScan.info('Already processing a QR code, ignoring new scan', {
        eventId,
        qrCode: attendeeQrCode.substring(0, 20) + '...',
      })
      return
    }

    // Check if this QR code recently failed (within last 10 seconds) - check both original and extracted
    if (failedQRCodesRef.current.has(originalQrCode) || failedQRCodesRef.current.has(attendeeQrCode)) {
      logger.qrScan.info('QR code recently failed, ignoring to prevent spam', {
        eventId,
        qrCode: attendeeQrCode.substring(0, 20) + '...',
      })
      return
    }

    // Prevent duplicate scans within 2 seconds
    if (scanHistory.some((s) => (s.qrCode === originalQrCode || s.qrCode === attendeeQrCode) && Date.now() - s.timestamp.getTime() < 2000)) {
      logger.qrScan.info('Duplicate QR scan detected, ignoring', {
        eventId,
        qrCode: attendeeQrCode.substring(0, 20) + '...', // Log partial QR code for privacy
      })
      return
    }

    // Set processing flag
    isProcessingRef.current = true

    // Log QR code detection
    logger.qrScan.info('QR code detected', {
      eventId,
      qrCodeLength: attendeeQrCode.length,
      qrCodePrefix: attendeeQrCode.substring(0, 20) + '...', // Log partial QR code for privacy
      isFromUrl: originalQrCode !== attendeeQrCode,
    })
    
    trackEvent('qr_scan_detected', {
      eventId,
      qrCodeLength: attendeeQrCode.length,
    }, undefined, event?.organizationId)

    // Pause scanning temporarily to show feedback
    if (scannerRef.current && isScanning) {
      try {
        scannerRef.current.pause()
      } catch (err) {
        // Ignore pause errors - pause might not be available in all versions
        logger.qrScan.info('Could not pause scanner (may not be supported)', {
          eventId,
          error: err instanceof Error ? err.message : String(err),
        })
      }
    }

    logger.qrScan.info('Processing QR code check-in', {
      eventId,
      qrCodeLength: attendeeQrCode.length,
      attendeeQrCode: attendeeQrCode.substring(0, 20) + '...',
    })

    checkInMutation.mutate(
      { attendeeQrCode: attendeeQrCode },
      {
        onSuccess: () => {
          // Remove from failed list if it was there (check both original and extracted)
          failedQRCodesRef.current.delete(originalQrCode)
          failedQRCodesRef.current.delete(attendeeQrCode)
          
          // Clear processing flag
          isProcessingRef.current = false
          
          logger.qrScan.info('QR code check-in mutation successful, resuming scanner', { eventId })
          
          // Resume scanning after successful check-in
          setTimeout(() => {
            if (!isMountedRef.current || !isScanning) return
            if (scannerRef.current) {
              try {
                scannerRef.current.resume()
                logger.qrScan.info('Scanner resumed after successful check-in', { eventId })
              } catch {
                // If resume fails, restart scanner
                if (isMountedRef.current && isScanning) {
                  logger.qrScan.info('Resume failed, restarting scanner', { eventId })
                  startScanning()
                }
              }
            }
          }, 2000)
        },
        onError: (error) => {
          // Add to failed list for 10 seconds (add both original and extracted)
          failedQRCodesRef.current.add(originalQrCode)
          failedQRCodesRef.current.add(attendeeQrCode)
          setTimeout(() => {
            failedQRCodesRef.current.delete(originalQrCode)
            failedQRCodesRef.current.delete(attendeeQrCode)
          }, 10000)
          
          // Clear processing flag
          isProcessingRef.current = false
          
          logger.qrScan.info('QR code check-in mutation failed, resuming scanner', { 
            eventId,
            errorMessage: error.message,
          })
          
          // Resume scanning after error (with longer delay for invalid codes)
          setTimeout(() => {
            if (!isMountedRef.current || !isScanning) return
            if (scannerRef.current) {
              try {
                scannerRef.current.resume()
                logger.qrScan.info('Scanner resumed after check-in error', { eventId })
              } catch {
                if (isMountedRef.current && isScanning) {
                  logger.qrScan.info('Resume failed after error, restarting scanner', { eventId })
                  startScanning()
                }
              }
            }
          }, 3000) // Longer delay for errors to show feedback
        },
      }
    )
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Mark component as unmounted to prevent state updates
      isMountedRef.current = false
      
      // Cleanup scanner - use async cleanup but don't wait
      const cleanupScanner = async () => {
        if (scannerRef.current) {
          try {
            // Stop the scanner
            await scannerRef.current.stop()
          } catch (err) {
            // Ignore stop errors during cleanup
          }
          
          try {
            // Clear the scanner DOM - let html5-qrcode handle it
            await scannerRef.current.clear()
          } catch (err) {
            // Ignore clear errors during cleanup
          }
          
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
      
      // Run cleanup but don't block
      cleanupScanner().catch(() => {
        // Ignore any cleanup errors
      })
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card border-border sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href={`/events/${eventId}`}>
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-foreground">QR Scanner</h1>
                <p className="text-sm text-muted-foreground">{event.title}</p>
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
                      {/* Placeholder shown when not scanning - separate from qr-reader to avoid DOM conflicts */}
                      {!isScanning && !scannerRef.current && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black rounded-lg z-10">
                          <div className="text-center text-white p-8">
                            <Camera className="mx-auto h-16 w-16 mb-4 opacity-50" />
                            <p className="text-lg font-medium">Camera Ready</p>
                            <p className="text-sm opacity-75 mt-2">
                              Click "Start Scanning" to begin
                            </p>
                          </div>
                        </div>
                      )}
                      <div
                        id="qr-reader"
                        suppressHydrationWarning
                        className={cn(
                          'w-full rounded-lg overflow-hidden bg-black',
                          isScanning ? 'min-h-[400px]' : 'min-h-[300px]'
                        )}
                      />

                      {/* Initializing Overlay */}
                      <AnimatePresence>
                        {isInitializing && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/80 flex items-center justify-center rounded-lg z-20"
                          >
                            <div className="text-center text-white space-y-4">
                              <div className="animate-spin rounded-full h-16 w-16 border-4 border-white border-t-transparent mx-auto"></div>
                              <p className="text-lg font-semibold">Starting Camera...</p>
                              <p className="text-sm opacity-75">Please wait</p>
                            </div>
                          </motion.div>
                        )}
                        
                        {/* Detecting Overlay */}
                        {isDetecting && !successData && lastScanned !== 'error' && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-blue-500/80 flex items-center justify-center rounded-lg z-20"
                          >
                            <div className="text-center text-white space-y-4">
                              <div className="relative">
                                <div className="animate-ping absolute inset-0 rounded-full bg-white opacity-75"></div>
                                <ScanLine className="h-16 w-16 mx-auto relative" />
                              </div>
                              <p className="text-lg font-semibold">Scanning QR Code...</p>
                              <p className="text-sm opacity-75">Please hold steady</p>
                            </div>
                          </motion.div>
                        )}
                        
                        {/* Success Modal - Prominent and Centered */}
                        {successData && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                            onClick={() => {
                              setSuccessData(null)
                              setLastScanned(null)
                            }}
                          >
                            <motion.div
                              initial={{ y: 20 }}
                              animate={{ y: 0 }}
                              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 text-center space-y-6"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                                className="mx-auto w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center"
                              >
                                <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
                              </motion.div>
                              <div className="space-y-2">
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                                  Check-in Successful!
                                </h3>
                                <p className="text-lg text-gray-600 dark:text-gray-300 font-medium">
                                  {successData.name}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  {successData.timestamp.toLocaleTimeString()}
                                </p>
                              </div>
                              <div className="pt-4">
                                <Button
                                  onClick={() => {
                                    setSuccessData(null)
                                    setLastScanned(null)
                                  }}
                                  className="w-full"
                                  size="lg"
                                >
                                  Continue Scanning
                                </Button>
                              </div>
                            </motion.div>
                          </motion.div>
                        )}
                        
                        {/* Error Overlay */}
                        {lastScanned === 'error' && !successData && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="absolute inset-0 bg-red-500/90 flex items-center justify-center rounded-lg z-20"
                          >
                            <div className="text-center text-white space-y-4">
                              <XCircle className="mx-auto h-16 w-16" />
                              <p className="text-xl font-bold">Invalid QR Code</p>
                              <p className="text-sm opacity-90">Please try again</p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Control Buttons */}
                    <div className="flex gap-2 relative z-20">
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
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            
                            console.log('[QR Scanner] Stop button clicked', { isScanning, hasScanner: !!scannerRef.current })
                            logger.qrScan.info('Stop button clicked', { eventId, isScanning })
                            
                            // Immediately update UI
                            setIsScanning(false)
                            isProcessingRef.current = false
                            failedQRCodesRef.current.clear()
                            
                            // Stop scanning asynchronously (don't await to keep UI responsive)
                            stopScanning().catch((err) => {
                              logger.qrScan.error('Error stopping scanner from button', err instanceof Error ? err : new Error(String(err)), {
                                eventId,
                              })
                              // Force cleanup on error
                              if (scannerRef.current) {
                                try {
                                  scannerRef.current.stop().catch(() => {})
                                } catch {
                                  // Ignore
                                }
                                try {
                                  scannerRef.current.clear()
                                } catch {
                                  // Ignore
                                }
                                scannerRef.current = null
                              }
                              if (streamRef.current) {
                                streamRef.current.getTracks().forEach(track => track.stop())
                                streamRef.current = null
                              }
                            })
                          }}
                          variant="destructive"
                          className="flex-1"
                          size="lg"
                          type="button"
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
