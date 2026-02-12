import { parsePhoneNumberFromString } from 'libphonenumber-js'

export type NormalizedPhone = {
  raw: string
  digits: string
  e164OrNull: string | null
  canonicalForLookup: string
  inferredRegion: 'IN' | 'UNKNOWN'
}

function stripToDigits(value: string): string {
  return (value || '').replace(/[^\d]/g, '')
}

/**
 * Mixed strategy (India-default + international support):
 * - Accept messy input: spaces, dashes, parentheses.
 * - If it starts with '+', try full international parse.
 * - Else if it looks like an Indian mobile (10 digits), assume IN.
 * - Else if it starts with '91' and is 12 digits, treat as IN.
 * - Fallback: keep digits-only as canonical for lookup (still better than raw).
 */
export function normalizePhoneMixed(input: string): NormalizedPhone {
  const raw = (input || '').trim()
  const digits = stripToDigits(raw)

  // Explicit international form
  if (raw.startsWith('+')) {
    const parsed = parsePhoneNumberFromString(raw)
    if (parsed && parsed.isValid()) {
      return {
        raw,
        digits,
        e164OrNull: parsed.number,
        canonicalForLookup: parsed.number,
        inferredRegion: parsed.country === 'IN' ? 'IN' : 'UNKNOWN',
      }
    }
  }

  // India-friendly forms
  if (digits.length === 10) {
    const parsed = parsePhoneNumberFromString(digits, 'IN')
    if (parsed && parsed.isValid()) {
      return {
        raw,
        digits,
        e164OrNull: parsed.number,
        canonicalForLookup: parsed.number,
        inferredRegion: 'IN',
      }
    }
    // If lib parsing fails, still canonicalize as +91 + digits
    return {
      raw,
      digits,
      e164OrNull: `+91${digits}`,
      canonicalForLookup: `+91${digits}`,
      inferredRegion: 'IN',
    }
  }

  if (digits.length === 12 && digits.startsWith('91')) {
    const national10 = digits.slice(2)
    const parsed = parsePhoneNumberFromString(national10, 'IN')
    if (parsed && parsed.isValid()) {
      return {
        raw,
        digits,
        e164OrNull: parsed.number,
        canonicalForLookup: parsed.number,
        inferredRegion: 'IN',
      }
    }
    return {
      raw,
      digits,
      e164OrNull: `+${digits}`,
      canonicalForLookup: `+${digits}`,
      inferredRegion: 'IN',
    }
  }

  // Unknown region / partial number: best effort digits-only canonicalization
  return {
    raw,
    digits,
    e164OrNull: null,
    canonicalForLookup: digits || raw,
    inferredRegion: 'UNKNOWN',
  }
}

