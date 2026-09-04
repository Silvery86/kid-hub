export const dynamic = 'force-dynamic'

/** Math hub page — Server Component that fetches today's math homework and renders the game hub. */

import { requireKidSession } from '@/server/lib/auth-guard'
import { MathHub } from '@/components/games/MathHub'
import { getTodayMathHomework } from '@/server/services/math.service'
import { todayDateKey, todayDayOfWeek } from '@/server/services/homework.service'

export default async function MathGamePage() {
  const day = todayDayOfWeek()
  const date = todayDateKey()
  const { studentId } = await requireKidSession()
  const mathHomework = await getTodayMathHomework(studentId, day, date).catch(() => null)

  return <MathHub mathHomework={mathHomework} />
}
