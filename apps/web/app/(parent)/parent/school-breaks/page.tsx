export const dynamic = 'force-dynamic'

import { SchoolBreakManager } from '@/components/parent/school-breaks/SchoolBreakManager'
import { getSchoolBreaksAction } from '@/server/actions/schedule.actions'
import { listStudentsAction } from '@/server/actions/students.actions'

export default async function SchoolBreaksPage() {
  const [breaks, studentList] = await Promise.all([
    getSchoolBreaksAction(),
    listStudentsAction(),
  ])

  // Only used to pre-fill "sau kỳ nghỉ con học lớp", so a missing student falls
  // back to lớp 1 rather than blocking the screen.
  const active = studentList.success
    ? studentList.data.students.find((s) => s.id === studentList.data.activeStudentId)
    : undefined

  return (
    <SchoolBreakManager
      initialBreaks={breaks.success ? breaks.data : []}
      gradeLevel={active?.gradeLevel ?? 1}
    />
  )
}
