'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { X, Download, Smartphone } from 'lucide-react'

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }

    // Check if running on iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
    setIsIOS(iOS)

    // Check if running on mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    )

    if (!isMobile) return

    // For iOS, show prompt after a delay (iOS doesn't support beforeinstallprompt)
    if (iOS) {
      const dismissed = localStorage.getItem('install-prompt-dismissed')
      const dismissedTime = dismissed ? parseInt(dismissed, 10) : 0
      const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
      
      if (!dismissed || dismissedTime < oneWeekAgo) {
        // Show iOS prompt after 3 seconds
        const timer = setTimeout(() => {
          setShowPrompt(true)
        }, 3000)
        return () => clearTimeout(timer)
      }
      return
    }

    // For Android, listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      
      // Check if user has dismissed the prompt before (stored in localStorage)
      const dismissed = localStorage.getItem('install-prompt-dismissed')
      const dismissedTime = dismissed ? parseInt(dismissed, 10) : 0
      const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
      
      // Show prompt if not dismissed or dismissed more than a week ago
      // Add a small delay for better UX
      if (!dismissed || dismissedTime < oneWeekAgo) {
        setTimeout(() => {
          setShowPrompt(true)
        }, 2000) // Show after 2 seconds
      }
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // Check if app was just installed
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true)
      setShowPrompt(false)
      localStorage.removeItem('install-prompt-dismissed')
    })

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    if (isIOS) {
      // For iOS, just dismiss - user needs to use Share button manually
      handleDismiss()
      return
    }

    if (!deferredPrompt) return

    // Show the install prompt
    deferredPrompt.prompt()

    // Wait for the user to respond
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      console.log('User accepted the install prompt')
    } else {
      console.log('User dismissed the install prompt')
    }

    setDeferredPrompt(null)
    setShowPrompt(false)
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    // Remember dismissal for 1 week
    localStorage.setItem('install-prompt-dismissed', Date.now().toString())
  }

  // For iOS, show prompt even without deferredPrompt
  if (isInstalled || !showPrompt || (!isIOS && !deferredPrompt)) {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96 animate-fade-in">
      <div className="bg-card border border-border rounded-lg shadow-lg p-4 flex items-start gap-3">
        <div className="flex-shrink-0 mt-1">
          <Smartphone className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm mb-1">Install Lexnify</h3>
          <p className="text-xs text-muted-foreground mb-3">
            {isIOS 
              ? 'Tap the Share button and select "Add to Home Screen" to install Lexnify for quick access to event management.'
              : 'Install Lexnify on your phone for quick access to event management. Get faster performance and work offline.'
            }
          </p>
          <div className="flex gap-2">
            {!isIOS ? (
              <>
                <Button
                  size="sm"
                  onClick={handleInstallClick}
                  className="text-xs h-8"
                >
                  <Download className="h-3 w-3 mr-1" />
                  Install App
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleDismiss}
                  className="text-xs h-8"
                >
                  Not Now
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                onClick={handleDismiss}
                className="text-xs h-8"
              >
                Got It
              </Button>
            )}
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
