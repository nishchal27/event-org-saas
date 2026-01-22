'use client'

import Image from 'next/image'

interface LexnifyIconProps {
  className?: string
  size?: number
}

export function LexnifyIcon({ className = '', size = 40 }: LexnifyIconProps) {
  // Use the calendar icon PNG - it matches your brand theme
  // For best quality, use icon-192.png which will scale well
  return (
    <Image
      src="/logo/icon-192.png"
      alt="Lexnify Calendar Icon"
      width={size}
      height={size}
      className={className}
      style={{
        width: size,
        height: size,
        objectFit: 'contain',
      }}
      priority
      unoptimized
    />
  )
}
