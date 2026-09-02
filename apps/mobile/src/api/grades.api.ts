// grades.api.ts — GET the report card (via @kid-hub/api-client).
import type { ReportCard } from '@kid-hub/shared'

import { studentApi } from './http'

export const getGrades = async (): Promise<ReportCard> => (await studentApi()).getGrades()
