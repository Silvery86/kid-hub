import { redirect } from 'next/navigation'

import { KidUnlockScreen } from '@/components/unlock/KidUnlockScreen'
import { requireParentSession, resolveActiveStudent } from '@/server/lib/auth-guard'
import { listStudentsForParent } from '@/server/services/auth.service'

export const dynamic = 'force-dynamic'

/**
 * D1: reachable only with a parent session. Middleware turns away an anonymous
 * visitor; this also catches a session whose parent has no student to unlock,
 * which would otherwise render a pad that can never succeed.
 *
 * The picker only appears from two students up. Showing a one-child household a
 * chooser with a single option is noise, and the names are only safe to render
 * because a parent has already authenticated on this device.
 */
export default async function KidUnlockPage() {
  let parentId: string
  let studentId: string
  try {
    ;({ parentId } = await requireParentSession())
    studentId = await resolveActiveStudent()
  } catch {
    redirect('/parent/login')
  }

  const students = await listStudentsForParent(parentId)

  return (
    <KidUnlockScreen
      studentId={studentId}
      students={students.map((s) => ({ id: s.id, name: s.name }))}
    />
  )
}
