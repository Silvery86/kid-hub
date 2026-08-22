import { KidProfileSchema, type KidProfile } from '@kid-hub/shared'
import type { HttpTransport } from '../http'

export const getKidProfile = async (http: HttpTransport): Promise<KidProfile> =>
  KidProfileSchema.parse(await http.get('/kid-profile'))
