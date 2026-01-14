'use client'

import { Card, CardContent } from '@/components/ui/card'
import { MessageSquare, Sparkles, Calendar, Users, Zap, Globe } from 'lucide-react'
import { motion } from 'framer-motion'
import Image from 'next/image'

const coreFeatures = [
  {
    icon: Calendar,
    title: 'Create Events in Minutes',
    description: 'Rich event details, custom fields, and beautiful banners. Everything you need to set up professional events.',
    gradient: 'from-blue-500 to-cyan-500',
    highlight: '2 min setup',
  },
  {
    icon: MessageSquare,
    title: 'WhatsApp Automation',
    description: 'Send instant invitations and reminders via WhatsApp. Reach attendees where they are.',
    tech: 'whatsapp',
    gradient: 'from-green-500 to-emerald-600',
    highlight: 'Auto-send',
  },
  {
    icon: Sparkles,
    title: 'AI Content Generation',
    description: 'Generate social media posts and WhatsApp messages with AI. Choose tone, platform, and customize.',
    tech: 'openai',
    gradient: 'from-yellow-500 to-orange-500',
    highlight: 'AI-powered',
  },
  {
    icon: Users,
    title: 'Smart Contact Management',
    description: 'Organize contacts, create groups, and send targeted invitations. Import in bulk or add manually.',
    gradient: 'from-purple-500 to-pink-500',
    highlight: 'Bulk import',
  },
]

