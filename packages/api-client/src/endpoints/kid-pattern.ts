import {
  KidPatternStatusSchema,
  KidPatternVerifySchema,
  type KidPatternStatus,
  type KidPatternVerify,
} from '@kid-hub/shared'
import type { HttpTransport } from '../http'

export const getKidPatternStatus = async (http: HttpTransport): Promise<KidPatternStatus> =>
  KidPatternStatusSchema.parse(await http.get('/auth/kid-pattern'))

export const verifyKidPattern = async (
  http: HttpTransport,
  pattern: string
): Promise<KidPatternVerify> =>
  KidPatternVerifySchema.parse(await http.post('/auth/kid-pattern', { pattern }))
