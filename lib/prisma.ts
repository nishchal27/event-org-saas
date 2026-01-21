import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    // Disable prepared statements for transaction pooler compatibility
    // This is handled via ?pgbouncer=true in DATABASE_URL, but we ensure it here too
  })

// Always store in global to prevent multiple instances in serverless environments
if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = prisma
}
