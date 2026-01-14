'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'

interface TechLogosProps {
  variant?: 'default' | 'minimal' | 'feature'
  showLabels?: boolean
}

const techStack = [
  { name: 'WhatsApp', icon: '/icons/whatsapp.png', color: 'from-green-500 to-emerald-600' },
  { name: 'OpenAI', icon: '/icons/chat-gpt.png', color: 'from-white to-gray-100', textColor: 'text-gray-900' },
  { name: 'Stripe', icon: '/icons/stripe.png', color: 'from-blue-500 to-indigo-600', textColor: 'text-white' },
  { name: 'Meta', icon: '/icons/meta.png', color: 'from-blue-600 to-cyan-500' },
  { name: 'Secure', icon: '/icons/encrypted.png', color: 'from-yellow-500 to-orange-600' },
]

export function TechLogos({ variant = 'default', showLabels = false }: TechLogosProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

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
    hidden: { opacity: 0, y: 20, scale: 0.8 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: 'spring' as const,
        stiffness: 100,
        damping: 10,
      },
    },
  }

  if (variant === 'minimal') {
    return (
      <motion.div
        className="flex items-center gap-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {techStack.map((tech, index) => (
          <motion.div
            key={tech.name}
            variants={itemVariants}
            whileHover={{ scale: 1.2, rotate: 5 }}
            whileTap={{ scale: 0.9 }}
            className="relative h-8 w-8 opacity-60 transition-opacity hover:opacity-100"
          >
            <Image
              src={tech.icon}
              alt={tech.name}
              fill
              className="object-contain"
              unoptimized
            />
          </motion.div>
        ))}
      </motion.div>
    )
  }

  if (variant === 'feature') {
    return (
      <motion.div
        className="flex flex-wrap items-center justify-center gap-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {techStack.map((tech, index) => (
          <motion.div
            key={tech.name}
            variants={itemVariants}
            whileHover={{ scale: 1.1, y: -5 }}
            className="flex flex-col items-center gap-2"
          >
            <motion.div
              className={`relative h-12 w-12 rounded-xl bg-gradient-to-br ${tech.color} ${tech.name === 'OpenAI' ? 'border border-gray-200' : ''} p-2 shadow-lg`}
              whileHover={{ rotate: [0, -10, 10, -10, 0] }}
              transition={{ duration: 0.5 }}
            >
              <Image
                src={tech.icon}
                alt={tech.name}
                fill
                className="object-contain p-1"
                unoptimized
              />
            </motion.div>
            {showLabels && (
              <span className="text-xs font-medium text-muted-foreground">{tech.name}</span>
            )}
          </motion.div>
        ))}
      </motion.div>
    )
  }

  return (
    <motion.div
      className="flex flex-wrap items-center justify-center gap-8 sm:gap-12"
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-100px' }}
    >
      {techStack.map((tech, index) => (
        <motion.div
          key={tech.name}
          variants={itemVariants}
          whileHover={{ scale: 1.1, y: -8 }}
          className="group flex flex-col items-center gap-3"
        >
          <motion.div
            className={`relative h-20 w-20 rounded-2xl bg-gradient-to-br ${tech.color} ${tech.name === 'OpenAI' ? 'border border-gray-200' : ''} p-4 shadow-xl transition-all duration-300 group-hover:shadow-2xl`}
            whileHover={{ rotate: [0, -5, 5, -5, 0] }}
            transition={{ duration: 0.5 }}
          >
            <Image
              src={tech.icon}
              alt={tech.name}
              fill
              className="object-contain p-2"
              unoptimized
            />
            <motion.div
              className="absolute inset-0 rounded-2xl bg-white/20 opacity-0 group-hover:opacity-100"
              transition={{ duration: 0.3 }}
            />
          </motion.div>
          {showLabels && (
            <motion.span
              className="text-sm font-semibold text-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.1 + 0.3 }}
            >
              {tech.name}
            </motion.span>
          )}
        </motion.div>
      ))}
    </motion.div>
  )
}
