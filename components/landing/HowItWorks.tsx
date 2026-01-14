'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'

const steps = [
  {
    number: '01',
    title: 'Create Your Event',
    description:
      'Sign up for free and create your first event. Add all the details—name, date, time, location, and description.',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    number: '02',
    title: 'Add Your Contacts',
    description:
      'Import your contact list or add contacts manually. Organize them into groups for easy event targeting.',
    gradient: 'from-purple-500 to-pink-500',
  },
  {
    number: '03',
    title: 'Send Notifications',
    description:
      'Select your attendees and send WhatsApp notifications instantly. Reminders and updates go out automatically.',
    gradient: 'from-green-500 to-emerald-500',
  },
  {
    number: '04',
    title: 'Track & Manage',
    description:
      'Monitor attendance, track delivery status, and manage your events all from one dashboard.',
    gradient: 'from-orange-500 to-red-500',
  },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
}

const stepVariants = {
  hidden: { opacity: 0, y: 50, scale: 0.9 },
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

export function HowItWorks() {
  return (
    <section id="how-it-works" className="relative overflow-hidden bg-gradient-to-br from-background via-primary/5 to-background dark:via-primary/15 py-16 sm:py-24 lg:py-32">
      {/* Animated Background */}
      <div className="absolute inset-0 -z-10">
        <motion.div
          className="absolute right-0 top-1/4 h-96 w-96 rounded-full bg-primary/20 blur-3xl dark:bg-primary/30"
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 30, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-pink-500/20 blur-3xl dark:bg-pink-500/30"
          animate={{
            scale: [1, 1.3, 1],
            x: [0, -20, 0],
          }}
          transition={{
            duration: 20,
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
          className="mx-auto max-w-2xl text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            How It Works
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Get started in four simple steps. No technical knowledge required.
          </p>
        </motion.div>

        {/* Steps Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4"
        >
          {steps.map((step, index) => (
            <motion.div key={step.number} variants={stepVariants}>
              <Card className="group relative overflow-hidden border-border/50 bg-card transition-all duration-300 hover:border-primary/50 hover:shadow-xl">
                {/* Gradient overlay */}
                <motion.div
                  className={`absolute inset-0 bg-gradient-to-br ${step.gradient} opacity-0 transition-opacity duration-300 group-hover:opacity-5`}
                />

                <CardHeader>
                  <motion.div
                    className={`mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${step.gradient} text-2xl font-bold text-white shadow-lg`}
                    whileHover={{ scale: 1.1, rotate: [0, -10, 10, -10, 0] }}
                    animate={{
                      boxShadow: [
                        '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                        '0 20px 40px -5px rgba(0, 0, 0, 0.2)',
                        '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                      ],
                    }}
                    transition={{
                      boxShadow: {
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      },
                      default: {
                        duration: 0.5,
                      },
                    }}
                  >
                    {step.number}
                  </motion.div>
                  <CardTitle className="text-xl">{step.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base leading-relaxed">
                    {step.description}
                  </CardDescription>
                </CardContent>

                {/* Arrow connector */}
                {index < steps.length - 1 && (
                  <motion.div
                    className="absolute -right-4 top-1/2 hidden -translate-y-1/2 lg:block"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.2 + 0.3 }}
                  >
                    <motion.div
                      animate={{ x: [0, 5, 0] }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                    >
                      <ArrowRight className="h-8 w-8 text-primary/50" />
                    </motion.div>
                  </motion.div>
                )}

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
