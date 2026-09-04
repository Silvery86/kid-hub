/** English hub page — Server Component that fetches today's English homework and renders the game hub. */

import { requireKidSession } from '@/server/lib/auth-guard'
import { EnglishHub } from '@/components/games/EnglishHub'
import { getTodayEnglishHomework } from '@/server/services/english.service'
import { todayDateKey, todayDayOfWeek } from '@/server/services/homework.service'

export default async function EnglishGamePage() {
  const day = todayDayOfWeek()
  const date = todayDateKey()
  const { studentId } = await requireKidSession()
  const englishHomework = await getTodayEnglishHomework(studentId, day, date).catch(() => null)

  return <EnglishHub englishHomework={englishHomework} />
}
