// progress.api.ts — GET the kid's points, streak and badge progress.
import type { ProgressSummary } from '@kid-hub/shared'

import { apiClient } from './http'

export const getProgress = (): Promise<ProgressSummary> => apiClient.getProgress()
