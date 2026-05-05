/** Math hub page — Server Component that fetches today's math homework and renders the game hub. */

import { MathHub } from '@/components/games/MathHub'
import { getTodayMathHomework } from '@/server/services/math.service'
import { todayDateKey, todayDayOfWeek } from '@/server/services/homework.service'
import { DEFAULT_USER_ID } from '@/lib/constants'

export default async function MathGamePage() {
  const day = todayDayOfWeek()
  const date = todayDateKey()
  const mathHomework = await getTodayMathHomework(DEFAULT_USER_ID, day, date).catch(() => null)

  return <MathHub mathHomework={mathHomework} />
}
