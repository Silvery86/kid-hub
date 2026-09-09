// Zod schemas for auth inputs — isomorphic. Length rules come from shared
// constants so Web and Mobile validate identically.
//
// Messages are Vietnamese because they are shown to the user verbatim — the
// signup form renders them live as it is filled in, and both apps are
// Vietnamese. A rule defined here is the one the server enforces, so a form can
// pre-validate against it without the two drifting apart.
import { z } from 'zod'
import { KID_PATTERN_LENGTH, PIN_LENGTH } from '../constants'

export const ParentEmailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, 'Vui lòng nhập email')
  .email('Email chưa đúng định dạng')

export const ParentPasswordSchema = z
  .string()
  .min(8, 'Mật khẩu cần tối thiểu 8 ký tự')
  .max(128, 'Mật khẩu quá dài')

export const StudentNameSchema = z
  .string()
  .trim()
  .min(1, 'Vui lòng nhập tên của bé')
  .max(60, 'Tên quá dài')

export const GradeLevelSchema = z
  .number()
  .int('Lớp không hợp lệ')
  .min(1, 'Lớp từ 1 đến 12')
  .max(12, 'Lớp từ 1 đến 12')

/** The child a parent names when creating an account or adding a sibling. */
export const StudentIntakeSchema = z.object({
  name: StudentNameSchema,
  gradeLevel: GradeLevelSchema,
})

/** A full signup application. The form validates against this as it is typed. */
export const RegisterSchema = z.object({
  email: ParentEmailSchema,
  password: ParentPasswordSchema,
  student: StudentIntakeSchema,
})

export type RegisterInput = z.infer<typeof RegisterSchema>

export const KidPatternSchema = z
  .string()
  .regex(new RegExp(`^[1-6]{${KID_PATTERN_LENGTH}}$`), 'Invalid unlock pattern format')

export const ParentPinSchema = z
  .string()
  .regex(/^\d{4}$/, `PIN must be exactly ${PIN_LENGTH} digits`)

// ── Class identity ───────────────────────────────────────────
// The header block of a printed thời khóa biểu. Every field optional: a parent
// who only knows the class name should not be blocked on a phone number.

export const ClassNameSchema = z.string().trim().max(20, 'Tên lớp quá dài')
export const TeacherNameSchema = z.string().trim().max(80, 'Tên giáo viên quá dài')
/** Vietnamese numbers, entered as digits with optional spaces/dots or a +84 prefix. */
export const TeacherPhoneSchema = z
  .string()
  .trim()
  .max(20, 'Số điện thoại quá dài')
  .refine((v) => v === '' || /^(\+?\d[\d\s.]{7,17}\d)$/.test(v), 'Số điện thoại chưa đúng')

export const ClassIdentitySchema = z.object({
  studentId: z.string().min(1),
  className: ClassNameSchema.optional(),
  teacherName: TeacherNameSchema.optional(),
  teacherPhone: TeacherPhoneSchema.optional(),
})
