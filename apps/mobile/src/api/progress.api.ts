// progress.api.ts — GET the kid's points, streak and badge progress.
import type { ProgressSummary } from '@kid-hub/shared'

import { studentApi } from './http'

export const getProgress = async (): Promise<ProgressSummary> => (await studentApi()).getProgress()
