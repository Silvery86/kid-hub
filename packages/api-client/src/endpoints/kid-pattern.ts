import {
  KidPatternStatusSchema,
  KidPatternVerifySchema,
  type KidPatternStatus,
  type KidPatternVerify,
} from '@kid-hub/shared'
import type { HttpTransport } from '../http'
import { studentPath } from './paths'

export const getKidPatternStatus = async (
  http: HttpTransport,
  studentId: string
): Promise<KidPatternStatus> =>
  KidPatternStatusSchema.parse(await http.get(studentPath(studentId, '/kid-session')))

export const verifyKidPattern = async (
  http: HttpTransport,
  studentId: string,
  pattern: string
): Promise<KidPatternVerify> =>
  KidPatternVerifySchema.parse(
    await http.post(studentPath(studentId, '/kid-session'), { pattern })
  )
