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
} from 'lucide-react'

const premiumFeatures = [
  {
    icon: BarChart3,
    title: 'Advanced Analytics',
    description: 'Real-time insights with interactive charts. Track events, attendance trends, and engagement metrics.',
    gradient: 'from-blue-500 via-cyan-500 to-teal-500',
    stats: '6-month trends',
    color: 'blue',
  },
  {
    icon: FileText,
    title: 'Event Templates',
    description: 'Save and reuse event configurations. Create recurring events in seconds with one click.',
    gradient: 'from-purple-500 via-pink-500 to-rose-500',
    stats: 'Save time',
    color: 'purple',
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
  },
  {
    icon: Zap,
    title: 'Recurring Events',
    description: 'Duplicate events with date shift. Perfect for weekly classes and monthly meetups.',
    gradient: 'from-yellow-500 via-orange-500 to-red-500',
    stats: 'One-click duplicate',
    color: 'yellow',
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
      ease: 'easeOut',
    },
  },
}

export function PremiumFeatures() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-background via-primary/5 to-background py-24 sm:py-32 lg:py-40">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <motion.div
          className="absolute left-1/4 top-1/4 h-[500px] w-[500px] rounded-full bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 100, 0],
            y: [0, -50, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="absolute right-1/4 bottom-1/4 h-[500px] w-[500px] rounded-full bg-gradient-to-r from-orange-500/20 via-yellow-500/20 to-green-500/20 blur-3xl"
          animate={{
            scale: [1, 1.3, 1],
            x: [0, -80, 0],
            y: [0, 60, 0],
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

          <h2 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            <span className="bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Powerful Tools
            </span>
            <br />
            <span className="text-foreground">For Serious Organizers</span>
          </h2>
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
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
        >
          {premiumFeatures.map((feature, index) => {
            const Icon = feature.icon
            return (
              <motion.div key={feature.title} variants={itemVariants}>
                <Card className="group relative h-full overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-500 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/20">
                  {/* Animated Gradient Background */}
                  <motion.div
                    className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 transition-opacity duration-500 group-hover:opacity-10`}
                    whileHover={{ scale: 1.1 }}
                  />

                  {/* Shimmer Effect */}
                  <motion.div
                    className="absolute inset-0 -z-10 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100"
                    initial={{ x: '-100%' }}
                    whileHover={{ x: '200%' }}
                    transition={{ duration: 1, ease: 'easeInOut' }}
                  />

                  <CardContent className="relative p-6">
                    {/* Icon with Gradient */}
                    <motion.div
                      className="mb-4"
                      whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }}
                      transition={{ duration: 0.5 }}
                    >
                      <div className={`relative inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${feature.gradient} text-white shadow-lg`}>
                        <Icon className="h-7 w-7" />
                        <motion.div
                          className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${feature.gradient} opacity-0 blur-xl transition-opacity group-hover:opacity-50`}
                          animate={{
                            scale: [1, 1.2, 1],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: 'easeInOut',
                          }}
                        />
                      </div>
                    </motion.div>

                    {/* Stats Badge */}
                    <motion.div
                      className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary"
                      whileHover={{ scale: 1.05 }}
                    >
                      <CheckCircle2 className="h-3 w-3" />
                      <span>{feature.stats}</span>
                    </motion.div>

                    {/* Title */}
                    <h3 className="mb-2 text-lg font-bold leading-tight">{feature.title}</h3>

                    {/* Description */}
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {feature.description}
                    </p>

                    {/* Hover Indicator */}
                    <motion.div
                      className="absolute bottom-4 right-4 opacity-0 transition-opacity group-hover:opacity-100"
                      initial={{ scale: 0 }}
                      whileHover={{ scale: 1.2 }}
                    >
                      <div className={`h-2 w-2 rounded-full bg-gradient-to-br ${feature.gradient}`} />
                    </motion.div>
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
