import { redirect } from 'next/navigation'

/**
 * Single-org app: no create-organization flow. Redirect to dashboard.
 * Workspace is created on first dashboard access via getOrCreateUserAndOrg.
 */
export default function CreateOrganizationPage() {
  redirect('/dashboard')
}
