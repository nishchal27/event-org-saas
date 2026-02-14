/**
 * In-memory rate limiter for public tRPC procedures.
 * Use a single key (e.g. IP) and a fixed window (e.g. 1 minute).
 * For serverless/multi-instance, replace with Upstash Redis or similar.
 */

const WINDOW_MS = 60 * 1000 // 1 minute
const DEFAULT_LIMIT = 60 // requests per window for public read-like procedures
const WRITE_LIMIT = 20 // stricter for register/check-in

type Entry = { count: number; windowStart: number }

const readStore = new Map<string, Entry>()
const writeStore = new Map<string, Entry>()

function check(
  store: Map<string, Entry>,
  key: string,
  limit: number,
  windowMs: number = WINDOW_MS
): { allowed: boolean; remaining: number } {
  const now = Date.now()
  const entry = store.get(key)
  if (!entry) {
    store.set(key, { count: 1, windowStart: now })
    return { allowed: true, remaining: limit - 1 }
  }
  if (now - entry.windowStart >= windowMs) {
    store.set(key, { count: 1, windowStart: now })
    return { allowed: true, remaining: limit - 1 }
  }
  entry.count += 1
  const allowed = entry.count <= limit
  return { allowed, remaining: Math.max(0, limit - entry.count) }
}

/** Public procedures that are write-like (register, check-in). Stricter limit. */
export const PUBLIC_WRITE_PATHS = new Set([
  'attendee.register',
  'attendee.checkInByQR',
  'attendee.selfCheckIn',
])

/** Public procedures that are read-like. Higher limit. */
export const PUBLIC_READ_PATHS = new Set([
  'attendee.getCheckInContext',
  'event.getBySlug',
])

export function checkPublicRateLimit(identifier: string, paths: string[]): { allowed: boolean } {
  const hasWrite = paths.some((p) => PUBLIC_WRITE_PATHS.has(p))
  const hasRead = paths.some((p) => PUBLIC_READ_PATHS.has(p))
  if (!hasWrite && !hasRead) return { allowed: true }

  if (hasWrite) {
    const { allowed } = check(writeStore, identifier, WRITE_LIMIT)
    if (!allowed) return { allowed: false }
  }
  if (hasRead) {
    const { allowed } = check(readStore, identifier, DEFAULT_LIMIT)
    if (!allowed) return { allowed: false }
  }
  return { allowed: true }
}

export function getClientIdentifier(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim()
    if (first) return first
  }
  const realIp = req.headers.get('x-real-ip')
  if (realIp) return realIp
  return 'unknown'
}
