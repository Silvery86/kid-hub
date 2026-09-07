/**
 * The signup form validates against RegisterSchema as it is typed, and the
 * Server Action validates against the same object on submit. These tests pin
 * the shape the form reads — issue paths and messages — because the form maps
 * `issue.path.join('.')` onto its fields, and a renamed key would silently stop
 * showing an error rather than fail to compile.
 */
import { describe, expect, it } from 'vitest'

import { RegisterSchema, StudentIntakeSchema } from './auth.schema'

const valid = {
  email: 'me@example.com',
  password: 'Correct@12345',
  student: { name: 'Khôi', gradeLevel: 1 },
}

/** What the form does: first message per field, keyed by dotted path. */
const errorsByField = (input: unknown): Record<string, string> => {
  const result = RegisterSchema.safeParse(input)
  if (result.success) return {}
  const out: Record<string, string> = {}
  for (const issue of result.error.issues) out[issue.path.join('.')] ??= issue.message
  return out
}

describe('RegisterSchema', () => {
  it('accepts a complete application', () => {
    expect(RegisterSchema.safeParse(valid).success).toBe(true)
  })

  it('reports each bad field under the path the form looks up', () => {
    const errors = errorsByField({
      email: 'not-an-email',
      password: 'short',
      student: { name: '', gradeLevel: 99 },
    })
    expect(Object.keys(errors).sort()).toEqual([
      'email',
      'password',
      'student.gradeLevel',
      'student.name',
    ])
  })

  it('gives the user Vietnamese copy, not a Zod default', () => {
    const errors = errorsByField({ ...valid, email: 'nope' })
    expect(errors.email).toBe('Email chưa đúng định dạng')
    expect(errors.email).not.toMatch(/[Ii]nvalid/)
  })

  it('distinguishes an empty email from a malformed one', () => {
    expect(errorsByField({ ...valid, email: '' }).email).toBe('Vui lòng nhập email')
    expect(errorsByField({ ...valid, email: 'a@b' }).email).toBe('Email chưa đúng định dạng')
  })

  it.each([
    ['', 'Mật khẩu cần tối thiểu 8 ký tự'],
    ['1234567', 'Mật khẩu cần tối thiểu 8 ký tự'],
  ])('rejects the password %j', (password, message) => {
    expect(errorsByField({ ...valid, password }).password).toBe(message)
  })

  it('accepts a password of exactly the minimum length', () => {
    expect(RegisterSchema.safeParse({ ...valid, password: '12345678' }).success).toBe(true)
  })

  it('treats a whitespace-only child name as missing', () => {
    // Otherwise the form looks satisfied and the server creates a nameless child.
    expect(errorsByField({ ...valid, student: { name: '   ', gradeLevel: 1 } })['student.name'])
      .toBe('Vui lòng nhập tên của bé')
  })

  it.each([0, 13, 1.5])('rejects grade %s', (gradeLevel) => {
    expect(errorsByField({ ...valid, student: { name: 'Khôi', gradeLevel } })).toHaveProperty(
      'student.gradeLevel'
    )
  })

  it.each([1, 12])('accepts grade %s at the boundary', (gradeLevel) => {
    expect(RegisterSchema.safeParse({ ...valid, student: { name: 'Khôi', gradeLevel } }).success)
      .toBe(true)
  })

  it('normalises the email the same way the server stores it', () => {
    const parsed = RegisterSchema.parse({ ...valid, email: '  ME@Example.COM ' })
    expect(parsed.email).toBe('me@example.com')
  })

  it('trims the child name rather than storing the padding', () => {
    expect(StudentIntakeSchema.parse({ name: '  Khôi  ', gradeLevel: 2 }).name).toBe('Khôi')
  })
})
