// homework.api.ts — GET today's homework, POST mark-done.
import { api } from './client'
import type { HomeworkItem } from './types'

export async function getTodayHomework(): Promise<HomeworkItem[]> {
  const { data } = await api.get('/homework/today')
  return data.data as HomeworkItem[]
}

export async function markHomeworkDone(periodId: string): Promise<void> {
  await api.post(`/homework/${periodId}/done`)
}
