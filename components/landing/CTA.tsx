'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, Sparkles } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { TechLogos } from '@/components/landing/TechLogos'
import { motion } from 'framer-motion'

export function CTA() {
  return (
    <section className="relative overflow-hidden py-16 sm:py-24 lg:py-32">
      {/* Animated Background */}
      <div className="absolute inset-0 -z-10">
        <motion.div
          className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-primary/20 via-purple-500/20 to-pink-500/20 blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 360],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <Card className="relative overflow-hidden border-primary/30 bg-gradient-to-br from-primary/10 via-purple-500/10 to-pink-500/10 backdrop-blur-sm">
            {/* Animated gradient overlay */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-primary/10 via-purple-500/10 to-pink-500/10"
              animate={{
                opacity: [0.1, 0.2, 0.1],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />

            <CardContent className="relative p-8 sm:p-12 lg:p-16">
              <div className="mx-auto max-w-3xl text-center">
                <motion.h2
                  className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                >
                  Ready to Transform Your Event Management?
                </motion.h2>
                <motion.p
                  className="mt-4 text-lg text-muted-foreground sm:text-xl"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                >
                  Join thousands of NGOs and communities using EventOrg to create amazing events and
                  keep attendees informed. Start your free trial today—no credit card required.
                </motion.p>
                <motion.div
                  className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      size="lg"
                      asChild
                      className="group bg-gradient-to-r from-primary via-purple-600 to-pink-600 text-base shadow-xl shadow-primary/50 hover:shadow-2xl hover:shadow-primary/60"
                    >
                      <Link href="/sign-up">
                        Start Free Trial
                        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </Link>
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button size="lg" variant="outline" asChild className="text-base">
                      <Link href="#features">Learn More</Link>
                    </Button>
                  </motion.div>
                </motion.div>
                <motion.div
                  className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                >
                  {[
                    'No credit card required',
                    'Free forever plan',
                    'Setup in 5 minutes',
                  ].map((text, index) => (
                    <motion.div
                      key={text}
                      initial={{ opacity: 0, scale: 0.8 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: 0.4 + index * 0.1 }}
                      whileHover={{ scale: 1.1 }}
                      className="flex items-center gap-2"
                    >
                      <motion.div
                        className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-emerald-600"
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.5 }}
                      >
                        <svg
                          className="h-4 w-4 text-white"
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

                {/* Trust Badge */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                  className="mt-8 pt-8 border-t border-border/40"
                >
                  <motion.p
                    className="mb-4 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground"
                    whileHover={{ scale: 1.05 }}
                  >
                    Powered by Leading Platforms
                  </motion.p>
                  <TechLogos variant="feature" />
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  )
}
