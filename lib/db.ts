/**
 * Prisma Client singleton using the @prisma/adapter-pg driver adapter.
 *
 * Prevents multiple PrismaClient instances in Next.js development
 * (hot-reload creates new module instances, exhausting DB connections).
 *
 * In production (Cloud Run), each container instance creates exactly one client.
 *
 * Usage:
 *   import { db } from '@/lib/db';
 *   const users = await db.user.findMany();
 */

import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined }

function createPrismaClient(): PrismaClient {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) throw new Error('DATABASE_URL environment variable is not set.')
  const adapter = new PrismaPg({ connectionString: databaseUrl })
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })
}

export const db: PrismaClient = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db
}
