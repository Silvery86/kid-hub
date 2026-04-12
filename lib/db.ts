/**
 * Prisma Client Singleton
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

import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined }

export const db: PrismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db
}
