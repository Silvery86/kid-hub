import { redirect } from 'next/navigation'

import { StudentsView } from '@/components/parent/students/StudentsView'
import { listStudentsAction } from '@/server/actions/students.actions'

export const dynamic = 'force-dynamic'

export default async function StudentsPage() {
  const result = await listStudentsAction()
  if (!result.success) redirect('/parent/login')

  return (
    <StudentsView
      students={result.data.students}
      activeStudentId={result.data.activeStudentId}
    />
  )
}
