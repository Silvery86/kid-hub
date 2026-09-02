// kid-pattern.api.ts — the kid unlock gate (via @kid-hub/api-client).
import type { KidPatternStatus, KidPatternVerify } from '@kid-hub/shared'

import { studentApi } from './http'

export const getKidPatternStatus = async (): Promise<KidPatternStatus> => (await studentApi()).getKidPatternStatus()

export const verifyKidPattern = async (pattern: string): Promise<KidPatternVerify> =>
  (await studentApi()).verifyKidPattern(pattern)
