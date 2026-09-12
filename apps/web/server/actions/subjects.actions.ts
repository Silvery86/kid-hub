'use server'

/**
 * Server Actions for a household's own subjects.
 *
 * Nothing here can touch the programme's subjects: every id is validated against
 * the `custom_` prefix before it reaches the database, so "delete Toán" is not a
 * request this surface can express (docs/SCHEDULE_SUBJECT.md S2, S3).
 */

import { revalidatePath } from 'next/cache'
import {
  AddCustomSubjectSchema,
  DeleteCustomSubjectSchema,
  UpdateCustomSubjectSchema,
  FEEDBACK,
  type CustomSubjectRow,
} from '@kid-hub/shared'

import { resolveActiveStudent } from '@/server/lib/auth-guard'
import * as subjectsService from '@/server/services/subjects.service'
import type { SubjectUsage } from '@/server/services/subjects.service'
import type { ActionResult, ActionVoidResult } from '@/types'

/** Prisma's unique-constraint code — here it means the name is already taken. */
const isUniqueViolation = (err: unknown): boolean =>
  typeof err === 'object' && err != null && 'code' in err && err.code === 'P2002'

const fail = (err: unknown, fallback: string): { success: false; error: string } => {
  const msg = err instanceof Error ? err.message : fallback
  return { success: false, error: msg === 'Unauthorized' ? 'Unauthorized' : msg }
}

const refresh = (): void => {
  revalidatePath('/parent')
  revalidatePath('/parent/subjects')
  revalidatePath('/schedule')
  revalidatePath('/dashboard')
}

export const listCustomSubjectsAction = async (): Promise<ActionResult<CustomSubjectRow[]>> => {
  try {
    const studentId = await resolveActiveStudent()
    return { success: true, data: await subjectsService.list(studentId) }
  } catch (err) {
    return fail(err, FEEDBACK.subjects.loadFailed)
  }
}

export const addCustomSubjectAction = async (input: unknown): Promise<ActionVoidResult> => {
  try {
    const studentId = await resolveActiveStudent()
    const parsed = AddCustomSubjectSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Validation error' }
    }

    await subjectsService.add(studentId, parsed.data)
    refresh()
    return { success: true }
  } catch (err) {
    // The unique index is the real guard: two tabs can both pass a pre-check.
    if (isUniqueViolation(err)) return { success: false, error: FEEDBACK.subjects.duplicateName }
    return fail(err, FEEDBACK.subjects.addFailed)
  }
}

export const updateCustomSubjectAction = async (input: unknown): Promise<ActionVoidResult> => {
  try {
    const studentId = await resolveActiveStudent()
    const parsed = UpdateCustomSubjectSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Validation error' }
    }

    const { subjectId, ...fields } = parsed.data
    const ok = await subjectsService.update(studentId, subjectId, fields)
    if (!ok) return { success: false, error: FEEDBACK.subjects.notFound }

    refresh()
    return { success: true }
  } catch (err) {
    if (isUniqueViolation(err)) return { success: false, error: FEEDBACK.subjects.duplicateName }
    return fail(err, FEEDBACK.subjects.saveFailed)
  }
}

/**
 * What a subject is being used by, so the screen can say so before offering a
 * delete button rather than after taking the click.
 */
export const getSubjectUsageAction = async (
  input: unknown
): Promise<ActionResult<SubjectUsage>> => {
  try {
    const studentId = await resolveActiveStudent()
    const parsed = DeleteCustomSubjectSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Validation error' }
    }

    return { success: true, data: await subjectsService.usageOf(studentId, parsed.data.subjectId) }
  } catch (err) {
    return fail(err, FEEDBACK.subjects.loadFailed)
  }
}

export const deleteCustomSubjectAction = async (input: unknown): Promise<ActionVoidResult> => {
  try {
    const studentId = await resolveActiveStudent()
    const parsed = DeleteCustomSubjectSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Validation error' }
    }

    const { deleted, usage } = await subjectsService.remove(studentId, parsed.data.subjectId)

    if (!deleted) {
      // Counts, not a shrug: the parent needs to know where to go and change it.
      if (subjectsService.isInUse(usage)) {
        return { success: false, error: FEEDBACK.subjects.inUse(usage) }
      }
      return { success: false, error: FEEDBACK.subjects.notFound }
    }

    refresh()
    return { success: true }
  } catch (err) {
    return fail(err, FEEDBACK.subjects.deleteFailed)
  }
}
