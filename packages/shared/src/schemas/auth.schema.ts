// Zod schemas for auth inputs — isomorphic. Length rules come from shared
// constants so Web and Mobile validate identically.
import { z } from 'zod'
import { KID_PATTERN_LENGTH, PIN_LENGTH } from '../constants'

export const ParentEmailSchema = z.string().trim().toLowerCase().email('Invalid email format')

export const ParentPasswordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password is too long')

export const KidPatternSchema = z
  .string()
  .regex(new RegExp(`^[1-6]{${KID_PATTERN_LENGTH}}$`), 'Invalid unlock pattern format')

export const ParentPinSchema = z
  .string()
  .regex(/^\d{4}$/, `PIN must be exactly ${PIN_LENGTH} digits`)
