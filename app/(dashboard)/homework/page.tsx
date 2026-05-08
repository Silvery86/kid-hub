export const dynamic = 'force-dynamic'

import { getTodayHomeworkAction } from '@/server/actions/homework.actions'
import { HomeworkMode } from '@/components/homework/HomeworkMode'

export default async function HomeworkPage() {
  const result = await getTodayHomeworkAction()
  const items = result.data ?? []

  return <HomeworkMode initialItems={items} />
}
