// schedule.api.ts — GET today's schedule view.
import { api } from './client'
import type { TodayView } from './types'

export async function getSchedule(): Promise<TodayView> {
  const { data } = await api.get('/schedule')
  return data.data as TodayView
}
