/**
 * Bell schedule — turning the rules a school publishes into a day timeline.
 *
 * Schools do not publish tables of times. They publish rules: "8h10 vào tiết 1,
 * mỗi tiết 35', có 5' chuẩn bị, 9h30 ra chơi (15')". This module takes that, in
 * that shape, and derives every slot — so a parent enters eight numbers instead
 * of transcribing fourteen clock times and making arithmetic errors nothing
 * would catch.
 *
 * The times the school states as results — 11h tan học buổi sáng, 17h giờ tan
 * học — are derived here too (`morningEnd`, `groupDismissals`) and shown back to
 * the parent to compare against their notice. They are never asked for as input:
 * a number the app can compute is a number the parent should not have to type.
 *
 * See docs/SCHEDULE_PARENT_IMP.md §6.2. Pure and isomorphic: no persistence,
 * no Prisma, no React.
 */

import type {
  BellRules,
  BellSession,
  BellSlot,
  DayOfWeek,
  DismissalGroup,
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

/** Chronological, so a caller can render the day straight down the list. */
const byStartTime = (a: BellSlot, b: BellSlot): number => a.startTime.localeCompare(b.startTime)

/**
 * The label the derived midday block carries.
 *
 * Exported because the round-trip depends on it. The block is written to the
 * timeline like any other slot, and the repository rebuilds `rules.routines`
 * from the stored ROUTINE rows — so without a marker the derived block would
 * come back as an explicit routine and then be emitted a second time on the
 * next save. One constant, read by both sides, is the whole mechanism.
 */
export const MIDDAY_BREAK_LABEL = 'Ăn trưa & ngủ'

/**
 * The midday break, derived from `boarding` rather than entered.
 *
 * A bán trú child does not go home between the sessions — they eat and sleep at
 * school, and the timeline has to account for those hours. Deriving the block
 * from the two session times keeps it true when a rule changes: a routine that
 * hard-coded "11:00 – 13:30" went on claiming 11:00 after a parent shortened
 * the morning to three periods, overlapping the tiết it then ran into.
 *
 * A non-boarding child gets no block at all. The gap is real, but it is time at
 * home, and drawing it as a slot at school would state something untrue.
 */
const middayBreak = (rules: BellRules, morning: BellSlot[], afternoon: BellSlot[]): BellSlot[] => {
  if (!rules.boarding || !rules.afternoon) return []

  const start = lastEndTime(morning)
  const end = afternoon[0]?.startTime
  if (!start || !end || parseTimeToMinutes(end) <= parseTimeToMinutes(start)) return []

  return [
    {
      kind: 'ROUTINE',
      label: MIDDAY_BREAK_LABEL,
      startTime: start,
      endTime: end,
      days: DEFAULT_DAYS,
      isGenerated: true,
    },
  ]
}

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

  return [...morning, ...afternoon, ...middayBreak(rules, morning, afternoon), ...routines].sort(
    byStartTime
  )
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


/**
 * When the morning session ends.
 *
 * For a bán trú household this is an internal transition the child never
 * crosses. For every other household it is the pickup time — the single most
 * important number on the screen, and the one the school states as "11h tan
 * học buổi sáng".
 */
export const morningEnd = (slots: BellSlot[], rules: BellRules): string | undefined =>
  lastPeriodEnd(slots, 1, rules.morning.periods)

/**
 * Giờ tan học, collapsed into runs of weekdays that end at the same time.
 *
 * This is the number a school publishes and a parent plans around, and it is
 * the one that varies across the week: Mon–Thu run to 17:00 because of the
 * guided hour, Friday stops at 16:00 because it has none. That variation lives
 * in each slot's `days`, so reading it back is a filter rather than a special
 * case — and grouping only CONSECUTIVE runs keeps the reading honest. A week
 * where Wednesday alone differs renders as three groups, not as a tidy two.
 */
export const groupDismissals = (slots: BellSlot[]): DismissalGroup[] => {
  const out: DismissalGroup[] = []

  for (const day of DEFAULT_DAYS) {
    const time = lastEndTime(slots, day)
    if (!time) continue
    const run = out[out.length - 1]
    if (run && run.time === time) run.days.push(day)
    else out.push({ days: [day], time })
  }

  return out
}
