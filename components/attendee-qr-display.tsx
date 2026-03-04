'use client'

import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { Button } from '@/components/ui/button'
import { Download, Share2, CheckCircle2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import Image from 'next/image'

interface AttendeeQRDisplayProps {
  attendeeQrCode: string
  attendeeName: string
  eventTitle: string
}

export function AttendeeQRDisplay({ attendeeQrCode, attendeeName, eventTitle }: AttendeeQRDisplayProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    if (attendeeQrCode) {
      // Generate the check-in URL
      const checkInUrl = `${window.location.origin}/checkin/${attendeeQrCode}`
      
      QRCode.toDataURL(checkInUrl, {
        width: 512,
        margin: 4,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
        errorCorrectionLevel: 'H', // Higher error correction for better scanning
      })
        .then((url) => {
          setQrDataUrl(url)
          setIsLoading(false)
        })
        .catch((err) => {
          console.error('Error generating QR code:', err)
          setIsLoading(false)
          toast({
            title: 'Error',
            description: 'Failed to generate QR code',
            variant: 'destructive',
          })
        })
    }
  }, [attendeeQrCode, toast])

  const handleDownload = () => {
    if (!qrDataUrl) return

    const link = document.createElement('a')
    link.href = qrDataUrl
    link.download = `qr-code-${attendeeName.replace(/[^a-z0-9]/gi, '_')}-${attendeeQrCode}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: 'Downloaded',
      description: 'QR code saved to your device',
    })
  }

  const handleShare = async () => {
    if (!qrDataUrl) return

    try {
      if (navigator.share && navigator.canShare) {
        const blob = await fetch(qrDataUrl).then((r) => r.blob())
        const file = new File([blob], `qr-code-${attendeeName}.png`, { type: 'image/png' })
        
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: `My QR Code for ${eventTitle}`,
            text: `Check-in QR code for ${eventTitle}`,
            files: [file],
          })
          toast({
            title: 'Shared!',
            description: 'QR code shared successfully',
          })
        } else {
          // Fallback to copy link
          const checkInUrl = `${window.location.origin}/checkin/${attendeeQrCode}`
          await navigator.clipboard.writeText(checkInUrl)
          toast({
            title: 'Link Copied!',
            description: 'Check-in link copied to clipboard',
          })
        }
      } else {
        // Fallback to copy link
        const checkInUrl = `${window.location.origin}/checkin/${attendeeQrCode}`
        await navigator.clipboard.writeText(checkInUrl)
        toast({
          title: 'Link Copied!',
          description: 'Check-in link copied to clipboard',
        })
      }
    } catch (error) {
      console.error('Error sharing:', error)
      toast({
        title: 'Error',
        description: 'Failed to share QR code',
        variant: 'destructive',
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!qrDataUrl) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Unable to generate QR code
      </div>
    )
  }

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-background">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Success Message */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-green-600"
          >
            <CheckCircle2 className="h-5 w-5" />
            <p className="font-semibold">Registration Successful!</p>
          </motion.div>

          {/* Instructions */}
          <div className="text-center space-y-2">
            <h3 className="text-lg font-bold">Your Check-in QR Code</h3>
            <p className="text-sm text-muted-foreground">
              Show this QR code at the event entrance for quick check-in
            </p>
          </div>

          {/* QR Code Display */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col items-center justify-center p-6 bg-white rounded-lg border-2 border-dashed border-primary/30"
          >
            <div className="p-4 bg-white rounded-lg shadow-lg">
              <Image
                src={qrDataUrl}
                alt="Your Check-in QR Code"
                width={320}
                height={320}
                className="w-64 h-64 sm:w-80 sm:h-80 aspect-square object-contain"
              />
            </div>
            <p className="mt-4 text-sm font-medium text-foreground">
              {attendeeName}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {eventTitle}
            </p>
          </motion.div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              onClick={handleDownload}
              variant="outline"
              className="flex-1"
            >
              <Download className="mr-2 h-4 w-4" />
              Download QR
            </Button>
            <Button
              onClick={handleShare}
              variant="outline"
              className="flex-1"
            >
              <Share2 className="mr-2 h-4 w-4" />
              Share QR
            </Button>
          </div>

          {/* Instructions */}
          <div className="p-4 bg-muted/50 rounded-lg space-y-2">
            <p className="text-xs font-semibold text-foreground">How to use:</p>
            <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
              <li>Save this QR code to your phone</li>
              <li>Show it at the event entrance</li>
              <li>Organizer will scan it for instant check-in</li>
              <li>No need to type anything!</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
