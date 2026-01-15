'use client'

import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import {
  BarChart3,
  FileText,
  QrCode,
  Users,
  Calendar,
  TrendingUp,
  Download,
  Sparkles,
  Zap,
  CheckCircle2,
  MessageSquare,
} from 'lucide-react'

const premiumFeatures = [
  {
    icon: BarChart3,
    title: 'Advanced Analytics',
    description: 'Real-time insights with interactive charts. Track events, attendance trends, and engagement metrics.',
    gradient: 'from-blue-500 via-cyan-500 to-teal-500',
    stats: '6-month trends',
    color: 'blue',
    pulse: true,
  },
  {
    icon: FileText,
    title: 'Event Templates',
    description: 'Save and reuse event configurations. Create recurring events in seconds with one click.',
    gradient: 'from-purple-500 via-pink-500 to-rose-500',
    stats: 'Save time',
    color: 'purple',
    pulse: true,
  },
  {
    icon: Download,
    title: 'CSV Export',
    description: 'Export events, contacts, and attendance reports. Perfect for backups and analysis.',
    gradient: 'from-green-500 via-emerald-500 to-teal-500',
    stats: 'Full data export',
    color: 'green',
  },
  {
    icon: QrCode,
    title: 'QR Check-in',
    description: 'On-site attendance tracking with QR codes. Fast, contactless, and professional.',
    gradient: 'from-orange-500 via-amber-500 to-yellow-500',
    stats: 'Instant check-in',
    color: 'orange',
    pulse: true,
  },
  {
    icon: Users,
    title: 'Contact Groups',
    description: 'Organize contacts into segments. Target specific groups for events and messaging.',
    gradient: 'from-indigo-500 via-purple-500 to-pink-500',
    stats: 'Smart segmentation',
    color: 'indigo',
  },
  {
    icon: Calendar,
    title: 'Capacity & Waitlist',
    description: 'Set maximum capacity and automatic waitlist management. Never overbook again.',
    gradient: 'from-red-500 via-rose-500 to-pink-500',
    stats: 'Auto waitlist',
    color: 'red',
  },
  {
    icon: TrendingUp,
    title: 'Engagement Tracking',
    description: 'Track contact activity across events. Identify your most engaged attendees.',
    gradient: 'from-teal-500 via-cyan-500 to-blue-500',
    stats: 'Activity insights',
    color: 'teal',
    pulse: true,
  },
  {
    icon: Zap,
    title: 'Recurring Events',
    description: 'Duplicate events with date shift. Perfect for weekly classes and monthly meetups.',
    gradient: 'from-yellow-500 via-orange-500 to-red-500',
    stats: 'One-click duplicate',
    color: 'yellow',
  },
  {
    icon: MessageSquare,
    title: 'Message Templates',
    description: 'Save WhatsApp message templates. Personalize invitations, reminders, and follow-ups with variables.',
    gradient: 'from-violet-500 via-purple-500 to-fuchsia-500',
    stats: 'Reusable messages',
    color: 'violet',
    pulse: true,
  },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.4, 0, 0.2, 1] as const, // easeOut cubic-bezier
    },
  },
}

