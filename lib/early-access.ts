/**
 * Early Access / Launch Offer Configuration
 *
 * When enabled, payments are disabled and all users receive full premium
 * access (monthly_pro limits). Flip to false when ready to enable real payments.
 * No automatic expiration or cron jobs.
 */

import type { PlanType } from './plan-limits'

const EARLY_ACCESS_ENV =
  process.env.NEXT_PUBLIC_EARLY_ACCESS === 'true' || process.env.EARLY_ACCESS === 'true'

/**
 * Whether the app is in "early access" mode (no real payments, full premium for everyone).
 * Use this to hide payment flows and show launch-offer CTAs.
 */
export function isEarlyAccess(): boolean {
  return EARLY_ACCESS_ENV
}

/**
 * Plan used for limit checks. In early access, everyone gets monthly_pro limits
 * regardless of stored subscription. When early access is off, use the actual plan.
 */
export function getEffectivePlan(storedPlan: string | null | undefined): PlanType {
  if (isEarlyAccess()) return 'monthly_pro'
  const plan = (storedPlan || 'free') as PlanType
  return ['free', 'monthly', 'monthly_pro', 'enterprise'].includes(plan) ? plan : 'free'
}
