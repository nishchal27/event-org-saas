'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, Calendar, MapPin } from 'lucide-react'
import { motion } from 'framer-motion'

export function Hero() {
  const events = [
    {
      title: 'Workshop',
      date: 'Mar 15',
      location: 'Studio',
      gradient: 'from-blue-500 to-cyan-500',
      height: 'h-80 sm:h-96 lg:h-[420px]',
      translateY: 'translate-y-0',
      zIndex: 'z-10',
    },
    {
      title: 'Fitness Workshop',
      date: 'Mar 20',
      location: 'Online',
      gradient: 'from-purple-500 to-pink-500',
      height: 'h-64 sm:h-80 lg:h-[380px]',
      translateY: 'translate-y-8 sm:translate-y-12',
      zIndex: 'z-20',
    },
    {
      title: 'Music Lesson',
      date: 'Mar 25',
      location: 'Academy',
      gradient: 'from-green-500 to-emerald-500',
      height: 'h-72 sm:h-88 lg:h-[400px]',
      translateY: 'translate-y-4 sm:translate-y-6',
      zIndex: 'z-30',
    },
    {
      title: 'Community Meetup',
      date: 'Apr 2',
      location: 'Community Center',
      gradient: 'from-orange-500 to-red-500',
      height: 'h-60 sm:h-76 lg:h-[360px]',
      translateY: 'translate-y-12 sm:translate-y-16',
      zIndex: 'z-40',
    },
    {
      title: 'Dance Workshop',
      date: 'Apr 10',
      location: 'Studio',
      gradient: 'from-yellow-500 to-orange-500',
      height: 'h-76 sm:h-92 lg:h-[410px]',
      translateY: 'translate-y-2 sm:translate-y-4',
      zIndex: 'z-50',
    },
  ]

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-background via-primary/10 to-background dark:via-primary/20">
      {/* Animated Background Effects */}
      <div className="absolute inset-0 -z-10">
        <motion.div
          className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-primary/20 blur-3xl dark:bg-primary/30"
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 50, 0],
            y: [0, -30, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="absolute right-1/4 bottom-1/4 h-96 w-96 rounded-full bg-pink-500/20 blur-3xl dark:bg-pink-500/30"
          animate={{
            scale: [1, 1.3, 1],
            x: [0, -40, 0],
            y: [0, 40, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </div>

      {/* Hero Top Section */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl pt-20 pb-12 text-center sm:pt-32 sm:pb-16 lg:pt-40 lg:pb-20">
          {/* Tagline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6 inline-flex items-center gap-2"
          >
            <span className="text-sm font-medium text-primary dark:text-primary/90">
              WhatsApp-First Event & Attendance Tool
            </span>
            <motion.span
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
              className="text-red-400 dark:text-red-500"
            >
              ❤️
            </motion.span>
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-6 text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl"
          >
            <span className="block">Create Events.</span>
            <motion.span
              className="block bg-gradient-to-r from-primary via-pink-500 to-primary bg-clip-text text-transparent"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              Notify Everyone.
            </motion.span>
            <motion.span
              className="block"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              Automate WhatsApp.
            </motion.span>
          </motion.h1>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl"
          >
            Create events, notify people on WhatsApp, and track attendance — for groups, instructors, and organizers. 
            <motion.span
              className="block mt-2 font-semibold text-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              Now with advanced analytics, templates, QR check-in, and more premium features.
            </motion.span>
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                size="lg"
                asChild
                className="group bg-gradient-to-r from-primary via-pink-600 to-primary text-base font-semibold text-white shadow-xl shadow-primary/50 hover:shadow-2xl hover:shadow-primary/60"
              >
                <Link href="/sign-up">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="text-base font-semibold backdrop-blur-sm"
              >
                <Link href="#how-it-works">See How It Works</Link>
              </Button>
            </motion.div>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="mt-10 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground"
          >
            {[
              'No credit card required',
              'Free plan available',
              'Setup in minutes',
            ].map((text, index) => (
              <motion.div
                key={text}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.9 + index * 0.1 }}
                className="flex items-center gap-2"
              >
                <motion.div
                  className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-emerald-600"
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.5 }}
                >
                  <svg
                    className="h-3 w-3 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </motion.div>
                <span>{text}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Hero Bottom - Overlapping Event Cards Strip - Edge to Edge */}
      <div className="relative -mb-8 mt-8 w-full sm:mt-12 lg:mt-16">
        {/* Desktop: Overflow container with overlapping cards - Full Width Edge to Edge */}
        <div className="hidden lg:block">
          <div className="relative h-[500px] w-full overflow-visible">
            <div className="absolute left-0 right-0 top-0 flex items-end" style={{ paddingLeft: '0', paddingRight: '0' }}>
              {events.map((event, index) => {
                const isFirst = index === 0
                const overlapAmount = 64 // Overlap by 64px
                
                return (
                <motion.div
                  key={event.title}
                  initial={{ opacity: 0, y: 50, scale: 0.9 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true, margin: '-100px' }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  whileHover={{ y: -12, scale: 1.02 }}
                  style={{ 
                    marginLeft: isFirst ? '0' : `-${overlapAmount}px`,
                    flex: '1 1 0',
                    minWidth: '0'
                  }}
                  className={`group relative ${event.zIndex} ${event.translateY} overflow-hidden rounded-3xl bg-card shadow-2xl transition-all duration-300 hover:shadow-primary/30 ${event.height}`}
                >
                  {/* Event Image */}
                  <div
                    className={`relative h-full w-full overflow-hidden bg-gradient-to-br ${event.gradient}`}
                  >
                    {/* Placeholder - user will replace with actual images */}
                    <div className="flex h-full items-center justify-center">
                      <div className="text-center text-white/80">
                        <Calendar className="mx-auto mb-2 h-16 w-16" />
                        <div className="text-xs font-medium">Event Image</div>
                      </div>
                    </div>

                    {/* Subtle overlay on hover */}
                    <div className="absolute inset-0 bg-black/0 transition-all duration-300 group-hover:bg-black/10" />
                  </div>

                  {/* Event Info - Clean overlay at bottom */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-4 opacity-0 transition-opacity group-hover:opacity-100">
                    <h3 className="mb-1 text-sm font-semibold text-white">{event.title}</h3>
                    <div className="flex items-center gap-2 text-xs text-white/90">
                      <Calendar className="h-3 w-3" />
                      <span>{event.date}</span>
                      <span className="text-white/50">•</span>
                      <MapPin className="h-3 w-3" />
                      <span className="truncate">{event.location}</span>
                    </div>
                  </div>
                </motion.div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Mobile/Tablet: Horizontal scrollable cards - Edge to Edge */}
        <div className="lg:hidden">
          <div className="overflow-x-auto pb-4 scrollbar-hide">
            <div className="flex items-end gap-4 pl-0 pr-0">
              {events.map((event, index) => (
                <motion.div
                  key={event.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ y: -8 }}
                  className={`group relative flex-shrink-0 overflow-hidden rounded-3xl bg-card shadow-xl transition-all duration-300 hover:shadow-2xl ${event.height} w-[200px] sm:w-[240px]`}
                >
                  {/* Event Image */}
                  <div
                    className={`relative h-full w-full overflow-hidden bg-gradient-to-br ${event.gradient}`}
                  >
                    {/* Placeholder - user will replace with actual images */}
                    <div className="flex h-full items-center justify-center">
                      <div className="text-center text-white/80">
                        <Calendar className="mx-auto mb-2 h-12 w-12 sm:h-14 sm:w-14" />
                        <div className="text-xs font-medium">Event Image</div>
                      </div>
                    </div>

                    {/* Subtle overlay on hover */}
                    <div className="absolute inset-0 bg-black/0 transition-all duration-300 group-hover:bg-black/10" />
                  </div>

                  {/* Event Info - Clean overlay at bottom */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-3 opacity-0 transition-opacity group-hover:opacity-100">
                    <h3 className="mb-1 text-sm font-semibold text-white">{event.title}</h3>
                    <div className="flex items-center gap-2 text-xs text-white/90">
                      <Calendar className="h-3 w-3" />
                      <span>{event.date}</span>
                      <span className="text-white/50">•</span>
                      <MapPin className="h-3 w-3" />
                      <span className="truncate">{event.location}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
