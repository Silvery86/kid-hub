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
import {
  VN_HOLIDAYS_2026_2027,
  addWeeks,
  generateSlots,
  isDayOff,
  presetByKey,
  weekStartOf,
  type SchoolBreak,
} from '@kid-hub/shared'

const DEFAULT_USER_ID = 'khoi-default-user'
// Derived exactly as the 20260829 split migration derives it.
const DEFAULT_PARENT_ID = `parent-${DEFAULT_USER_ID}`

type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday'

const SCHOOL_DAY_NAMES: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']

/**
 * Khai giảng — 5 September 2026, a Saturday, as Vietnamese schools always
 * open on 5/9 whatever weekday it falls on. Lessons proper start the Monday
 * after, which is the week the timetable below is written into.
 */
const SCHOOL_YEAR_START = '2026-09-05'
const FIRST_TEACHING_WEEK = weekStartOf(SCHOOL_YEAR_START) === SCHOOL_YEAR_START
  ? SCHOOL_YEAR_START
  : addWeeks(weekStartOf(SCHOOL_YEAR_START), 1)

/**
 * Lớp 1A1, NH 2026–2027 — the real printed sheet, read off row by row.
 * docs/SCHEDULE_PARENT_IMP.md §2.1. Columns are Thứ Hai → Thứ Sáu.
 *
 * The sheet prints no clock times, which is the whole reason the bell schedule
 * exists: the times below are DERIVED from the school's published rules rather
 * than typed here, so seed and app cannot disagree about when tiết 5 starts.
 */
const SHEET: [string, string | undefined][][] = [
  [['experience', 'Chào cờ'], ['vietnamese', 'Học vần'], ['vietnamese', 'Học vần'], ['vietnamese', 'Học vần'], ['english', undefined]],
  [['music', undefined], ['english', undefined], ['vietnamese', 'Học vần'], ['vietnamese', 'Học vần'], ['vietnamese', 'Ôn tập']],
  [['vietnamese', 'Học vần'], ['vietnamese', 'Học vần'], ['vietnamese', 'Tập viết'], ['music', undefined], ['vietnamese', 'Ôn tập']],
  [['vietnamese', 'Học vần'], ['art', undefined], ['math', undefined], ['math', undefined], ['vietnamese', 'Tập viết']],
  [['math', undefined], ['science', undefined], ['pe', undefined], ['science', undefined], ['pe', undefined]],
  [['ethics', undefined], ['pe', undefined], ['library', undefined], ['experience', undefined], ['integrated', undefined]],
  [['life-skills', undefined], ['life-skills', undefined], ['art', undefined], ['study-guide', undefined], ['experience', undefined]],
]

/** The school's own bell rules — 08:10 start, 35' tiết, 5' between (§2.2). */
const BELL_PRESET = presetByKey('primary-35')!
const BELL_SLOTS = generateSlots(BELL_PRESET.rules)

interface SeedPeriod {
  day: DayOfWeek
  periodNumber: number
  subjectId: string
  note?: string
  startTime: string
  endTime: string
}

