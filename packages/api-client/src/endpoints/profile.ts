import { KidProfileSchema, type KidProfile } from '@kid-hub/shared'
import type { HttpTransport } from '../http'
import { studentPath } from './paths'

export const getKidProfile = async (
  http: HttpTransport,
  studentId: string
): Promise<KidProfile> =>
  KidProfileSchema.parse(await http.get(studentPath(studentId, '/profile')))
