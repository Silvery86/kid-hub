/** English hub page — Server Component that fetches today's English homework and renders the game hub. */

import { EnglishHub } from '@/components/games/EnglishHub'
import { getTodayEnglishHomework } from '@/server/services/english.service'
import { todayDateKey, todayDayOfWeek } from '@/server/services/homework.service'
import { DEFAULT_USER_ID } from '@/lib/constants'

export default async function EnglishGamePage() {
  const day = todayDayOfWeek()
  const date = todayDateKey()
  const englishHomework = await getTodayEnglishHomework(DEFAULT_USER_ID, day, date).catch(() => null)

  return <EnglishHub englishHomework={englishHomework} />
}
