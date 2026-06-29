import type { WeeklySchedule } from '@/types'

/**
 * Khôi's 1st-grade weekly class schedule — seed data.
 * This is the static reference schedule; Parent Mode (Sprint 3) will allow CRUD overrides.
 * Periods follow the standard Vietnamese primary school morning timetable:
 *   P1 07:30–08:10 · P2 08:10–08:50 · (break) · P3 09:00–09:40 · P4 09:40–10:20 · (break) · P5 10:30–11:10
 */
export const WEEKLY_SCHEDULE: WeeklySchedule = {
  weekStartDate: '2026-03-09',
  days: [
    {
      day: 'monday',
      periods: [
        { periodNumber: 1, subjectId: 'activities', startTime: '07:30', endTime: '08:10' },
        { periodNumber: 2, subjectId: 'vietnamese', startTime: '08:10', endTime: '08:50' },
        { periodNumber: 3, subjectId: 'vietnamese', startTime: '09:00', endTime: '09:40' },
        { periodNumber: 4, subjectId: 'math', startTime: '09:40', endTime: '10:20' },
        { periodNumber: 5, subjectId: 'ethics', startTime: '10:30', endTime: '11:10' },
      ],
    },
    {
      day: 'tuesday',
      periods: [
        { periodNumber: 1, subjectId: 'vietnamese', startTime: '07:30', endTime: '08:10' },
        { periodNumber: 2, subjectId: 'vietnamese', startTime: '08:10', endTime: '08:50' },
        { periodNumber: 3, subjectId: 'math', startTime: '09:00', endTime: '09:40' },
        { periodNumber: 4, subjectId: 'english', startTime: '09:40', endTime: '10:20' },
        { periodNumber: 5, subjectId: 'pe', startTime: '10:30', endTime: '11:10' },
      ],
    },
    {
      day: 'wednesday',
      periods: [
        { periodNumber: 1, subjectId: 'vietnamese', startTime: '07:30', endTime: '08:10' },
        { periodNumber: 2, subjectId: 'vietnamese', startTime: '08:10', endTime: '08:50' },
        { periodNumber: 3, subjectId: 'math', startTime: '09:00', endTime: '09:40' },
        { periodNumber: 4, subjectId: 'music', startTime: '09:40', endTime: '10:20' },
        { periodNumber: 5, subjectId: 'science', startTime: '10:30', endTime: '11:10' },
      ],
    },
    {
      day: 'thursday',
      periods: [
        { periodNumber: 1, subjectId: 'vietnamese', startTime: '07:30', endTime: '08:10' },
        { periodNumber: 2, subjectId: 'vietnamese', startTime: '08:10', endTime: '08:50' },
        { periodNumber: 3, subjectId: 'math', startTime: '09:00', endTime: '09:40' },
        { periodNumber: 4, subjectId: 'english', startTime: '09:40', endTime: '10:20' },
        { periodNumber: 5, subjectId: 'art', startTime: '10:30', endTime: '11:10' },
      ],
    },
    {
      day: 'friday',
      periods: [
        { periodNumber: 1, subjectId: 'vietnamese', startTime: '07:30', endTime: '08:10' },
        { periodNumber: 2, subjectId: 'vietnamese', startTime: '08:10', endTime: '08:50' },
        { periodNumber: 3, subjectId: 'math', startTime: '09:00', endTime: '09:40' },
        { periodNumber: 4, subjectId: 'it', startTime: '09:40', endTime: '10:20' },
        { periodNumber: 5, subjectId: 'activities', startTime: '10:30', endTime: '11:10' },
      ],
    },
  ],
}
