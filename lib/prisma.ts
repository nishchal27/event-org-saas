import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

function isPreparedStatementMissingError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err)
  return msg.includes('prepared statement') && msg.includes('does not exist')
}

// PgBouncer/Supavisor can surface transient "prepared statement does not exist" errors under load.
// Retrying once usually succeeds on a fresh backend connection.
prisma.$use(async (params, next) => {
  try {
    return await next(params)
  } catch (err) {
    if (isPreparedStatementMissingError(err)) {
      return await next(params)
    }
    throw err
  }
})

// Always store in global to prevent multiple instances in serverless environments
if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = prisma
}
