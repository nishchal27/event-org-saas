'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Star } from 'lucide-react'
import { motion } from 'framer-motion'

const testimonials = [
  {
    name: 'Sarah Chen',
    role: 'Community Organizer',
    organization: 'Green Valley NGO',
    content:
      'EventOrg has transformed how we manage our community events. The WhatsApp automation saves us hours every week, and our attendees love the instant notifications.',
    rating: 5,
    avatar: 'SC',
    gradient: 'from-green-500 to-emerald-600',
  },
  {
    name: 'Rajesh Kumar',
    role: 'Event Coordinator',
    organization: 'Tech Meetup Mumbai',
    content:
      'The AI content generation feature is a game-changer. We can create professional event descriptions and social media posts in seconds. Highly recommended!',
    rating: 5,
    avatar: 'RK',
    gradient: 'from-purple-500 to-pink-600',
  },
  {
    name: 'Maria Rodriguez',
    role: 'Program Director',
    organization: 'Youth Development Foundation',
    content:
      'As a non-profit, we needed an affordable solution that could scale. EventOrg delivers exactly that. The free plan got us started, and upgrading was seamless.',
    rating: 5,
    avatar: 'MR',
    gradient: 'from-blue-500 to-cyan-600',
  },
  {
    name: 'David Thompson',
    role: 'Community Manager',
    organization: 'Local Business Network',
    content:
      'The contact management and WhatsApp integration work flawlessly. We can now reach all our members instantly, and the analytics help us understand engagement.',
    rating: 5,
    avatar: 'DT',
    gradient: 'from-orange-500 to-red-600',
  },
]

const stats = [
  { value: '10K+', label: 'Events Created', gradient: 'from-blue-500 to-cyan-500' },
  { value: '500K+', label: 'WhatsApp Messages Sent', gradient: 'from-green-500 to-emerald-500' },
  { value: '2K+', label: 'Active Organizations', gradient: 'from-purple-500 to-pink-500' },
  { value: '98%', label: 'Customer Satisfaction', gradient: 'from-yellow-500 to-orange-500' },
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

const statVariants = {
  hidden: { opacity: 0, scale: 0.5, y: 50 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 100,
      damping: 15,
    },
  },
}

const testimonialVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.9 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 100,
      damping: 15,
    },
  },
}

export function Testimonials() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-background via-primary/5 to-background dark:via-primary/15 py-16 sm:py-24 lg:py-32">
      {/* Animated Background */}
      <div className="absolute inset-0 -z-10">
        <motion.div
          className="absolute -right-32 top-20 h-96 w-96 rounded-full bg-primary/20 blur-3xl dark:bg-primary/30"
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
          className="absolute -left-32 bottom-20 h-96 w-96 rounded-full bg-pink-500/20 blur-3xl dark:bg-pink-500/30"
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
        {/* Stats Section */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="mb-16 grid grid-cols-2 gap-8 sm:grid-cols-4"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              variants={statVariants}
              whileHover={{ scale: 1.1, y: -5 }}
              className="text-center"
            >
              <motion.div
                className={`text-4xl font-bold bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent sm:text-5xl lg:text-6xl`}
                animate={{
                  scale: [1, 1.05, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: index * 0.2,
                }}
              >
                {stat.value}
              </motion.div>
              <div className="mt-2 text-sm font-medium text-muted-foreground sm:text-base">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto mb-12 max-w-2xl text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            Loved by NGOs & Communities
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            See what organizations like yours are saying about EventOrg
          </p>
        </motion.div>

        {/* Testimonials Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
        >
          {testimonials.map((testimonial, index) => (
            <motion.div key={testimonial.name} variants={testimonialVariants}>
              <Card className="group relative overflow-hidden border-border/50 bg-card transition-all duration-300 hover:border-primary/50 hover:shadow-xl">
                {/* Gradient overlay */}
                <motion.div
                  className={`absolute inset-0 bg-gradient-to-br ${testimonial.gradient} opacity-0 transition-opacity duration-300 group-hover:opacity-5`}
                />

                <CardContent className="p-6">
                  {/* Rating */}
                  <div className="mb-4 flex gap-1">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{
                          delay: index * 0.1 + i * 0.05,
                          type: 'spring' as const,
                        }}
                        whileHover={{ scale: 1.3, rotate: 15 }}
                      >
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      </motion.div>
                    ))}
                  </div>

                  {/* Content */}
                  <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
                    "{testimonial.content}"
                  </p>

                  {/* Author */}
                  <div className="flex items-center gap-3">
                    <motion.div
                      className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${testimonial.gradient} text-sm font-semibold text-white shadow-lg`}
                      whileHover={{ scale: 1.1, rotate: 360 }}
                      transition={{ duration: 0.5 }}
                    >
                      {testimonial.avatar}
                    </motion.div>
                    <div>
                      <div className="text-sm font-semibold text-foreground">
                        {testimonial.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {testimonial.role}
                      </div>
                      <div className="text-xs text-muted-foreground/80">
                        {testimonial.organization}
                      </div>
                    </div>
                  </div>
                </CardContent>

                {/* Shine effect */}
                <motion.div
                  className="absolute inset-0 -z-10 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                  initial={{ x: '-100%' }}
                  whileHover={{ x: '100%' }}
                  transition={{ duration: 0.6 }}
                />
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
