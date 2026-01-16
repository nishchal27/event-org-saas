'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Copy, MessageSquare, ExternalLink, Bell, CheckCircle2, Circle, Calendar } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { motion, AnimatePresence } from 'framer-motion'

interface EventRemindersProps {
  event: {
    id: string
    title: string
    eventDate: Date | string
    endDate?: Date | string | null
    startTime: string
    endTime?: string | null
    location: string
    description: string
    invitationSent: boolean
    reminder1Sent: boolean
    reminder2Sent: boolean
    reminder3Sent: boolean
  }
  onReminderUpdate?: (reminderType: 'invitation' | 'reminder1' | 'reminder2' | 'reminder3', sent: boolean) => void
}

type ReminderType = 'reminder1' | 'reminder2' | 'reminder3'

interface ReminderTemplate {
  type: ReminderType
  label: string
  description: string
    template: (event: { title: string; eventDate: Date | string; endDate?: Date | string | null; startTime: string; endTime?: string | null; location: string; description: string }) => string
}

const reminderTemplates: ReminderTemplate[] = [
  {
    type: 'reminder1',
    label: '1 Day Before',
    description: 'Remind attendees one day before the event',
    template: (event) => {
      const eventDate = typeof event.eventDate === 'string' ? new Date(event.eventDate) : event.eventDate
      const tomorrow = new Date(eventDate)
      tomorrow.setDate(tomorrow.getDate() - 1)
      const dateLabel = eventDate.toLocaleDateString('en-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
      const timeLabel = event.endTime ? `${event.startTime} - ${event.endTime}` : event.startTime

      return `🔔 *Reminder: ${event.title}*

Hi! Just a friendly reminder that our event is *tomorrow*:

📅 ${dateLabel}
🕐 ${timeLabel}
📍 ${event.location}

We're looking forward to seeing you there!

${event.description ? `\n${event.description}` : ''}`
    },
  },
  {
    type: 'reminder2',
    label: 'Event Day',
    description: 'Remind attendees on the event day',
    template: (event) => {
      const eventDate = typeof event.eventDate === 'string' ? new Date(event.eventDate) : event.eventDate
      const dateLabel = eventDate.toLocaleDateString('en-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
      const timeLabel = event.endTime ? `${event.startTime} - ${event.endTime}` : event.startTime

      return `🎉 *Today is the Event Day!*

*${event.title}* is happening *today*:

📅 ${dateLabel}
🕐 ${timeLabel}
📍 ${event.location}

See you soon! 🎊

${event.description ? `\n${event.description}` : ''}`
    },
  },
  {
    type: 'reminder3',
    label: '2 Hours Before',
    description: 'Last-minute reminder 2 hours before start',
    template: (event) => {
      const timeLabel = event.endTime ? `${event.startTime} - ${event.endTime}` : event.startTime

      return `⏰ *Last Reminder: ${event.title}*

The event starts in *2 hours*:

🕐 ${timeLabel}
📍 ${event.location}

Don't forget to join us! See you soon! 🎉`
    },
  },
]

export function EventReminders({ event, onReminderUpdate }: EventRemindersProps) {
  const { toast } = useToast()
  const [selectedReminder, setSelectedReminder] = useState<ReminderType | null>(null)
  const [message, setMessage] = useState('')
  const [copied, setCopied] = useState(false)
  const [checklist, setChecklist] = useState({
    invitation: event.invitationSent,
    reminder1: event.reminder1Sent,
    reminder2: event.reminder2Sent,
    reminder3: event.reminder3Sent,
  })

  // Update checklist when event props change
  useEffect(() => {
    setChecklist({
      invitation: event.invitationSent,
      reminder1: event.reminder1Sent,
      reminder2: event.reminder2Sent,
      reminder3: event.reminder3Sent,
    })
  }, [event])

  const handleReminderSelect = (type: ReminderType) => {
    setSelectedReminder(type)
    const template = reminderTemplates.find((t) => t.type === type)
    if (template) {
      setMessage(template.template(event))
    }
  }

  const handleChecklistToggle = async (type: 'invitation' | 'reminder1' | 'reminder2' | 'reminder3') => {
    const newValue = !checklist[type]
    setChecklist((prev) => ({ ...prev, [type]: newValue }))
    
    // Call update handler if provided
    if (onReminderUpdate) {
      const reminderType = type === 'invitation' ? 'invitation' : type
      onReminderUpdate(reminderType as any, newValue)
    }

    toast({
      title: newValue ? 'Marked as sent' : 'Marked as not sent',
      description: `${type === 'invitation' ? 'Invitation' : `Reminder ${type.replace('reminder', '')}`} ${newValue ? 'sent' : 'not sent'}`,
    })
  }

  const copyToClipboard = async () => {
    if (!message) return
    try {
      await navigator.clipboard.writeText(message)
      setCopied(true)
      toast({
        title: 'Copied!',
        description: 'Reminder message copied to clipboard',
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
    if (!message) return
    const encodedMessage = encodeURIComponent(message)
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank')
  }

  const getReminderStatus = (type: 'invitation' | 'reminder1' | 'reminder2' | 'reminder3') => {
    return checklist[type]
  }

  return (
    <div className="space-y-6">
      {/* Reminder Checklist */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-background">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-primary/10 p-2">
                <Bell className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Reminder Checklist</CardTitle>
                <CardDescription>Track what you've sent for this event</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* Invitation */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="flex items-center justify-between rounded-lg border p-4 hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="invitation"
                    checked={getReminderStatus('invitation')}
                    onCheckedChange={() => handleChecklistToggle('invitation')}
                  />
                  <Label htmlFor="invitation" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-primary" />
                      <span className="font-medium">Invitation Sent</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Initial event invitation
                    </p>
                  </Label>
                </div>
                {getReminderStatus('invitation') ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="rounded-full bg-green-100 p-1.5"
                  >
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  </motion.div>
                ) : (
                  <Circle className="h-4 w-4 text-muted-foreground" />
                )}
              </motion.div>

              {/* Reminder 1 */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="flex items-center justify-between rounded-lg border p-4 hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="reminder1"
                    checked={getReminderStatus('reminder1')}
                    onCheckedChange={() => handleChecklistToggle('reminder1')}
                  />
                  <Label htmlFor="reminder1" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-orange-600" />
                      <span className="font-medium">1 Day Before Reminder</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Send one day before event
                    </p>
                  </Label>
                </div>
                {getReminderStatus('reminder1') ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="rounded-full bg-green-100 p-1.5"
                  >
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  </motion.div>
                ) : (
                  <Circle className="h-4 w-4 text-muted-foreground" />
                )}
              </motion.div>

              {/* Reminder 2 */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="flex items-center justify-between rounded-lg border p-4 hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="reminder2"
                    checked={getReminderStatus('reminder2')}
                    onCheckedChange={() => handleChecklistToggle('reminder2')}
                  />
                  <Label htmlFor="reminder2" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <Bell className="h-4 w-4 text-blue-600" />
                      <span className="font-medium">Event Day Reminder</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Send on the event day
                    </p>
                  </Label>
                </div>
                {getReminderStatus('reminder2') ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="rounded-full bg-green-100 p-1.5"
                  >
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  </motion.div>
                ) : (
                  <Circle className="h-4 w-4 text-muted-foreground" />
                )}
              </motion.div>

              {/* Reminder 3 */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="flex items-center justify-between rounded-lg border p-4 hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="reminder3"
                    checked={getReminderStatus('reminder3')}
                    onCheckedChange={() => handleChecklistToggle('reminder3')}
                  />
                  <Label htmlFor="reminder3" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <Bell className="h-4 w-4 text-purple-600" />
                      <span className="font-medium">2 Hours Before Reminder</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Last-minute reminder
                    </p>
                  </Label>
                </div>
                {getReminderStatus('reminder3') ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="rounded-full bg-green-100 p-1.5"
                  >
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  </motion.div>
                ) : (
                  <Circle className="h-4 w-4 text-muted-foreground" />
                )}
              </motion.div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Reminder Templates */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Reminder Templates</CardTitle>
            <CardDescription>Select a reminder template to generate message</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              {reminderTemplates.map((template, index) => (
                <motion.button
                  key={template.type}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 * index }}
                  onClick={() => handleReminderSelect(template.type)}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    selectedReminder === template.type
                      ? 'border-primary bg-primary/5 shadow-md'
                      : 'border-border hover:border-primary/50 hover:bg-accent/50'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Bell className={`h-4 w-4 ${selectedReminder === template.type ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className="font-medium text-sm">{template.label}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{template.description}</p>
                </motion.button>
              ))}
            </div>

            {selectedReminder && message && (
              <AnimatePresence>
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4 pt-4 border-t"
                >
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Generated Message</Label>
                    <Textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="min-h-[150px] font-mono text-sm resize-none"
                      placeholder="Reminder message will appear here..."
                    />
                    <p className="text-xs text-muted-foreground">
                      {message.length} characters • Edit if needed before sending
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
                          >
                            <CheckCircle2 className="h-4 w-4" />
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
                </motion.div>
              </AnimatePresence>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
