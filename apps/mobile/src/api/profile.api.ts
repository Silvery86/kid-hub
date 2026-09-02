// profile.api.ts — GET the kid's display profile (via @kid-hub/api-client).
import type { KidProfile } from '@kid-hub/shared'

import { studentApi } from './http'

export const getKidProfile = async (): Promise<KidProfile> => (await studentApi()).getKidProfile()
