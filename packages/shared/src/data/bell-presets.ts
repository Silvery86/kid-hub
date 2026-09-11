/**
 * Starting points for the bell-schedule editor, chosen by the student's grade.
 *
 * These exist to remove the blank page, NOT to be correct. Every value is a
 * guess the parent overwrites with what their own school published — no rule
 * is enforced against a preset, deliberately (decision D2): a hard limit that
 * happened to be wrong would block a legitimate school.
 *
 * `boarding` (bán trú) is the one field a parent must actually decide rather
 * than correct: it is a fact about their enrolment, not about the school, and
 * the preset cannot know it. It defaults on for tiểu học, where học 2 buổi
 * usually means staying, and off for THCS/THPT, which are morning-only here.
 *
 * 35' periods for tiểu học and 45' for THCS/THPT are the widely-used norms.
 * They are defaults, not regulations; nothing here has been checked against a
 * circular, and nothing should be until one is sourced.
 */

import type { BellRules, DayOfWeek } from '../types'

const WEEKDAYS: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
const MON_TO_THU: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday']

export interface BellPreset {
  key: string
  label: string
  /** Inclusive grade range this preset is offered for. */
  grades: [number, number]
  rules: BellRules
}

export const BELL_PRESETS: readonly BellPreset[] = [
  {
    key: 'primary-35',
    label: 'Tiểu học — 35 phút/tiết, học 2 buổi',
    grades: [1, 5],
    rules: {
      periodMinutes: 35,
      transitionMinutes: 5,
      morning: {
        start: '08:10',
        periods: 4,
        recess: { afterPeriod: 2, start: '09:30', minutes: 15 },
      },
      afternoon: {
        start: '13:45',
        periods: 3,
        recess: { afterPeriod: 6, start: '15:00', minutes: 15 },
      },
      boarding: true,
      // No lunch routine here: with `boarding` on, the generator derives the
      // midday block from the two session times, so it stays correct when the
      // parent changes either one.
      routines: [
        { label: 'Có mặt, thể dục đầu giờ', startTime: '07:50', endTime: '08:10', days: WEEKDAYS },
        // The guided hour is what makes the week uneven — Mon–Thu dismiss at
        // 17:00, Friday at 16:00 because it has none. Offered as a starting
        // point because it is near-universal in tiểu học học 2 buổi; a school
        // without it is one delete away.
        {
          label: 'Hướng dẫn hoàn thành kiến thức',
          startTime: '16:00',
          endTime: '17:00',
          days: MON_TO_THU,
        },
      ],
    },
  },
  {
    key: 'secondary-45',
    label: 'THCS — 45 phút/tiết',
    grades: [6, 9],
    rules: {
      periodMinutes: 45,
      transitionMinutes: 5,
      morning: {
        start: '07:00',
        periods: 5,
        recess: { afterPeriod: 2, start: '08:40', minutes: 15 },
      },
      boarding: false,
      routines: [],
    },
  },
  {
    key: 'high-45',
    label: 'THPT — 45 phút/tiết',
    grades: [10, 12],
    rules: {
      periodMinutes: 45,
      transitionMinutes: 5,
      morning: {
        start: '07:00',
        periods: 5,
        recess: { afterPeriod: 2, start: '08:40', minutes: 15 },
      },
      boarding: false,
      routines: [],
    },
  },
] as const

/** The preset offered first for a grade. Falls back to primary for an out-of-range value. */
export const presetForGrade = (gradeLevel: number): BellPreset =>
  BELL_PRESETS.find((p) => gradeLevel >= p.grades[0] && gradeLevel <= p.grades[1]) ??
  BELL_PRESETS[0]!

export const presetByKey = (key: string): BellPreset | undefined =>
  BELL_PRESETS.find((p) => p.key === key)
