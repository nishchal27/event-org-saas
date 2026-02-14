'use client'

import { useEffect } from 'react'

/**
 * Prevents stale PWA clients from running mismatched HTML/JS after deploys.
 * If a new service worker takes control, reload once to ensure a consistent version.
 */
export function PwaReloadOnUpdate() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    let didReload = false
    const onControllerChange = () => {
      if (didReload) return
      didReload = true
      window.location.reload()
    }

    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange)
    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange)
    }
  }, [])

  return null
}

