export const dynamic = 'force-dynamic'

import { SubjectSettings } from '@/components/parent/subjects/SubjectSettings'
import { listCustomSubjectsAction, } from '@/server/actions/subjects.actions'
import { getRememberedVariantsAction } from '@/server/actions/schedule.actions'
import { listStudentsAction } from '@/server/actions/students.actions'

export default async function SubjectsPage() {
  const [customResult, studentList, variantsResult] = await Promise.all([
    listCustomSubjectsAction(),
    listStudentsAction(),
    getRememberedVariantsAction(),
  ])

  const active = studentList.success
    ? studentList.data.students.find((s) => s.id === studentList.data.activeStudentId)
    : undefined

  return (
    <SubjectSettings
      gradeLevel={active?.gradeLevel ?? 0}
      className={active?.className ?? null}
      initialCustom={customResult.success ? customResult.data : []}
      rememberedVariants={variantsResult.success ? variantsResult.data : {}}
    />
  )
}
