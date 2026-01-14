'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Calendar, Clock, MapPin, User, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'

export function EventFormPreview() {
  return (
    <section className="relative overflow-hidden py-16 sm:py-24 lg:py-32">
      {/* Animated Background */}
      <div className="absolute inset-0 -z-10">
        <motion.div
          className="absolute right-0 top-1/4 h-96 w-96 rounded-full bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-transparent blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-gradient-to-br from-blue-500/10 via-cyan-500/10 to-transparent blur-3xl"
          animate={{
            scale: [1, 1.3, 1],
            rotate: [0, -90, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-2xl text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            Create Your Event in Minutes
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            See how easy it is to set up your event. Fill in the details, and we'll handle the rest.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-12"
        >
          <Card className="mx-auto max-w-3xl border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                >
                  <Sparkles className="h-5 w-5 text-primary" />
                </motion.div>
                <CardTitle className="text-2xl">Event Details</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {[
                { id: 'event-name', label: 'Event Name', icon: User, placeholder: 'Enter your event name...' },
                { id: 'event-date', label: 'Date', icon: Calendar, placeholder: 'Select date' },
                { id: 'event-time', label: 'Time', icon: Clock, placeholder: 'Select time' },
                { id: 'event-location', label: 'Location', icon: MapPin, placeholder: 'Enter event location...' },
              ].map((field, index) => {
                const Icon = field.icon
                return (
                  <motion.div
                    key={field.id}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
                    className={field.id === 'event-date' || field.id === 'event-time' ? 'grid gap-6 sm:grid-cols-2' : 'space-y-2'}
                  >
                    {(field.id === 'event-date' || field.id === 'event-time') ? (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="event-date">Date</Label>
                          <div className="relative">
                            <Calendar className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                            <Input
                              id="event-date"
                              placeholder="Select date"
                              className="pl-10"
                              disabled
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="event-time">Time</Label>
                          <div className="relative">
                            <Clock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                            <Input
                              id="event-time"
                              placeholder="Select time"
                              className="pl-10"
                              disabled
                            />
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <Label htmlFor={field.id}>{field.label}</Label>
                        <div className="relative">
                          <Icon className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                          <Input
                            id={field.id}
                            placeholder={field.placeholder}
                            className="pl-10"
                            disabled
                          />
                        </div>
                      </>
                    )}
                  </motion.div>
                )
              })}

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.7 }}
                className="space-y-2"
              >
                <Label htmlFor="event-description">Description</Label>
                <Textarea
                  id="event-description"
                  placeholder="Tell attendees about your event..."
                  className="min-h-[100px] resize-none"
                  disabled
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.8 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  size="lg"
                  className="w-full bg-gradient-to-r from-primary via-purple-600 to-pink-600 shadow-lg"
                  disabled
                >
                  Create Event & Send Notifications
                </Button>
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.9 }}
                className="text-center text-sm text-muted-foreground"
              >
                Sign up to create real events and send WhatsApp notifications
              </motion.p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  )
}
