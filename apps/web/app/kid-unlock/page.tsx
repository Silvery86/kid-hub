import { redirect } from 'next/navigation'
import { KidUnlockScreen } from '@/components/unlock/KidUnlockScreen'
import { resolveActiveStudent } from '@/server/lib/auth-guard'

/**
 * D1: reachable only with a parent session. Middleware redirects an anonymous
 * visitor; this catches the case where the session exists but the parent has no
 * student to unlock, which would otherwise render a pad that can never succeed.
 */
export default async function KidUnlockPage() {
  let studentId: string
  try {
    studentId = await resolveActiveStudent()
  } catch {
    redirect('/parent/login')
  }
  return <KidUnlockScreen studentId={studentId} />
}
