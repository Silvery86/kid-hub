// kid-pattern.api.ts — the kid unlock gate (via @kid-hub/api-client).
import type { KidPatternStatus, KidPatternVerify } from '@kid-hub/shared'

import { apiClient } from './http'

export const getKidPatternStatus = (): Promise<KidPatternStatus> => apiClient.getKidPatternStatus()

export const verifyKidPattern = (pattern: string): Promise<KidPatternVerify> =>
  apiClient.verifyKidPattern(pattern)
