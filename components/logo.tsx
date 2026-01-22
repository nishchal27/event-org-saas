'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface LogoProps {
  className?: string
  showText?: boolean
  href?: string
  size?: 'sm' | 'md' | 'lg'
}

export function Logo({ className = '', showText = false, href = '/', size = 'md' }: LogoProps) {
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

  // Responsive size mappings - larger on mobile, slightly larger on desktop
  // Mobile-first: start larger, then scale appropriately for larger screens
  const sizeClasses = {
    sm: 'h-8 w-auto sm:h-7 md:h-7 lg:h-8',
    md: 'h-10 w-auto sm:h-9 md:h-10 lg:h-11',
    lg: 'h-12 w-auto sm:h-11 md:h-12 lg:h-14',
  }

  // Use high-resolution intrinsic dimensions to prevent blur
  // These are the actual pixel dimensions - CSS will scale them down responsively
  const imageSize = {
    sm: { width: 200, height: 200 }, // High res for sharp rendering
    md: { width: 300, height: 300 }, // High res for sharp rendering
    lg: { width: 400, height: 400 }, // High res for sharp rendering
  }

  // Responsive sizes for Next.js Image optimization
  const sizes = {
    sm: '(max-width: 640px) 32px, (max-width: 1024px) 36px, 40px',
    md: '(max-width: 640px) 40px, (max-width: 768px) 48px, (max-width: 1024px) 56px, 64px',
    lg: '(max-width: 640px) 48px, (max-width: 768px) 64px, (max-width: 1024px) 80px, 96px',
  }

  if (!mounted) {
    // Return a placeholder during SSR
    return (
      <div className={`flex items-center ${className}`}>
        <div className={`${sizeClasses[size]} rounded-lg bg-primary/20`} />
        {showText && <span className="ml-3 text-xl font-semibold">EventOrg</span>}
      </div>
    )
  }

  const logoSrc = isDark 
    ? '/logo/for-dark-mode-logo.png'
    : '/logo/for-light-mode-logo.png'

  const content = (
    <div className={`flex items-center ${className}`}>
      <img
        src={logoSrc}
        alt="EventOrg Logo"
        className={`${sizeClasses[size]} object-contain`}
        style={{
          imageRendering: 'crisp-edges' as const,
          display: 'block',
        }}
        loading="eager"
        decoding="async"
      />
      {showText && <span className="ml-3 text-xl font-semibold">EventOrg</span>}
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
