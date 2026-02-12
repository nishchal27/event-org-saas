import crypto from 'crypto'

const PREFIX = 'scrypt'

export function hashVenuePin(pin: string): string {
  const normalized = pin.trim()
  const salt = crypto.randomBytes(16)
  const key = crypto.scryptSync(normalized, salt, 32)
  return `${PREFIX}$${salt.toString('base64')}$${key.toString('base64')}`
}

export function verifyVenuePin(pin: string, storedHash: string): boolean {
  try {
    const normalized = pin.trim()
    const [prefix, saltB64, keyB64] = storedHash.split('$')
    if (prefix !== PREFIX || !saltB64 || !keyB64) return false
    const salt = Buffer.from(saltB64, 'base64')
    const expected = Buffer.from(keyB64, 'base64')
    const actual = crypto.scryptSync(normalized, salt, expected.length)
    return crypto.timingSafeEqual(expected, actual)
  } catch {
    return false
  }
}

