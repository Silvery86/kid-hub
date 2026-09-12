/**
 * What a parent may say about a subject of their own.
 *
 * Deliberately small: the programme's subjects are fixed in code and cannot be
 * edited or removed (docs/SCHEDULE_SUBJECT.md S1–S3), so everything here
 * concerns rows the parent created.
 */

import { z } from 'zod'

/**
 * Colour and icon come from fixed sets rather than free input.
 *
 * A custom subject sits in the same grid as the programme's, and an arbitrary
 * hex would eventually be one a child cannot read white text on. These six are
 * already carrying subjects elsewhere in the app, so they are known to work.
 */
export const CUSTOM_SUBJECT_COLORS = [
  '#0ea5e9',
  '#f43f5e',
  '#eab308',
  '#8b5cf6',
  '#14b8a6',
  '#f97316',
] as const

export const CUSTOM_SUBJECT_ICONS = ['🏫', '🧩', '🎯', '🌏', '🎼', '🏆', '🔬', '✍️'] as const

/** Trimmed, because a name that differs only by spaces is the same subject. */
const SubjectName = z
  .string()
  .trim()
  .min(1, 'Cần đặt tên môn học')
  .max(40, 'Tên môn tối đa 40 ký tự')

/** "custom_<cuid>" — never a programme id, which is what keeps S2 enforceable. */
export const CustomSubjectIdSchema = z
  .string()
  .regex(/^custom_[a-z0-9]{10,30}$/, 'Mã môn không hợp lệ')

export const AddCustomSubjectSchema = z.object({
  name: SubjectName,
  color: z.enum(CUSTOM_SUBJECT_COLORS),
  icon: z.enum(CUSTOM_SUBJECT_ICONS),
})

export const UpdateCustomSubjectSchema = AddCustomSubjectSchema.extend({
  subjectId: CustomSubjectIdSchema,
})

export const DeleteCustomSubjectSchema = z.object({
  subjectId: CustomSubjectIdSchema,
})

export type AddCustomSubjectInput = z.infer<typeof AddCustomSubjectSchema>
export type UpdateCustomSubjectInput = z.infer<typeof UpdateCustomSubjectSchema>
