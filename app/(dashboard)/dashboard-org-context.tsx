'use client'

import { createContext, useContext } from 'react'

type DashboardOrgContextValue = { hasOrganization: boolean }

const DashboardOrgContext = createContext<DashboardOrgContextValue>({
  hasOrganization: false,
})

export function useDashboardOrg() {
  return useContext(DashboardOrgContext)
}

export const DashboardOrgProvider = DashboardOrgContext.Provider