export function PremiumFeatures() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-background via-primary/5 to-background py-24 sm:py-32 lg:py-40">
      {/* Enhanced Animated Background Elements */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <motion.div
          className="absolute left-1/4 top-1/4 h-[600px] w-[600px] rounded-full bg-gradient-to-r from-blue-500/25 via-purple-500/25 to-pink-500/25 blur-3xl"
          animate={{
            scale: [1, 1.3, 1],
            x: [0, 120, 0],
            y: [0, -60, 0],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="absolute right-1/4 bottom-1/4 h-[600px] w-[600px] rounded-full bg-gradient-to-r from-orange-500/25 via-yellow-500/25 to-green-500/25 blur-3xl"
          animate={{
            scale: [1, 1.4, 1],
            x: [0, -100, 0],
            y: [0, 80, 0],
            rotate: [360, 180, 0],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-violet-500/20 via-indigo-500/20 to-blue-500/20 blur-3xl"
          animate={{
            scale: [1, 1.5, 1],
            rotate: [0, 360],
          }}
          transition={{
            duration: 35,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mx-auto mb-16 max-w-3xl text-center"
        >
          <motion.div
            className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-gradient-to-r from-primary/10 via-purple-500/10 to-pink-500/10 px-4 py-2 text-sm font-medium text-primary backdrop-blur-sm"
            whileHover={{ scale: 1.05 }}
            transition={{ type: 'spring', stiffness: 400 }}
          >
            <Sparkles className="h-4 w-4" />
            <span>Premium Features</span>
          </motion.div>

          <motion.h2 
            className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <motion.span 
              className="block bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent"
              animate={{
                backgroundPosition: ['0%', '100%', '0%'],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              style={{
                backgroundSize: '200% 200%',
              }}
            >
              Powerful Tools
            </motion.span>
            <br />
            <span className="text-foreground">For Serious Organizers</span>
          </motion.h2>
          <p className="text-lg leading-relaxed text-muted-foreground sm:text-xl">
            Take your event management to the next level with advanced features designed to save time, increase engagement, and grow your community.
          </p>
        </motion.div>

        {/* Premium Features Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {premiumFeatures.map((feature, index) => {
            const Icon = feature.icon
            return (
              <motion.div 
                key={feature.title} 
                variants={itemVariants}
                whileHover={{ y: -8 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                <Card className="group relative h-full overflow-hidden border-border/50 bg-card/80 backdrop-blur-md transition-all duration-500 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/30 hover:scale-[1.02]">
                  {/* Animated Gradient Background */}
                  <motion.div
                    className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 transition-opacity duration-500 group-hover:opacity-15`}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ duration: 0.5 }}
                  />

                  {/* Animated Border Glow */}
                  <motion.div
                    className={`absolute inset-0 rounded-lg bg-gradient-to-br ${feature.gradient} opacity-0 blur-sm transition-opacity group-hover:opacity-30`}
                    animate={feature.pulse ? {
                      opacity: [0, 0.2, 0],
                    } : {}}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  />

                  {/* Shimmer Effect */}
                  <motion.div
                    className="absolute inset-0 -z-10 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100"
                    initial={{ x: '-100%' }}
                    whileHover={{ x: '200%' }}
                    transition={{ duration: 1.2, ease: 'easeInOut' }}
                  />

                  {/* Floating Particles Effect */}
                  {feature.pulse && (
                    <>
                      {[...Array(3)].map((_, i) => (
                        <motion.div
                          key={i}
                          className={`absolute h-1 w-1 rounded-full bg-gradient-to-br ${feature.gradient}`}
                          style={{
                            left: `${20 + i * 30}%`,
                            top: `${10 + i * 20}%`,
                          }}
                          animate={{
                            y: [0, -20, 0],
                            opacity: [0.3, 0.8, 0.3],
                            scale: [1, 1.5, 1],
                          }}
                          transition={{
                            duration: 2 + i * 0.5,
                            repeat: Infinity,
                            delay: i * 0.3,
                            ease: 'easeInOut',
                          }}
                        />
                      ))}
                    </>
                  )}

                  <CardContent className="relative p-6">
                    {/* Icon with Enhanced Gradient and Pulse */}
                    <motion.div
                      className="mb-4"
                      whileHover={{ scale: 1.15, rotate: [0, -10, 10, -5, 5, 0] }}
                      transition={{ duration: 0.6, type: 'spring' }}
                    >
                      <div className={`relative inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${feature.gradient} text-white shadow-xl shadow-primary/30`}>
                        <Icon className="h-8 w-8 z-10 relative" />
                        {/* Pulsing Glow Effect */}
                        <motion.div
                          className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${feature.gradient} opacity-0 blur-xl`}
                          animate={feature.pulse ? {
                            opacity: [0, 0.6, 0],
                            scale: [1, 1.3, 1],
                          } : {
                            opacity: 0,
                          }}
                          transition={{
                            duration: 2.5,
                            repeat: Infinity,
                            ease: 'easeInOut',
                          }}
                        />
                        {/* Rotating Ring */}
                        <motion.div
                          className={`absolute inset-0 rounded-2xl border-2 border-white/30`}
                          animate={feature.pulse ? {
                            rotate: 360,
                          } : {}}
                          transition={{
                            duration: 8,
                            repeat: Infinity,
                            ease: 'linear',
                          }}
                        />
                      </div>
                    </motion.div>

                    {/* Stats Badge with Animation */}
                    <motion.div
                      className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary backdrop-blur-sm border border-primary/20"
                      whileHover={{ scale: 1.08, x: 4 }}
                      transition={{ type: 'spring', stiffness: 400 }}
                    >
                      <motion.div
                        animate={feature.pulse ? {
                          scale: [1, 1.2, 1],
                        } : {}}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: 'easeInOut',
                        }}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      </motion.div>
                      <span>{feature.stats}</span>
                    </motion.div>

                    {/* Title with Gradient on Hover */}
                    <motion.h3 
                      className="mb-2 text-xl font-bold leading-tight bg-gradient-to-r from-foreground to-foreground bg-clip-text group-hover:from-primary group-hover:via-purple-600 group-hover:to-pink-600 group-hover:text-transparent transition-all duration-500"
                      whileHover={{ x: 4 }}
                    >
                      {feature.title}
                    </motion.h3>

                    {/* Description */}
                    <p className="text-sm leading-relaxed text-muted-foreground group-hover:text-foreground/80 transition-colors">
                      {feature.description}
                    </p>

                    {/* Animated Hover Indicator */}
                    <motion.div
                      className="absolute bottom-4 right-4 opacity-0 transition-opacity group-hover:opacity-100"
                      initial={{ scale: 0, rotate: -180 }}
                      whileHover={{ scale: 1.3, rotate: 0 }}
                      transition={{ type: 'spring', stiffness: 300 }}
                    >
                      <div className={`h-3 w-3 rounded-full bg-gradient-to-br ${feature.gradient} shadow-lg`} />
                    </motion.div>

                    {/* Corner Accent */}
                    <motion.div
                      className={`absolute top-0 right-0 h-20 w-20 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 blur-2xl transition-opacity`}
                      animate={feature.pulse ? {
                        scale: [1, 1.2, 1],
                      } : {}}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                    />
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-16 text-center"
        >
          <p className="mb-4 text-sm font-medium text-muted-foreground">
            All premium features included in Monthly Pro plan
          </p>
          <motion.div
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary/10 via-purple-500/10 to-pink-500/10 px-6 py-3 backdrop-blur-sm"
            whileHover={{ scale: 1.05 }}
            transition={{ type: 'spring', stiffness: 400 }}
          >
            <Zap className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">
              Upgrade to unlock all features
            </span>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
