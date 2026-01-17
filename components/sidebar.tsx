'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Calendar, Users, Settings, Home, CreditCard, BarChart3 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { OrganizationSwitcher, UserButton, useOrganization } from '@clerk/nextjs'
import { ThemeToggle } from '@/components/theme-toggle'
import { trpc } from '@/lib/trpc-client'

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
  const { data: currentOrg } = trpc.organization.getCurrent.useQuery(undefined, {
    enabled: !!organization,
  })

  // Check if user is admin
  const isAdmin = currentOrg?.role === 'admin' || currentOrg?.role === 'org:admin'

  return (
    <aside className="hidden w-64 border-r border-border bg-card md:block">
      <div className="flex h-full flex-col">
        <div className="border-b border-border p-4 space-y-3">
          <h1 className="text-xl font-bold text-foreground">EventOrg</h1>
          <OrganizationSwitcher
            hidePersonal
            afterSelectOrganizationUrl="/dashboard"
            afterCreateOrganizationUrl="/dashboard"
          />
        </div>
        <nav className="flex-1 space-y-1 p-4">
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
    </aside>
  )
}
