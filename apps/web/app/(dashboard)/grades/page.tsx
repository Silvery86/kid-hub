/** Grades page — kid-facing report card with semester tabs. */

export const dynamic = 'force-dynamic'

import { GradesView } from '@/components/grades/GradesView'
import { getReportCardAction } from '@/server/actions/grades.actions'

export default async function GradesPage() {
  const result = await getReportCardAction()
  const grades = result.success ? result.data.grades : []
  return <GradesView grades={grades} />
}
