// grades.api.ts — GET the report card.
import { api } from './client'
import type { ReportCard } from './types'

export async function getGrades(): Promise<ReportCard> {
  const { data } = await api.get('/grades')
  return data.data as ReportCard
}
