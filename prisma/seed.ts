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

type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday'

interface SeedPeriod {
  day: DayOfWeek
  periodNumber: number
  subjectId: string
  startTime: string
  endTime: string
}

// Grade 1 Vietnamese timetable — 4 × 40-min periods, 07:30–10:50
const WEEKLY_SCHEDULE: SeedPeriod[] = [
  // Thứ Hai — Monday
  { day: 'monday', periodNumber: 1, subjectId: 'vietnamese', startTime: '07:30', endTime: '08:10' },
  { day: 'monday', periodNumber: 2, subjectId: 'math',       startTime: '08:20', endTime: '09:00' },
  { day: 'monday', periodNumber: 3, subjectId: 'english',    startTime: '09:20', endTime: '10:00' },
  { day: 'monday', periodNumber: 4, subjectId: 'art',        startTime: '10:10', endTime: '10:50' },
  // Thứ Ba — Tuesday
  { day: 'tuesday', periodNumber: 1, subjectId: 'math',       startTime: '07:30', endTime: '08:10' },
  { day: 'tuesday', periodNumber: 2, subjectId: 'vietnamese', startTime: '08:20', endTime: '09:00' },
  { day: 'tuesday', periodNumber: 3, subjectId: 'music',      startTime: '09:20', endTime: '10:00' },
  { day: 'tuesday', periodNumber: 4, subjectId: 'pe',         startTime: '10:10', endTime: '10:50' },
  // Thứ Tư — Wednesday
  { day: 'wednesday', periodNumber: 1, subjectId: 'vietnamese', startTime: '07:30', endTime: '08:10' },
  { day: 'wednesday', periodNumber: 2, subjectId: 'english',    startTime: '08:20', endTime: '09:00' },
  { day: 'wednesday', periodNumber: 3, subjectId: 'math',       startTime: '09:20', endTime: '10:00' },
  { day: 'wednesday', periodNumber: 4, subjectId: 'ethics',     startTime: '10:10', endTime: '10:50' },
  // Thứ Năm — Thursday
  { day: 'thursday', periodNumber: 1, subjectId: 'math',       startTime: '07:30', endTime: '08:10' },
  { day: 'thursday', periodNumber: 2, subjectId: 'vietnamese', startTime: '08:20', endTime: '09:00' },
  { day: 'thursday', periodNumber: 3, subjectId: 'science',    startTime: '09:20', endTime: '10:00' },
  { day: 'thursday', periodNumber: 4, subjectId: 'art',        startTime: '10:10', endTime: '10:50' },
  // Thứ Sáu — Friday
  { day: 'friday', periodNumber: 1, subjectId: 'vietnamese',  startTime: '07:30', endTime: '08:10' },
  { day: 'friday', periodNumber: 2, subjectId: 'math',        startTime: '08:20', endTime: '09:00' },
  { day: 'friday', periodNumber: 3, subjectId: 'music',       startTime: '09:20', endTime: '10:00' },
  { day: 'friday', periodNumber: 4, subjectId: 'activities',  startTime: '10:10', endTime: '10:50' },
]

/** Mirrors validatePeriodOverlap from schedule.service.ts — exercises the same business rule. */
function assertNoOverlaps(periods: SeedPeriod[]): void {
  const byDay = new Map<DayOfWeek, SeedPeriod[]>()
  for (const p of periods) {
    if (!byDay.has(p.day)) byDay.set(p.day, [])
    byDay.get(p.day)!.push(p)
  }
  for (const [day, slots] of byDay) {
    for (const proposed of slots) {
      const conflict = slots.find(
        (p) =>
          p.periodNumber !== proposed.periodNumber &&
          proposed.startTime < p.endTime &&
          proposed.endTime > p.startTime
      )
      if (conflict) {
        throw new Error(
          `Overlap in seed data: ${day} period ${proposed.periodNumber} (${proposed.startTime}–${proposed.endTime}) conflicts with period ${conflict.periodNumber}`
        )
      }
    }
  }
}

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
      lastActiveDate: new Date().toISOString().split('T')[0]!,
    },
    update: {},
  })

  console.log(`✅ Default user seeded: ${user.name} (id: ${user.id})`)

  // Validate schedule data before touching the DB
  assertNoOverlaps(WEEKLY_SCHEDULE)

  // Upsert all periods — safe to re-run
  for (const period of WEEKLY_SCHEDULE) {
    await db.classPeriod.upsert({
      where: {
        userId_day_periodNumber: {
          userId: DEFAULT_USER_ID,
          day: period.day,
          periodNumber: period.periodNumber,
        },
      },
      create: {
        userId: DEFAULT_USER_ID,
        day: period.day,
        periodNumber: period.periodNumber,
        subjectId: period.subjectId,
        startTime: period.startTime,
        endTime: period.endTime,
      },
      update: {
        subjectId: period.subjectId,
        startTime: period.startTime,
        endTime: period.endTime,
      },
    })
  }

  console.log(`✅ Weekly schedule seeded: ${WEEKLY_SCHEDULE.length} periods across 5 days`)
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
