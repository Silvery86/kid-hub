export const dynamic = 'force-dynamic'

import { BellScheduleEditor } from '@/components/parent/bell-schedule/BellScheduleEditor'
import { getBellScheduleAction } from '@/server/actions/schedule.actions'
import { listStudentsAction } from '@/server/actions/students.actions'

export default async function BellSchedulePage() {
  const [stored, studentList] = await Promise.all([
    getBellScheduleAction(),
    listStudentsAction(),
  ])

  // The grade only picks which preset is offered first, so a missing one falls
  // back to lớp 1 rather than blocking the screen.
  const active = studentList.success
    ? studentList.data.students.find((s) => s.id === studentList.data.activeStudentId)
    : undefined

  return (
    <BellScheduleEditor
      gradeLevel={active?.gradeLevel ?? 1}
      initialRules={stored.success ? (stored.data?.rules ?? null) : null}
      {...(stored.success && stored.data?.presetKey
        ? { initialPresetKey: stored.data.presetKey }
        : {})}
    />
  )
}
