/**
 * Prisma seed script — creates the default app user (Khôi) and an initial
 * UserProgress record. Safe to re-run: uses upsert operations.
 *
 * Usage:
 *   pnpm prisma:seed
 */

import 'dotenv/config'
import bcrypt from 'bcryptjs'
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

/**
 * Daily homework labels keyed by subjectId — used to generate varied but realistic
 * homework entries for each school day.
 */
const HOMEWORK_LABELS: Record<string, string[]> = {
  math: [
    'Làm bài tập trang 12',
    'Luyện tính cộng trong phạm vi 20',
    'Hoàn thành bài tập về số đếm',
    'Làm bài tập trang 15',
    'Luyện tính trừ trong phạm vi 10',
  ],
  vietnamese: [
    'Đọc bài và trả lời câu hỏi',
    'Viết chính tả đoạn 1',
    'Luyện đọc bài mới',
    'Viết lại các từ khó',
    'Hoàn thành bài tập trong sách',
  ],
  english: [
    'Học thuộc 5 từ vựng mới',
    'Luyện đọc đoạn hội thoại',
    'Viết lại câu theo mẫu',
    'Nghe và lặp lại bài nghe',
    'Hoàn thành bài tập workbook trang 8',
  ],
  science: [
    'Đọc lại bài học về thực vật',
    'Vẽ sơ đồ vòng đời của cây',
    'Trả lời câu hỏi cuối bài',
  ],
  ethics: [
    'Kể lại câu chuyện đã học',
    'Vẽ tranh về chủ đề gia đình',
  ],
  art: ['Hoàn thành bức tranh còn lại', 'Tô màu theo hướng dẫn'],
  music: ['Luyện hát bài "Lớp chúng ta đoàn kết"', 'Tập gõ nhịp bài hát mới'],
  pe: ['Ôn luyện các động tác thể dục buổi sáng'],
  activities: ['Chuẩn bị bài thuyết trình nhỏ về sở thích'],
}

/** Pick a label for a given subject, cycling through available options by date index. */
function pickLabel(subjectId: string, index: number): string {
  const labels = HOMEWORK_LABELS[subjectId] ?? [`Hoàn thành bài tập môn ${subjectId}`]
  return labels[index % labels.length]!
}

/**
 * Generate DailyHomework seed entries for every school day (Mon–Fri) between
 * startDate and endDate (inclusive). Two subjects are assigned per day based on
 * that day's timetable subjects, to keep the volume realistic for a Grade-1 pupil.
 */
function buildDailyHomework(
  startDate: string,
  endDate: string,
  schedule: SeedPeriod[]
): Array<{ date: string; subjectId: string; label: string; points: number }> {
  const subjectsByDay: Record<string, string[]> = {}
  for (const p of schedule) {
    if (!subjectsByDay[p.day]) subjectsByDay[p.day] = []
    subjectsByDay[p.day]!.push(p.subjectId)
  }

  const dayNames: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
  const result: Array<{ date: string; subjectId: string; label: string; points: number }> = []

  const cursor = new Date(startDate)
  const end = new Date(endDate)
  let dayIndex = 0

  while (cursor <= end) {
    const jsDay = cursor.getDay() // 0=Sun, 1=Mon … 6=Sat
    if (jsDay >= 1 && jsDay <= 5) {
      const dayName = dayNames[jsDay - 1]!
      const subjects = subjectsByDay[dayName] ?? []
      // Assign the first two subjects on the day as homework
      const chosen = subjects.slice(0, 2)
      const dateStr = cursor.toISOString().split('T')[0]!
      for (const subjectId of chosen) {
        result.push({ date: dateStr, subjectId, label: pickLabel(subjectId, dayIndex), points: 10 })
        dayIndex++
      }
    }
    cursor.setDate(cursor.getDate() + 1)
  }

  return result
}

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
  console.warn('🌱 Seeding database...')

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

  console.warn(`✅ Default user seeded: ${user.name} (id: ${user.id})`)

  // Seed parent account credentials (safe to re-run: only sets if not already configured)
  const PARENT_EMAIL = 'giang8692@gmail.com'
  const PARENT_PASSWORD = 'Giang@123'
  const [authRow] = await db.$queryRaw<
    Array<{ parentEmail: string | null; parentPasswordHash: string | null }>
  >`SELECT "parentEmail", "parentPasswordHash" FROM users WHERE id = ${DEFAULT_USER_ID}`
  if (!authRow?.parentEmail || !authRow?.parentPasswordHash) {
    const passwordHash = await bcrypt.hash(PARENT_PASSWORD, 12)
    await db.$executeRaw`
      UPDATE users SET "parentEmail" = ${PARENT_EMAIL}, "parentPasswordHash" = ${passwordHash}
      WHERE id = ${DEFAULT_USER_ID}
    `
    console.warn(`✅ Parent account seeded: ${PARENT_EMAIL}`)
  } else {
    console.warn(`ℹ️  Parent account already configured: ${authRow.parentEmail} (skipped)`)
  }

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

  console.warn(`✅ Weekly schedule seeded: ${WEEKLY_SCHEDULE.length} periods across 5 days`)

  // Seed daily homework entries from today through end of term (20 Jun 2026)
  const TODAY = new Date().toISOString().split('T')[0]!
  const SEED_UNTIL = '2026-06-20'
  const homeworkEntries = buildDailyHomework(TODAY, SEED_UNTIL, WEEKLY_SCHEDULE)

  let created = 0
  for (const entry of homeworkEntries) {
    const exists = await db.dailyHomework.findFirst({
      where: { userId: DEFAULT_USER_ID, date: entry.date, subjectId: entry.subjectId },
    })
    if (!exists) {
      await db.dailyHomework.create({
        data: {
          userId: DEFAULT_USER_ID,
          date: entry.date,
          subjectId: entry.subjectId,
          label: entry.label,
          points: entry.points,
        },
      })
      created++
    }
  }

  console.warn(
    `✅ Daily homework seeded: ${created} new entries (${homeworkEntries.length} total generated through ${SEED_UNTIL})`
  )
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
