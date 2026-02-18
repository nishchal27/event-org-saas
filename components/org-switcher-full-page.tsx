'use client'

import { useOrganization, useOrganizationList } from '@clerk/nextjs'
import { Building2, ChevronDown, Plus } from 'lucide-react'
import Link from 'next/link'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/**
 * Org switcher that forces full-page navigation after selection
 * so the server receives the updated session cookie (auth().orgId).
 */
export function OrgSwitcherFullPage() {
  const { organization, isLoaded: isOrgLoaded } = useOrganization()
  const { userMemberships, isLoaded: isListLoaded, setActive } = useOrganizationList({
    userMemberships: { infinite: true },
  })

  const orgs = userMemberships?.data ?? []
  const isLoading = !isListLoaded || !isOrgLoaded

  const handleSelectOrg = (clerkOrgId: string) => {
    setActive({ organization: clerkOrgId }).then(() => {
      window.location.href = '/dashboard'
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground">
        <Building2 className="h-4 w-4" />
        <span>Loading...</span>
      </div>
    )
  }

  const currentName = organization?.name ?? 'Select organization'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'w-full justify-between border-border font-normal',
            !organization && 'text-muted-foreground'
          )}
        >
          <span className="flex items-center gap-2 truncate">
            <Building2 className="h-4 w-4 shrink-0" />
            <span className="truncate">{currentName}</span>
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[var(--radix-dropdown-menu-trigger-width)]">
        {orgs.map(({ organization: org }) => (
          <DropdownMenuItem
            key={org.id}
            onClick={() => handleSelectOrg(org.id)}
            className="cursor-pointer"
          >
            {org.name}
          </DropdownMenuItem>
        ))}
        <DropdownMenuItem asChild>
          <Link href="/create-organization" className="cursor-pointer">
            <Plus className="mr-2 h-4 w-4" />
            Create organization
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
