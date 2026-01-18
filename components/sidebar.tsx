'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Calendar, Users, Settings, Home, CreditCard, BarChart3, Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { OrganizationSwitcher, UserButton, useOrganization, useUser } from '@clerk/nextjs'
import { ThemeToggle } from '@/components/theme-toggle'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/events', label: 'Events', icon: Calendar },
  { href: '/events/templates', label: 'Templates', icon: Calendar },
  { href: '/contacts', label: 'Contacts', icon: Users },
  { href: '/contacts/groups', label: 'Groups', icon: Users },
  { href: '/pricing', label: 'Pricing', icon: CreditCard },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const { organization } = useOrganization()
  const { user } = useUser()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Check if user is admin by email
  const adminEmailsEnv = process.env.NEXT_PUBLIC_ADMIN_EMAILS || ''
  const adminEmails = adminEmailsEnv
    .split(',')
    .map(email => email.trim().toLowerCase())
    .filter(email => email.length > 0)
  const userEmail = user?.emailAddresses?.[0]?.emailAddress?.toLowerCase().trim() || ''
  const isAdmin = adminEmails.length > 0 && userEmail && adminEmails.includes(userEmail)

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isMobileMenuOpen])

  const sidebarContent = (
      <div className="flex h-full flex-col">
        <div className="border-b border-border p-4 space-y-3">
          <h1 className="text-xl font-bold text-foreground">EventOrg</h1>
          <OrganizationSwitcher
            hidePersonal
            afterSelectOrganizationUrl="/dashboard"
            afterCreateOrganizationUrl="/dashboard"
          />
        </div>
      <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            )
          })}
          {/* Admin-only: Analytics Dashboard */}
          {isAdmin && (
            <Link
              href="/analytics"
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                pathname === '/analytics' || pathname?.startsWith('/analytics/')
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <BarChart3 className="h-5 w-5" />
              Analytics
            </Link>
          )}
        </nav>
        <div className="border-t border-border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Theme</span>
            <ThemeToggle />
          </div>
          <UserButton />
        </div>
      </div>
  )

  return (
    <>
      {/* Mobile Hamburger Button */}
      <button
        onClick={() => setIsMobileMenuOpen(true)}
        className="fixed top-4 left-4 z-50 md:hidden p-2 rounded-md bg-card border border-border shadow-lg"
        aria-label="Open menu"
      >
        <Menu className="h-6 w-6" />
      </button>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full w-64 border-r border-border bg-card transform transition-transform duration-300 ease-in-out md:hidden',
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-border p-4">
            <h1 className="text-xl font-bold text-foreground">EventOrg</h1>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(false)}
              className="md:hidden"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          {sidebarContent}
        </div>
      </aside>

      {/* Desktop Sidebar */}
      <aside className="hidden w-64 border-r border-border bg-card md:block">
        {sidebarContent}
    </aside>
    </>
  )
}
