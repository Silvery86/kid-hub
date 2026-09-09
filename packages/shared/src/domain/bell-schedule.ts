/**
 * Bell schedule — turning the rules a school publishes into a day timeline.
 *
 * Schools do not publish tables of times. They publish rules and anchors:
 * "8h10 vào tiết 1, mỗi tiết 35', có 5' chuẩn bị, 9h30 ra chơi (15'),
 * 11h tan học buổi sáng". This module takes that, in that shape, and derives
 * every slot — so a parent enters eight numbers instead of transcribing
 * fourteen clock times and making arithmetic errors nothing would catch.
 *
 * See docs/SCHEDULE_PARENT_IMP.md §6.2. Pure and isomorphic: no persistence,
 * no Prisma, no React.
 */

import type {
  AnchorMismatch,
  BellAnchors,
  BellRules,
  BellSession,
  BellSlot,
  DayOfWeek,
  RuleIssue,
} from '../types'
import { formatMinutesToTime, parseTimeToMinutes } from './time'

/** Weekdays a generated slot applies to unless a routine narrows it. */
const DEFAULT_DAYS: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']

const slot = (
  kind: BellSlot['kind'],
  startMin: number,
  endMin: number,
  extra: Partial<BellSlot> = {}
): BellSlot => ({
  kind,
  startTime: formatMinutesToTime(startMin),
  endTime: formatMinutesToTime(endMin),
  days: DEFAULT_DAYS,
  isGenerated: true,
  ...extra,
})

/**
 * Lays out one session's periods.
 *
 * Periods run back to back separated by `transitionMinutes`. A recess is an
 * ABSOLUTE anchor, not an offset: when the recess after period N is due, the
 * clock jumps to the published start time, the break is inserted, and periods
 * resume at its end.
 *
 * The jump is what lets one rule set describe both sessions of a real school.
 * At Lớp 1A1 the morning leaves 5' between tiết 2 (ends 09:25) and ra chơi
 * (09:30), while the afternoon leaves none — tiết 6 ends 15:00 and ra chơi
 * starts 15:00. An offset rule cannot express both; an anchor absorbs the
 * difference.
 */
const generateSession = (
  session: BellSession,
  firstPeriodNumber: number,
  periodMinutes: number,
  transitionMinutes: number
): BellSlot[] => {
  const out: BellSlot[] = []
  let cursor = parseTimeToMinutes(session.start)

  for (let i = 0; i < session.periods; i += 1) {
    const periodNumber = firstPeriodNumber + i
    out.push(slot('PERIOD', cursor, cursor + periodMinutes, { periodNumber }))
    cursor += periodMinutes

    if (session.recess && session.recess.afterPeriod === periodNumber) {
      cursor = parseTimeToMinutes(session.recess.start)
      out.push(
        slot('BREAK', cursor, cursor + session.recess.minutes, {
          label: session.recess.label ?? 'Ra chơi',
        })
      )
      cursor += session.recess.minutes
    } else if (i < session.periods - 1) {
      cursor += transitionMinutes
    }
  }

  return out
}

/** Chronological, so a caller can render the day straight down the list. */
const byStartTime = (a: BellSlot, b: BellSlot): number => a.startTime.localeCompare(b.startTime)

/**
 * Derives the whole day from the rules: periods, recesses and routines,
 * in chronological order. Period numbers run across the day (morning 1–4,
 * afternoon 5–7), matching how a printed timetable numbers them.
 */
export const generateSlots = (rules: BellRules): BellSlot[] => {
  const morning = generateSession(rules.morning, 1, rules.periodMinutes, rules.transitionMinutes)
  const afternoon = rules.afternoon
    ? generateSession(
        rules.afternoon,
        rules.morning.periods + 1,
        rules.periodMinutes,
        rules.transitionMinutes
      )
    : []

  const routines: BellSlot[] = rules.routines.map((r) => ({
    kind: 'ROUTINE',
    label: r.label,
    startTime: r.startTime,
    endTime: r.endTime,
    days: r.days,
    isGenerated: true,
  }))

  return [...morning, ...afternoon, ...routines].sort(byStartTime)
}

/**
 * Rule sets that cannot produce a sane timeline.
 *
 * The important one is a recess anchor that falls before the period it follows
 * has ended — the clock would jump backwards. We report it rather than
 * silently clamping, because a backwards jump means the parent mistyped a rule
 * and only they can say which one.
 */
