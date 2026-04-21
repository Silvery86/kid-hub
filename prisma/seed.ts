/**
 * Prisma seed script — creates the default app user (Khôi) and an initial
 * UserProgress record. Safe to re-run: uses upsert operations.
 *
 * Usage:
 *   pnpm prisma:seed
 */

import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

const DEFAULT_USER_ID = 'khoi-default-user'

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) throw new Error('DATABASE_URL is not set')
const adapter = new PrismaPg({ connectionString: databaseUrl })
const db = new PrismaClient({ adapter, log: ['error'] })

async function main() {
  console.log('🌱 Seeding database...')

  const user = await db.user.upsert({
    where: { id: DEFAULT_USER_ID },
    create: {
      id: DEFAULT_USER_ID,
      name: 'Khôi',
      gradeLevel: 1,
    },
    update: {},
  })

  await db.userProgress.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      totalPoints: 0,
      currentStreak: 0,
      lastActiveDate: new Date().toISOString().split('T')[0],
    },
    update: {},
  })

  console.log(`✅ Default user seeded: ${user.name} (id: ${user.id})`)
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
