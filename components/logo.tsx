'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { LexnifyIcon } from './lexnify-icon'

interface LogoProps {
  className?: string
  showText?: boolean
  href?: string
  size?: 'sm' | 'md' | 'lg'
}

export function Logo({ className = '', showText = true, href = '/', size = 'md' }: LogoProps) {
  const [mounted, setMounted] = useState(false)
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    setMounted(true)
    const checkTheme = () => {
      const root = document.documentElement
      setIsDark(root.classList.contains('dark'))
    }
    
    checkTheme()
    
    // Watch for theme changes
    const observer = new MutationObserver(checkTheme)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })
    
    return () => observer.disconnect()
  }, [])

  // Responsive size mappings for icon
  const iconSizes = {
    sm: 32,
    md: 40,
    lg: 48,
  }

  // Responsive text sizes
  const textSizeClasses = {
    sm: 'text-base sm:text-lg',
    md: 'text-lg sm:text-xl',
    lg: 'text-xl sm:text-2xl',
  }

  // Icon size based on prop
  const iconSize = iconSizes[size]

  if (!mounted) {
    // Return a placeholder during SSR
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div 
          className="rounded-lg bg-primary/20"
          style={{ width: iconSize, height: iconSize }}
        />
        {showText && <span className={`${textSizeClasses[size]} font-bold tracking-wider`}>LEXNIFY</span>}
      </div>
    )
  }

  const content = (
    <div className={`flex items-center gap-2 ${className}`}>
      <LexnifyIcon size={iconSize} className="flex-shrink-0" />
      {showText && (
        <span 
          className={`${textSizeClasses[size]} font-bold tracking-wider text-foreground`}
          style={{ letterSpacing: '0.1em' }}
        >
          LEXNIFY
        </span>
      )}
    </div>
  )

  if (href) {
    return (
      <Link href={href} className="inline-block">
        {content}
      </Link>
    )
  }

  return content
}
