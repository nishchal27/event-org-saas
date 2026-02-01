'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'

const STORAGE_KEY = 'early-access-banner-dismissed'

export function EarlyAccessBanner() {
  const [dismissed, setDismissed] = useState(true) // start hidden to avoid flash

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_EARLY_ACCESS !== 'true') {
      setDismissed(true)
      return
    }
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      setDismissed(stored === 'true')
    } catch {
      setDismissed(false)
    }
  }, [])

  const handleDismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, 'true')
    } catch {}
    setDismissed(true)
  }

  if (dismissed || process.env.NEXT_PUBLIC_EARLY_ACCESS !== 'true') return null

  return (
    <div
      role="banner"
      className="border-b border-border/40 bg-primary/5 text-center text-sm text-foreground/90"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-2 px-4 py-2 sm:px-6">
        <span>
          Launch access unlocked for early users — all premium features available for a limited time.
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
          aria-label="Dismiss banner"
          onClick={handleDismiss}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
