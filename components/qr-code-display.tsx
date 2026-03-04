'use client'

import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { Button } from '@/components/ui/button'
import { Download, Copy, Check } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { motion } from 'framer-motion'
import Image from 'next/image'

interface QRCodeDisplayProps {
  qrCode: string
  eventTitle: string
  eventId: string
}

export function QRCodeDisplay({ qrCode, eventTitle, eventId }: QRCodeDisplayProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    if (qrCode) {
      // Generate the check-in URL
      const checkInUrl = `${window.location.origin}/checkin/${qrCode}`
      
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
  }, [qrCode, toast])

  const handleDownload = () => {
    if (!qrDataUrl) return

    const link = document.createElement('a')
    link.href = qrDataUrl
    link.download = `qr-code-${eventTitle.replace(/[^a-z0-9]/gi, '_')}-${qrCode}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: 'Downloaded',
      description: 'QR code saved to your device',
    })
  }

  const handleCopyLink = () => {
    const checkInUrl = `${window.location.origin}/checkin/${qrCode}`
    navigator.clipboard.writeText(checkInUrl)
    toast({
      title: 'Copied!',
      description: 'Check-in link copied to clipboard',
    })
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
    <div className="space-y-4">
      <div className="flex flex-col items-center justify-center p-6 bg-white rounded-lg border-2 border-dashed border-primary/20">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="p-4 bg-white rounded-lg shadow-lg"
        >
          <Image
            src={qrDataUrl}
            alt="QR Code for Check-in"
            width={320}
            height={320}
            className="w-64 h-64 aspect-square object-contain"
          />
        </motion.div>
        <p className="mt-4 text-sm font-medium text-foreground">
          Scan to check in
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {eventTitle}
        </p>
      </div>

      <div className="flex gap-2">
        <Button
          onClick={handleDownload}
          variant="outline"
          className="flex-1"
        >
          <Download className="mr-2 h-4 w-4" />
          Download QR
        </Button>
        <Button
          onClick={handleCopyLink}
          variant="outline"
          className="flex-1"
        >
          <Copy className="mr-2 h-4 w-4" />
          Copy Link
        </Button>
      </div>

      <div className="p-4 bg-muted/50 rounded-lg">
        <p className="text-xs text-muted-foreground mb-2">
          Check-in URL:
        </p>
        <code className="text-xs break-all text-foreground">
          {window.location.origin}/checkin/{qrCode}
        </code>
      </div>
    </div>
  )
}