export const findRuleIssues = (rules: BellRules): RuleIssue[] => {
  const issues: RuleIssue[] = []

  if (rules.periodMinutes <= 0) {
    issues.push({ field: 'periodMinutes', message: 'Mỗi tiết phải dài hơn 0 phút' })
  }
  if (rules.transitionMinutes < 0) {
    issues.push({ field: 'transitionMinutes', message: 'Giờ chuyển tiết không thể âm' })
  }

  const sessions: [string, BellSession | undefined, number][] = [
    ['morning', rules.morning, 1],
    ['afternoon', rules.afternoon, rules.morning.periods + 1],
  ]

  for (const [name, session, firstPeriodNumber] of sessions) {
    if (!session) continue
    if (session.periods < 0) {
      issues.push({ field: `${name}.periods`, message: 'Số tiết không thể âm' })
      continue
    }
    const recess = session.recess
    if (!recess) continue

    const lastPeriodNumber = firstPeriodNumber + session.periods - 1
    if (recess.afterPeriod < firstPeriodNumber || recess.afterPeriod > lastPeriodNumber) {
      issues.push({
        field: `${name}.recess.afterPeriod`,
        message: `Giờ ra chơi phải nằm sau một tiết trong buổi (tiết ${firstPeriodNumber}–${lastPeriodNumber})`,
      })
      continue
    }
    if (recess.minutes <= 0) {
      issues.push({ field: `${name}.recess.minutes`, message: 'Giờ ra chơi phải dài hơn 0 phút' })
    }

    // Where would the preceding period end if nothing interrupted it?
    const periodsBefore = recess.afterPeriod - firstPeriodNumber + 1
    const endOfThatPeriod =
      parseTimeToMinutes(session.start) +
      periodsBefore * rules.periodMinutes +
      (periodsBefore - 1) * rules.transitionMinutes
    if (parseTimeToMinutes(recess.start) < endOfThatPeriod) {
      issues.push({
        field: `${name}.recess.start`,
        message:
          `Giờ ra chơi (${recess.start}) sớm hơn lúc tiết ${recess.afterPeriod} kết thúc ` +
          `(${formatMinutesToTime(endOfThatPeriod)})`,
      })
    }
  }

  return issues
}

const lastEndTime = (slots: BellSlot[], day?: DayOfWeek): string | undefined => {
  const scoped = day ? slots.filter((s) => s.days.includes(day)) : slots
  return scoped.reduce<string | undefined>(
    (latest, s) => (latest == null || s.endTime > latest ? s.endTime : latest),
    undefined
  )
}

const lastPeriodEnd = (slots: BellSlot[], from: number, to: number): string | undefined =>
  slots
    .filter((s) => s.kind === 'PERIOD' && s.periodNumber != null)
    .filter((s) => s.periodNumber! >= from && s.periodNumber! <= to)
    .reduce<string | undefined>(
      (latest, s) => (latest == null || s.endTime > latest ? s.endTime : latest),
      undefined
    )

/**
 * Checks the derived timeline against the clock times the school also published.
 *
 * This is the correctness mechanism. We cannot know any given school's rules,
 * but the parent can enter the anchors their school stated — 11h tan học sáng,
 * 17h giờ tan học — and a timeline that misses one proves a rule is wrong. We
 * return the deltas rather than adjusting, because only the parent knows which
 * rule they mistyped.
 */
export const validateAgainstAnchors = (
  slots: BellSlot[],
  rules: BellRules,
  anchors: BellAnchors
): AnchorMismatch[] => {
  const out: AnchorMismatch[] = []

  const compare = (label: string, expected: string | undefined, actual: string | undefined) => {
    if (!expected || !actual || expected === actual) return
    out.push({
      label,
      expected,
      actual,
      deltaMinutes: parseTimeToMinutes(actual) - parseTimeToMinutes(expected),
    })
  }

  compare('Tan học buổi sáng', anchors.morningEnd, lastPeriodEnd(slots, 1, rules.morning.periods))

  if (rules.afternoon) {
    compare(
      'Kết thúc buổi chiều',
      anchors.afternoonEnd,
      lastPeriodEnd(slots, rules.morning.periods + 1, rules.morning.periods + rules.afternoon.periods)
    )
  }

  // Dismissal is checked as an OVERRUN, not an equality. At Lớp 1A1, Friday's
  // last slot (tiết 7) ends 15:50 while the school states giờ tan học 16:00 —
  // the ten minutes are packing up, and inventing a routine slot to absorb them
  // would be fabricating a fact about the school. A day that ends before the
  // stated dismissal is normal; a day that runs PAST it means a rule is wrong.
  for (const [day, expected] of Object.entries(anchors.dismissal ?? {})) {
    const actual = lastEndTime(slots, day as DayOfWeek)
    if (!expected || !actual) continue
    if (parseTimeToMinutes(actual) > parseTimeToMinutes(expected)) {
      out.push({
        label: `Giờ tan học ${day}`,
        expected,
        actual,
        deltaMinutes: parseTimeToMinutes(actual) - parseTimeToMinutes(expected),
      })
    }
  }

  return out
}
