'use client'

import { useEffect, useState, useId } from 'react'

interface LexnifyIconProps {
  className?: string
  size?: number
}

export function LexnifyIcon({ className = '', size = 40 }: LexnifyIconProps) {
  const [mounted, setMounted] = useState(false)
  const [isDark, setIsDark] = useState(false)
  const gradientId = useId()

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

  // Colors that adapt to theme
  const primaryColor = isDark ? '#a855f7' : '#6366f1' // Purple/Indigo
  const secondaryColor = isDark ? '#8b5cf6' : '#818cf8' // Lighter purple
  const accentColor = isDark ? '#ec4899' : '#f472b6' // Pink accent

  // Default colors for SSR
  const defaultPrimary = '#6366f1'
  const defaultSecondary = '#818cf8'
  const defaultAccent = '#f472b6'

  if (!mounted) {
    // Return default (light mode) version for SSR
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
      >
        <defs>
          <linearGradient id={`lexnifyGradient-${gradientId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={defaultPrimary} />
            <stop offset="100%" stopColor={defaultSecondary} />
          </linearGradient>
        </defs>
        <circle cx="32" cy="32" r="30" fill={`url(#lexnifyGradient-${gradientId})`} />
        <rect x="16" y="18" width="32" height="8" rx="2" fill="white" opacity="0.9" />
        <rect x="16" y="26" width="32" height="20" rx="2" fill="white" opacity="0.95" />
        <line x1="20" y1="32" x2="44" y2="32" stroke={defaultPrimary} strokeWidth="2" strokeLinecap="round" />
        <line x1="20" y1="38" x2="36" y2="38" stroke={defaultSecondary} strokeWidth="1.5" strokeLinecap="round" />
        <line x1="20" y1="42" x2="40" y2="42" stroke={defaultAccent} strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="48" cy="36" r="3" fill={defaultAccent} />
      </svg>
    )
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Background circle with gradient */}
      <defs>
        <linearGradient id={`lexnifyGradient-${gradientId}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={primaryColor} />
          <stop offset="100%" stopColor={secondaryColor} />
        </linearGradient>
      </defs>
      
      {/* Main circle background */}
      <circle cx="32" cy="32" r="30" fill={`url(#lexnifyGradient-${gradientId})`} />
      
      {/* Event/Calendar icon - stylized */}
      {/* Top section - represents event header */}
      <rect x="16" y="18" width="32" height="8" rx="2" fill="white" opacity="0.9" />
      
      {/* Main event card */}
      <rect x="16" y="26" width="32" height="20" rx="2" fill="white" opacity="0.95" />
      
      {/* Event lines/details */}
      <line x1="20" y1="32" x2="44" y2="32" stroke={primaryColor} strokeWidth="2" strokeLinecap="round" />
      <line x1="20" y1="38" x2="36" y2="38" stroke={secondaryColor} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="20" y1="42" x2="40" y2="42" stroke={accentColor} strokeWidth="1.5" strokeLinecap="round" />
      
      {/* Small accent dot */}
      <circle cx="48" cy="36" r="3" fill={accentColor} />
    </svg>
  )
}
