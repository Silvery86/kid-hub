export const dynamic = 'force-dynamic'

import { getTodayHomeworkAction } from '@/server/actions/homework.actions'
import { HomeworkListView } from '@/components/homework/HomeworkListView'

export default async function HomeworkPage() {
  const result = await getTodayHomeworkAction()
  const items = result.data ?? []
  return <HomeworkListView initialItems={items} />
}
