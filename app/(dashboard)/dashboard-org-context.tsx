'use client'

import { createContext, useContext } from 'react'

export type CurrentOrg = { id: string; name: string }

type DashboardOrgContextValue = {
  hasOrganization: boolean
  currentOrg: CurrentOrg | null
}

const DashboardOrgContext = createContext<DashboardOrgContextValue>({
  hasOrganization: false,
  currentOrg: null,
})

export function useDashboardOrg() {
  return useContext(DashboardOrgContext)
}

export const DashboardOrgProvider = DashboardOrgContext.Provider
