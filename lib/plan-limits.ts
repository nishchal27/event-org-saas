/**
 * Plan Limits Configuration
 * 
 * This file centralizes all subscription plan limits.
 * Important limits can be overridden via environment variables.
 * 
 * Cost Drivers (what we limit):
 * - WhatsApp messages (real cost)
 * - AI generations (real cost)
 * 
 * Non-Cost Drivers (unlimited or very high):
 * - Events (CPU/DB - negligible)
 * - Contacts (storage - negligible, soft cap internally)
 * - Attendees (storage - negligible)
 */

export type PlanType = 'free' | 'monthly' | 'monthly_pro' | 'enterprise'

export interface PlanLimits {
  events: number // Unlimited = 999999
  contacts: number // Soft cap internally, not shown to users
  whatsapp: number // Real cost driver
  ai: number // Real cost driver
}

/**
 * Get plan limits with environment variable overrides
 * 
 * Environment variables (optional):
 * - PLAN_LIMIT_FREE_WHATSAPP
 * - PLAN_LIMIT_FREE_AI
 * - PLAN_LIMIT_MONTHLY_WHATSAPP
 * - PLAN_LIMIT_MONTHLY_AI
 * - PLAN_LIMIT_MONTHLY_PRO_WHATSAPP
 * - PLAN_LIMIT_MONTHLY_PRO_AI
 * - PLAN_LIMIT_CONTACTS_SOFT_CAP (internal soft cap for all plans)
 */
export function getPlanLimits(plan: PlanType): PlanLimits {
  // Internal soft cap for contacts (not user-facing, abuse protection)
  const contactsSoftCap = parseInt(process.env.PLAN_LIMIT_CONTACTS_SOFT_CAP || '10000', 10)

  const baseLimits: Record<PlanType, PlanLimits> = {
    free: {
      events: 2,
      contacts: contactsSoftCap, // Internal soft cap
      whatsapp: parseInt(process.env.PLAN_LIMIT_FREE_WHATSAPP || '60', 10),
      ai: parseInt(process.env.PLAN_LIMIT_FREE_AI || '10', 10),
    },
    monthly: {
      events: 15,
      contacts: contactsSoftCap, // Internal soft cap
      whatsapp: parseInt(process.env.PLAN_LIMIT_MONTHLY_WHATSAPP || '300', 10),
      ai: parseInt(process.env.PLAN_LIMIT_MONTHLY_AI || '60', 10),
    },
    monthly_pro: {
      events: 999999, // Unlimited
      contacts: contactsSoftCap, // Internal soft cap
      whatsapp: parseInt(process.env.PLAN_LIMIT_MONTHLY_PRO_WHATSAPP || '1000', 10),
      ai: parseInt(process.env.PLAN_LIMIT_MONTHLY_PRO_AI || '200', 10),
    },
    enterprise: {
      events: 999999,
      contacts: 999999,
      whatsapp: 999999,
      ai: 999999,
    },
  }

  return baseLimits[plan] || baseLimits.free
}

/**
 * Get all plan limits (for admin/debugging)
 */
export function getAllPlanLimits(): Record<PlanType, PlanLimits> {
  return {
    free: getPlanLimits('free'),
    monthly: getPlanLimits('monthly'),
    monthly_pro: getPlanLimits('monthly_pro'),
    enterprise: getPlanLimits('enterprise'),
  }
}

/**
 * Check if a plan has unlimited events
 */
export function hasUnlimitedEvents(plan: PlanType): boolean {
  return getPlanLimits(plan).events >= 999999
}
