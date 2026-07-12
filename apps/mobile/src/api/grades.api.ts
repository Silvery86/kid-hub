// grades.api.ts — GET the report card (via @kid-hub/api-client).
import type { ReportCard } from '@kid-hub/shared'

import { apiClient } from './http'

export const getGrades = (): Promise<ReportCard> => apiClient.getGrades()
