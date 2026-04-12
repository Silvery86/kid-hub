/** TodayTimetable — renders the ordered period list for a single school day. */

import { DAY_LABELS } from '@/lib/constants'
import { getSubjectById } from '@/lib/data/subjects'
import { SubjectCard } from '@/components/dashboard/SubjectCard'
import type { ClassPeriod, DailySchedule } from '@/types'

interface TodayTimetableProps {
  schedule: DailySchedule
  currentPeriod: ClassPeriod | null
  nextPeriod: ClassPeriod | null
}

export const TodayTimetable = ({ schedule, currentPeriod, nextPeriod }: TodayTimetableProps) => (
  <section aria-label="Thời khóa biểu hôm nay">
    <h2 className="mb-3 px-1 text-xl font-extrabold text-slate-700">
      {DAY_LABELS[schedule.day]} — Hôm nay
    </h2>
    <div role="list" className="flex flex-col gap-2">
      {schedule.periods.map((period) => {
        const subject = getSubjectById(period.subjectId)
        if (!subject) return null
        return (
          <SubjectCard
            key={period.periodNumber}
            period={period}
            subject={subject}
            isActive={currentPeriod?.periodNumber === period.periodNumber}
            isNext={nextPeriod?.periodNumber === period.periodNumber}
          />
        )
      })}
      {schedule.periods.length === 0 && (
        <p className="py-8 text-center font-semibold text-slate-500">Hôm nay không có lịch học.</p>
      )}
    </div>
  </section>
)
