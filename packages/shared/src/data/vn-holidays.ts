// Vietnamese public holidays, as a starting point a parent corrects.
//
// Two classes of date, and the difference matters enough to be in the type:
//
//  - Solar dates (1/1, 30/4, 1/5, 2/9) are fixed by the Bộ luật Lao động and
//    fall on the same calendar day every year. We are confident in these.
//
//  - Lunar dates (Tết Nguyên Đán, Giỗ Tổ Hùng Vương) move every year, and the
//    number of days schools actually close around Tết is announced per province
//    each autumn — commonly 7 to 14 days, often more than the statutory 5. The
//    entries below are ESTIMATES carrying `needsReview`, and the UI shows them
//    with a "kiểm tra lại ngày" badge rather than presenting a guess as fact.
//
// This is why the shipped list is seeded as ordinary editable rows rather than
// read-only constants: a wrong Tết that a parent cannot fix is worse than no
// Tết at all.

import type { SchoolBreak } from '../types'

/** A shipped default, before it becomes a row the parent owns. */
export interface HolidayPreset extends Omit<SchoolBreak, 'id'> {
  presetKey: string
}

/**
 * School year 2026–2027 (khai giảng 05/09/2026).
 *
 * Ordered by date. `presetKey` is stable across years so a re-seed updates the
 * row it created before rather than adding a duplicate; a parent's edit to the
 * dates survives, because the seed only fills a key it has not seen.
 */
export const VN_HOLIDAYS_2026_2027: HolidayPreset[] = [
  {
    presetKey: 'quoc-khanh-2026',
    kind: 'PUBLIC_HOLIDAY',
    label: 'Quốc khánh 2/9',
    startDate: '2026-09-02',
    endDate: '2026-09-02',
  },
  {
    presetKey: 'tet-duong-lich-2027',
    kind: 'PUBLIC_HOLIDAY',
    label: 'Tết Dương lịch',
    startDate: '2027-01-01',
    endDate: '2027-01-01',
  },
  {
    presetKey: 'tet-nguyen-dan-2027',
    kind: 'PUBLIC_HOLIDAY',
    label: 'Tết Nguyên Đán',
    // Mùng 1 Tết Đinh Mùi falls in early February 2027. The span below is a
    // typical school closure around it, not an announcement — hence the flag.
    startDate: '2027-02-03',
    endDate: '2027-02-11',
    needsReview: true,
  },
  {
    presetKey: 'gio-to-hung-vuong-2027',
    kind: 'PUBLIC_HOLIDAY',
    label: 'Giỗ Tổ Hùng Vương',
    // 10/3 âm lịch — mid-April 2027 by the lunar calendar. Confirm before use.
    startDate: '2027-04-16',
    endDate: '2027-04-16',
    needsReview: true,
  },
  {
    presetKey: 'ngay-30-4-2027',
    kind: 'PUBLIC_HOLIDAY',
    label: 'Ngày Giải phóng 30/4',
    startDate: '2027-04-30',
    endDate: '2027-04-30',
  },
  {
    presetKey: 'quoc-te-lao-dong-2027',
    kind: 'PUBLIC_HOLIDAY',
    label: 'Quốc tế Lao động 1/5',
    startDate: '2027-05-01',
    endDate: '2027-05-01',
  },
]

/**
 * Nghỉ hè is deliberately NOT in this list.
 *
 * The school announces when the year ends, it moves by weeks between schools
 * and between years, and it spans a grade change. A shipped guess would be
 * wrong for most families and would silently blank three months of a child's
 * schedule. The parent declares it — see `SUMMER_BREAK` in
 * domain/school-breaks.ts.
 */
export const SUMMER_BREAK_IS_PARENT_DECLARED = true