export function Features() {
  return (
    <section id="features" className="relative overflow-hidden py-16 sm:py-24 lg:py-32">
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
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto mb-16 max-w-3xl text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            Powerful Features, Simple Experience
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Everything you need to create, manage, and promote your events—all in one platform.
          </p>
        </motion.div>

        {/* Core Features Grid */}
        <div className="mb-20 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {coreFeatures.map((feature, index) => {
            const Icon = feature.icon
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="group relative h-full overflow-hidden border-border/50 bg-card transition-all duration-300 hover:border-primary/50 hover:shadow-2xl">
                  {/* Gradient background */}
                  <motion.div
                    className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 transition-opacity duration-300 group-hover:opacity-10`}
                  />

                  <CardContent className="relative p-6">
                    <div className="mb-4 flex items-start justify-between">
                      <motion.div
                        className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${feature.gradient} text-white shadow-lg`}
                        whileHover={{ scale: 1.1, rotate: [0, -10, 10, 0] }}
                        transition={{ duration: 0.5 }}
                      >
                        <Icon className="h-7 w-7" />
                      </motion.div>
                      {feature.tech && (
                        <motion.div
                          className="relative h-10 w-10 rounded-lg bg-card border border-border/50 p-1.5 opacity-60 transition-all group-hover:opacity-100 group-hover:scale-110"
                          whileHover={{ rotate: 360 }}
                          transition={{ duration: 0.6 }}
                        >
                          <Image
                            src={`/icons/${feature.tech === 'whatsapp' ? 'whatsapp' : 'chat-gpt'}.png`}
                            alt={feature.tech}
                            fill
                            className="object-contain"
                            unoptimized
                          />
                        </motion.div>
                      )}
                    </div>

                    <div className="mb-2">
                      <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                        {feature.highlight}
                      </span>
                    </div>

                    <h3 className="mb-2 text-xl font-bold">{feature.title}</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {feature.description}
                    </p>
                  </CardContent>

                  {/* Shine effect */}
                  <motion.div
                    className="absolute inset-0 -z-10 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    initial={{ x: '-100%' }}
                    whileHover={{ x: '100%' }}
                    transition={{ duration: 0.8 }}
                  />
                </Card>
              </motion.div>
            )
          })}
        </div>

        {/* Public Event Page Preview Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative"
        >
          <div className="mb-12 text-center">
            <motion.div
              className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-gradient-to-r from-primary/10 via-purple-500/10 to-pink-500/10 px-4 py-2 text-sm font-medium text-primary backdrop-blur-sm"
              whileHover={{ scale: 1.05 }}
            >
              <Globe className="h-4 w-4" />
              <span>Public Event Pages</span>
            </motion.div>
            <h3 className="mb-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Beautiful Pages Your Attendees Will Love
            </h3>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              Each event gets a stunning, mobile-optimized public page. No login required. Share
              instantly via WhatsApp, email, or social media.
            </p>
          </div>

          {/* Mockup Preview */}
          <div className="relative mx-auto max-w-4xl">
            <motion.div
              className="relative overflow-hidden rounded-2xl border-8 border-gray-900 shadow-2xl"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              {/* Browser Chrome */}
              <div className="flex items-center gap-2 bg-gray-900 px-4 py-3">
                <div className="flex gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-500"></div>
                  <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                  <div className="h-3 w-3 rounded-full bg-green-500"></div>
                </div>
                <div className="ml-4 flex-1 rounded-md bg-gray-800 px-3 py-1 text-center text-xs text-gray-400">
                  eventorg.com/event/community-meetup-2024
                </div>
              </div>

              {/* Mock Event Page Content */}
              <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50">
                {/* Header with Logo */}
                <div className="border-b border-gray-200 bg-white/80 backdrop-blur-sm px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-purple-600 text-white">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <span className="text-lg font-bold text-gray-900">EventOrg</span>
                  </div>
                </div>

                {/* Event Banner */}
                <div className="relative h-48 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center text-white">
                      <div className="mb-2 text-4xl">🎉</div>
                      <div className="text-sm font-medium opacity-90">Event Banner</div>
                    </div>
                  </div>
                </div>

                {/* Event Content */}
                <div className="px-6 py-8">
                  <h2 className="mb-2 text-2xl font-bold text-gray-900">
                    Community Meetup 2024
                  </h2>
                  <div className="mb-6 space-y-3 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      <span>Saturday, March 15, 2024 • 10:00 AM - 2:00 PM</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-primary" />
                      <span>Community Center, Downtown</span>
                    </div>
                  </div>

                  <p className="mb-6 text-sm leading-relaxed text-gray-700">
                    Join us for an exciting community gathering! Connect with neighbors, enjoy
                    activities, and celebrate together. Food and refreshments will be provided.
                  </p>

                  {/* RSVP Form Mockup */}
                  <Card className="border-2 border-primary/20 bg-white shadow-lg">
                    <CardContent className="p-6">
                      <h3 className="mb-4 text-lg font-semibold text-gray-900">
                        Confirm Your Attendance
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <div className="mb-2 h-3 w-24 rounded bg-gray-200"></div>
                          <div className="h-10 rounded-lg border-2 border-gray-200 bg-gray-50"></div>
                        </div>
                        <div>
                          <div className="mb-2 h-3 w-32 rounded bg-gray-200"></div>
                          <div className="h-10 rounded-lg border-2 border-gray-200 bg-gray-50"></div>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="h-10 rounded-lg border-2 border-primary bg-primary/10"></div>
                          <div className="h-10 rounded-lg border-2 border-gray-200 bg-gray-50"></div>
                          <div className="h-10 rounded-lg border-2 border-gray-200 bg-gray-50"></div>
                        </div>
                        <motion.div
                          className="h-12 rounded-lg bg-gradient-to-r from-primary to-purple-600"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="flex h-full items-center justify-center">
                            <span className="text-sm font-semibold text-white">
                              Confirm Attendance
                            </span>
                          </div>
                        </motion.div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </motion.div>

            {/* Floating badges */}
            <motion.div
              className="absolute -right-4 top-1/4 hidden lg:block"
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <Card className="border-primary/30 bg-gradient-to-br from-green-50 to-emerald-50 p-4 shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500 text-white">
                    <Zap className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">Mobile Optimized</div>
                    <div className="text-xs text-gray-600">Works on all devices</div>
                  </div>
                </div>
              </Card>
            </motion.div>

            <motion.div
              className="absolute -left-4 bottom-1/4 hidden lg:block"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.7 }}
            >
              <Card className="border-primary/30 bg-gradient-to-br from-blue-50 to-cyan-50 p-4 shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500 text-white">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">Share Instantly</div>
                    <div className="text-xs text-gray-600">One-click sharing</div>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