/** Resolves every printed cell against the generated timeline. */
const WEEKLY_SCHEDULE: SeedPeriod[] = SHEET.flatMap((row, rowIndex) =>
  row.flatMap(([subjectId, note], dayIndex) => {
    const day = SCHOOL_DAY_NAMES[dayIndex]!
    const periodNumber = rowIndex + 1
    const slot = BELL_SLOTS.find(
      (s) => s.kind === 'PERIOD' && s.periodNumber === periodNumber && s.days.includes(day)
    )
    if (!slot) return []
    return [{
      day,
      periodNumber,
      subjectId,
      ...(note ? { note } : {}),
      startTime: slot.startTime,
      endTime: slot.endTime,
    }]
  })
)

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

  const student = await db.student.upsert({
    where: { id: DEFAULT_USER_ID },
    create: {
      id: DEFAULT_USER_ID,
      name: 'Khôi',
      gradeLevel: 1,
    },
    update: {},
  })

  await db.userProgress.upsert({
    where: { studentId: student.id },
    create: {
      studentId: student.id,
      totalPoints: 0,
      currentStreak: 0,
      lastActiveDate: new Date().toISOString().split('T')[0]!,
    },
    update: {},
  })

  console.warn(`✅ Default student seeded: ${student.name} (id: ${student.id})`)

  // Seed the parent account (safe to re-run: only creates if not already configured).
  // The founding parent is ACTIVE and admin — somebody has to be able to approve the
  // first applicant, and the approval flow has no other way to bootstrap.
  const PARENT_EMAIL = 'giang8692@gmail.com'
  const PARENT_PASSWORD = 'Giang@123'
  const existingParent = await db.parent.findUnique({ where: { id: DEFAULT_PARENT_ID } })
  if (!existingParent) {
    const passwordHash = await bcrypt.hash(PARENT_PASSWORD, 12)
    await db.parent.create({
      data: {
        id: DEFAULT_PARENT_ID,
        email: PARENT_EMAIL,
        passwordHash,
        status: 'ACTIVE',
        isAdmin: true,
        approvedAt: new Date(),
      },
    })
    console.warn(`✅ Parent account seeded: ${PARENT_EMAIL}`)
  } else {
    console.warn(`ℹ️  Parent account already configured: ${existingParent.email} (skipped)`)
  }

  // The join row is the authorization edge — without it the parent sees nothing.
  await db.parentStudent.upsert({
    where: {
      parentId_studentId: { parentId: DEFAULT_PARENT_ID, studentId: DEFAULT_USER_ID },
    },
    create: { parentId: DEFAULT_PARENT_ID, studentId: DEFAULT_USER_ID, role: 'OWNER' },
    update: {},
  })
  console.warn('✅ Parent linked to student')

  // Validate schedule data before touching the DB
  assertNoOverlaps(WEEKLY_SCHEDULE)

  // The class identity printed at the head of the sheet.
  await db.student.update({
    where: { id: DEFAULT_USER_ID },
    data: {
      className: '1A1',
      teacherName: 'Nguyễn Thị Kim Chung',
      teacherPhone: '0375197591',
    },
  })
  console.warn('✅ Class identity seeded: 1A1')

  // The bell schedule has to exist before the timetable means anything — the
  // week grid reads its period times, and without it the parent screen shows
  // "chưa có khung giờ" over a fully populated week.
  const bellFlat = {
    presetKey: BELL_PRESET.key,
    periodMinutes: BELL_PRESET.rules.periodMinutes,
    transitionMinutes: BELL_PRESET.rules.transitionMinutes,
    morningStart: BELL_PRESET.rules.morning.start,
    morningPeriods: BELL_PRESET.rules.morning.periods,
    morningRecessAfter: BELL_PRESET.rules.morning.recess?.afterPeriod ?? null,
    morningRecessStart: BELL_PRESET.rules.morning.recess?.start ?? null,
    morningRecessMinutes: BELL_PRESET.rules.morning.recess?.minutes ?? null,
    afternoonStart: BELL_PRESET.rules.afternoon?.start ?? null,
    afternoonPeriods: BELL_PRESET.rules.afternoon?.periods ?? 0,
    afternoonRecessAfter: BELL_PRESET.rules.afternoon?.recess?.afterPeriod ?? null,
    afternoonRecessStart: BELL_PRESET.rules.afternoon?.recess?.start ?? null,
    afternoonRecessMinutes: BELL_PRESET.rules.afternoon?.recess?.minutes ?? null,
  }
  const bellSchedule = await db.bellSchedule.upsert({
    where: { studentId: DEFAULT_USER_ID },
    create: { studentId: DEFAULT_USER_ID, ...bellFlat },
    update: bellFlat,
  })
  await db.bellSlot.deleteMany({ where: { scheduleId: bellSchedule.id, isGenerated: true } })
  await db.bellSlot.createMany({
    data: BELL_SLOTS.map((slot) => ({
      scheduleId: bellSchedule.id,
      kind: slot.kind,
      periodNumber: slot.periodNumber ?? null,
      label: slot.label ?? null,
      startTime: slot.startTime,
      endTime: slot.endTime,
      days: slot.days,
      isGenerated: slot.isGenerated,
    })),
  })
  console.warn(`✅ Bell schedule seeded: ${BELL_SLOTS.length} slots from ${BELL_PRESET.key}`)

  // Shipped Vietnamese holidays. skipDuplicates on (studentId, presetKey) means
  // a re-seed never overwrites a Tết date the parent has corrected.
  const holidayResult = await db.schoolBreak.createMany({
    data: VN_HOLIDAYS_2026_2027.map((preset) => ({
      studentId: DEFAULT_USER_ID,
      kind: preset.kind,
      label: preset.label,
      startDate: preset.startDate,
      endDate: preset.endDate,
      presetKey: preset.presetKey,
      needsReview: preset.needsReview ?? false,
    })),
    skipDuplicates: true,
  })
  console.warn(`✅ Holidays seeded: ${holidayResult.count} new (nghỉ hè is set by the parent)`)

  // Since Phase 6 a school period belongs to a dated week. Only the first
  // teaching week of the year is written: every later week inherits it, so one
  // week of rows covers the whole year until the parent changes something.
  const seedWeek = FIRST_TEACHING_WEEK

  // Upsert all periods — safe to re-run
  for (const period of WEEKLY_SCHEDULE) {
    await db.classPeriod.upsert({
      where: {
        studentId_weekStartDate_day_periodNumber: {
          studentId: DEFAULT_USER_ID,
          weekStartDate: seedWeek,
          day: period.day,
          periodNumber: period.periodNumber,
        },
      },
      create: {
        studentId: DEFAULT_USER_ID,
        weekStartDate: seedWeek,
        day: period.day,
        periodNumber: period.periodNumber,
        subjectId: period.subjectId,
        note: period.note ?? null,
        startTime: period.startTime,
        endTime: period.endTime,
      },
      update: {
        subjectId: period.subjectId,
        note: period.note ?? null,
        startTime: period.startTime,
        endTime: period.endTime,
      },
    })
  }

  console.warn(
    `✅ Weekly schedule seeded: ${WEEKLY_SCHEDULE.length} periods across 5 days, week of ${seedWeek}`
  )

  // Homework runs from the start of the school year to the end of học kỳ II,
  // skipping every day the child is not at school — generating bài tập for Tết
  // would be the seed contradicting the holidays it just wrote.
  const seededBreaks: SchoolBreak[] = VN_HOLIDAYS_2026_2027.map((preset) => ({
    kind: preset.kind,
    label: preset.label,
    startDate: preset.startDate,
    endDate: preset.endDate,
  }))
  const SEED_UNTIL = '2027-05-31'
  const homeworkEntries = buildDailyHomework(
    SCHOOL_YEAR_START,
    SEED_UNTIL,
    WEEKLY_SCHEDULE
  ).filter((entry) => !isDayOff(seededBreaks, entry.date))

  let created = 0
  for (const entry of homeworkEntries) {
    const exists = await db.dailyHomework.findFirst({
      where: { studentId: DEFAULT_USER_ID, date: entry.date, subjectId: entry.subjectId },
    })
    if (!exists) {
      await db.dailyHomework.create({
        data: {
          studentId: DEFAULT_USER_ID,
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
