'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Copy, MessageSquare, ExternalLink, Sparkles, Edit2, Check } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { motion, AnimatePresence } from 'framer-motion'

interface ManualWhatsAppInviteProps {
  event: {
    id: string
    title: string
    eventDate: Date | string
    endDate?: Date | string | null
    startTime: string
    endTime?: string | null
    location: string
    description: string
    publicSlug: string
  }
  onMessageGenerated?: (message: string) => void
}

export function ManualWhatsAppInvite({ event, onMessageGenerated }: ManualWhatsAppInviteProps) {
  const { toast } = useToast()
  const [message, setMessage] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [copied, setCopied] = useState(false)

  const generateMessage = useCallback(() => {
    const eventUrl = `${window.location.origin}/event/${event.publicSlug}`
    const startDate = typeof event.eventDate === 'string' ? new Date(event.eventDate) : event.eventDate
    const endDate = event.endDate ? (typeof event.endDate === 'string' ? new Date(event.endDate) : event.endDate) : null
    const startDateLabel = startDate.toLocaleDateString('en-IN', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
    const endDateLabel = endDate
      ? endDate.toLocaleDateString('en-IN', {
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })
      : null
    const dateLabel =
      endDateLabel && endDateLabel !== startDateLabel
        ? `${startDateLabel} - ${endDateLabel}`
        : startDateLabel

    const timeLabel = event.endTime ? `${event.startTime} - ${event.endTime}` : event.startTime

    const generatedMessage = `🎉 *${event.title}*

📅 ${dateLabel}
🕐 ${timeLabel}
📍 ${event.location}

${event.description}

👉 Register: ${eventUrl}`

    setMessage(generatedMessage)
    onMessageGenerated?.(generatedMessage)
  }, [event, onMessageGenerated])

  // Generate message template from event details
  useEffect(() => {
    if (!isEditing && !message) {
      generateMessage()
    }
  }, [isEditing, message, generateMessage])

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(message)
      setCopied(true)
      toast({
        title: 'Copied!',
        description: 'Message copied to clipboard',
      })
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to copy message',
        variant: 'destructive',
      })
    }
  }

  const openWhatsApp = () => {
    // Encode message for URL
    const encodedMessage = encodeURIComponent(message)
    // Open WhatsApp Web or App (will open default WhatsApp)
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank')
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-background">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-primary/10 p-2">
                <MessageSquare className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">WhatsApp Invitation</CardTitle>
                <CardDescription>Generate and send invitation manually</CardDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={generateMessage}
              className="gap-2"
            >
              <Sparkles className="h-4 w-4" />
              Regenerate
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="message" className="text-sm font-medium">
                Message Template
              </Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
                className="h-7 gap-1 text-xs"
              >
                {isEditing ? (
                  <>
                    <Check className="h-3 w-3" />
                    Done
                  </>
                ) : (
                  <>
                    <Edit2 className="h-3 w-3" />
                    Edit
                  </>
                )}
              </Button>
            </div>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onBlur={() => setIsEditing(false)}
              disabled={!isEditing}
              className="min-h-[200px] font-mono text-sm resize-none transition-all"
              placeholder="Message will be auto-generated..."
            />
            <p className="text-xs text-muted-foreground">
              {message.length} characters • Edit the message before sending
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              onClick={copyToClipboard}
              className="flex-1 gap-2 bg-primary hover:bg-primary/90"
              size="lg"
            >
              <AnimatePresence mode="wait">
                {copied ? (
                  <motion.div
                    key="check"
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: 180 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Check className="h-4 w-4" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="copy"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                  >
                    <Copy className="h-4 w-4" />
                  </motion.div>
                )}
              </AnimatePresence>
              {copied ? 'Copied!' : 'Copy to Clipboard'}
            </Button>
            <Button
              onClick={openWhatsApp}
              variant="outline"
              className="flex-1 gap-2 border-primary/20 hover:bg-primary/5"
              size="lg"
            >
              <MessageSquare className="h-4 w-4 text-green-600" />
              Open WhatsApp
              <ExternalLink className="h-3 w-3" />
            </Button>
          </div>

          <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
            <p className="text-xs text-blue-800 font-medium mb-1">💡 How to use:</p>
            <ol className="text-xs text-blue-700 space-y-1 list-decimal list-inside">
              <li>Click "Copy to Clipboard" to copy the message</li>
              <li>Open WhatsApp and select your contact</li>
              <li>Paste and send the message</li>
              <li>Or click "Open WhatsApp" to open WhatsApp Web with the message pre-filled</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
