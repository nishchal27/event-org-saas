'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Check, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import Image from 'next/image'

const plans = [
  {
    name: 'Free',
    price: '₹0',
    period: '',
    description: 'Perfect for trying out EventOrg',
    features: [
      '2 events per month',
      'Manual WhatsApp messaging',
      '10 AI generations/month',
      'Event page & registration',
      'Event preview',
      'Basic analytics',
    ],
    cta: 'Get Started Free',
    popular: false,
    planId: 'free',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    name: 'Monthly',
    price: '₹249',
    period: '/month',
    description: 'For trainers, coaches & small groups',
    features: [
      '15 events per month',
      'Manual WhatsApp messaging',
      '60 AI generations/month',
      'Unique QR codes per attendee',
      'QR check-in system',
      'Reminder templates & checklist',
      'Event templates',
      'CSV export',
      'Advanced analytics',
      'Contact groups',
      'Email support',
    ],
    cta: 'Start Free Trial',
    popular: false,
    planId: 'monthly',
    gradient: 'from-purple-500 to-pink-500',
  },
  {
    name: 'Monthly Pro',
    price: '₹499',
    period: '/month',
    description: 'For growing instructors & organizers',
    features: [
      'Unlimited events',
      'Manual WhatsApp messaging',
      '200 AI generations/month',
      'Unique QR codes per attendee',
      'QR check-in system',
      'Full reminder system',
      'All premium features',
      'Priority support',
      'Early access to automation',
    ],
    cta: 'Start Free Trial',
    popular: true,
    planId: 'monthly_pro',
    gradient: 'from-primary via-purple-500 to-pink-500',
  },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
}

const cardVariants = {
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

export function Pricing() {
  return (
    <section id="pricing" className="relative overflow-hidden bg-gradient-to-br from-background via-primary/5 to-background dark:via-primary/15 py-16 sm:py-24 lg:py-32">
      {/* Animated Background */}
      <div className="absolute inset-0 -z-10">
        <motion.div
          className="absolute right-0 top-1/4 h-96 w-96 rounded-full bg-primary/20 blur-3xl dark:bg-primary/30"
          animate={{
            scale: [1, 1.3, 1],
            x: [0, 50, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-pink-500/20 blur-3xl dark:bg-pink-500/30"
          animate={{
            scale: [1, 1.2, 1],
            x: [0, -30, 0],
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
          className="mx-auto max-w-2xl text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            Simple, Transparent Pricing
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Choose the plan that fits your needs. Start free, upgrade anytime. No credit card required.
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3"
        >
          {plans.map((plan, index) => (
            <motion.div key={plan.planId} variants={cardVariants}>
              <Card
                className={`group relative overflow-hidden border-border/50 transition-all duration-300 ${
                  plan.popular
                    ? 'border-primary/50 bg-gradient-to-br from-primary/10 via-purple-500/5 to-pink-500/5 shadow-xl'
                    : 'bg-card hover:shadow-lg'
                }`}
              >
                {/* Gradient overlay */}
                {plan.popular && (
                  <motion.div
                    className={`absolute inset-0 bg-gradient-to-br ${plan.gradient} opacity-5`}
                    animate={{
                      opacity: [0.05, 0.1, 0.05],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  />
                )}

                {plan.popular && (
                  <motion.div
                    className="absolute -top-4 left-1/2 -translate-x-1/2"
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: index * 0.15 + 0.3, type: 'spring' as const }}
                  >
                    <span className="rounded-full bg-gradient-to-r from-primary via-purple-500 to-pink-500 px-4 py-1 text-sm font-semibold text-white shadow-lg">
                      Most Popular
                    </span>
                  </motion.div>
                )}

                <CardHeader>
                  <CardTitle className="text-2xl text-foreground">{plan.name}</CardTitle>
                  <CardDescription className="text-muted-foreground">{plan.description}</CardDescription>
                  <div className="mt-4">
                    <motion.span
                      className="text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: index * 0.15 + 0.5, type: 'spring' as const }}
                    >
                      {plan.price}
                    </motion.span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="mb-6 space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <motion.li
                        key={featureIndex}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{
                          delay: index * 0.15 + featureIndex * 0.05 + 0.6,
                        }}
                        className="flex items-start gap-2"
                      >
                        <motion.div
                          className="mt-0.5 flex-shrink-0"
                          whileHover={{ scale: 1.2, rotate: 360 }}
                          transition={{ duration: 0.3 }}
                        >
                          <Check className="h-5 w-5 text-green-500" />
                        </motion.div>
                        <span className="text-sm text-muted-foreground">{feature}</span>
                      </motion.li>
                    ))}
                  </ul>
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      asChild
                      className={`w-full ${
                        plan.popular
                          ? 'bg-gradient-to-r from-primary via-purple-600 to-pink-600 hover:from-primary/90 hover:via-purple-500 hover:to-pink-500 shadow-lg shadow-primary/50'
                          : ''
                      }`}
                      variant={plan.popular ? 'default' : 'outline'}
                    >
                      <Link href="/sign-up">{plan.cta}</Link>
                    </Button>
                  </motion.div>
                </CardContent>

                {/* Shine effect */}
                <motion.div
                  className="absolute inset-0 -z-10 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  initial={{ x: '-100%' }}
                  whileHover={{ x: '100%' }}
                  transition={{ duration: 0.6 }}
                />
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Security & Payment */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-12 flex flex-col items-center gap-4"
        >
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <motion.div
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.6 }}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-5 w-5 text-green-500"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </motion.div>
            <span>Secure payments powered by</span>
            <motion.div
              className="relative flex h-8 w-20 items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 border border-blue-500/50 px-2"
              whileHover={{ scale: 1.05 }}
            >
              <Image
                src="/icons/stripe.png"
                alt="Stripe"
                fill
                className="object-contain p-1"
                unoptimized
              />
            </motion.div>
          </div>
          <p className="text-sm text-muted-foreground">
            Need more?{' '}
            <Link href="#" className="text-primary hover:underline font-medium">
              Contact us for enterprise pricing
            </Link>
          </p>
        </motion.div>
      </div>
    </section>
  )
}
