/**
 * Every student-scoped and admin route handler must call a guard.
 *
 * This is the test that keeps F1 from coming back. Eight kid-data routes shipped
 * with no authentication at all and stayed that way for months, because nothing
 * failed when a handler forgot to ask who was calling. A reviewer noticing is not
 * a control; a red build is.
 *
 * It reads source rather than behaviour on purpose: a behavioural test needs a
 * live server and a database, so it is the kind of test that gets skipped. This
 * one runs in milliseconds and cannot be skipped without deleting it.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const V1 = join(import.meta.dirname)

/** Handlers Next.js will route to. A file exporting none is not reachable. */
const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'] as const

/** Guards that answer "who is calling" AND "may they touch this student". */
const STUDENT_GUARDS = ['guardStudent(', 'guardStudentApp(']
const ADMIN_GUARD = 'requireAdminApi('
const PARENT_GUARD = 'requireParentApi('

/**
 * Routes reachable without any credential, and why. Anything not on this list
 * must be guarded — adding to it should take an argument, not a shrug.
 */
const PUBLIC_BY_DESIGN = new Set([
  'auth/login/route.ts', // no session exists yet; rate-limited per IP and per email
  'auth/logout/route.ts', // revokes a token the caller already holds
  'auth/refresh/route.ts', // the refresh token itself is the credential
  'auth/register/route.ts', // open signup by decision D4; rate-limited 3/hour per IP
])

const walk = (dir: string, base = ''): string[] =>
  readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry)
    const rel = base ? `${base}/${entry}` : entry
    if (statSync(full).isDirectory()) return walk(full, rel)
    return entry === 'route.ts' ? [rel] : []
  })

const routes = walk(V1)
const source = (rel: string) => readFileSync(join(V1, rel), 'utf8')

/**
 * Splits a route file into one slice per exported handler.
 *
 * Checking the file as a whole is not enough: a file whose GET is guarded and
 * whose POST is not would pass, which is exactly the shape of the bug this
 * test exists to catch.
 */
const handlerBodies = (src: string): { method: string; body: string }[] => {
  const starts = [...src.matchAll(/export async function ([A-Z]+)\s*\(/g)]
    .filter((m) => (HTTP_METHODS as readonly string[]).includes(m[1]!))
  return starts.map((m, i) => ({
    method: m[1]!,
    body: src.slice(m.index!, starts[i + 1]?.index ?? src.length),
  }))
}

const handlersIn = (src: string) => handlerBodies(src).map((h) => h.method)

describe('every /api/v1 route is accounted for', () => {
  it('finds the route tree', () => {
    expect(routes.length).toBeGreaterThan(20)
  })

  it.each(routes)('%s exports at least one HTTP handler', (rel) => {
    expect(handlersIn(source(rel)).length).toBeGreaterThan(0)
  })

  it.each(routes.filter((r) => r.startsWith('students/')))(
    '%s guards the student id in every handler',
    (rel) => {
      for (const { method, body } of handlerBodies(source(rel))) {
        const guarded = STUDENT_GUARDS.some((g) => body.includes(g))
        expect(guarded, `${rel} ${method} calls no student guard`).toBe(true)

        // A guard called with anything but the path's own studentId would be
        // checking the wrong tenant, so require the destructure too.
        expect(body, `${rel} ${method} does not read studentId from params`).toContain(
          'const { studentId'
        )
      }
    }
  )

  it.each(routes.filter((r) => r.startsWith('admin/')))(
    '%s puts every handler behind the admin guard',
    (rel) => {
      for (const { method, body } of handlerBodies(source(rel))) {
        expect(body, `${rel} ${method} is not admin-guarded`).toContain(ADMIN_GUARD)
      }
    }
  )

  it.each(routes.filter((r) => r.startsWith('invites/')))(
    '%s requires a parent session in every handler',
    (rel) => {
      // An invite names a student, but the caller is a parent — creating one is
      // authorised by the link, redeeming one creates the link.
      for (const { method, body } of handlerBodies(source(rel))) {
        expect(body, `${rel} ${method} has no parent guard`).toContain(PARENT_GUARD)
      }
    }
  )

  it.each(routes.filter((r) => r.startsWith('parents/')))(
    '%s requires a parent session in every handler',
    (rel) => {
      for (const { method, body } of handlerBodies(source(rel))) {
        expect(body, `${rel} ${method} has no parent guard`).toContain(PARENT_GUARD)
      }
    }
  )

  it.each(routes.filter((r) => r.startsWith('auth/')))(
    '%s is either guarded or listed as public by design',
    (rel) => {
      if (PUBLIC_BY_DESIGN.has(rel)) return
      for (const { method, body } of handlerBodies(source(rel))) {
        const guarded =
          body.includes(PARENT_GUARD) || body.includes(ADMIN_GUARD) ||
          STUDENT_GUARDS.some((g) => body.includes(g))
        expect(guarded, `${rel} ${method} is unguarded and not on the public list`).toBe(true)
      }
    }
  )

  it('no route outside students/, admin/, parents/ and auth/ exists unreviewed', () => {
    const stray = routes.filter(
      (r) => !/^(students|admin|parents|auth|invites)\//.test(r)
    )
    expect(stray, `unclassified routes: ${stray.join(', ')}`).toEqual([])
  })

  it('the eight formerly open kid routes are all guarded now', () => {
    // Named explicitly so the regression is impossible to reintroduce quietly.
    const formerlyOpen = [
      'students/[studentId]/math/route.ts',
      'students/[studentId]/english/route.ts',
      'students/[studentId]/progress/route.ts',
      'students/[studentId]/profile/route.ts',
      'students/[studentId]/homework/today/route.ts',
      'students/[studentId]/homework/[id]/done/route.ts',
      'students/[studentId]/schedule/route.ts',
      'students/[studentId]/schedule/week/route.ts',
    ]
    for (const rel of formerlyOpen) {
      expect(routes, `${rel} vanished from the route tree`).toContain(rel)
      for (const { method, body } of handlerBodies(source(rel))) {
        expect(body, `${rel} ${method} lost its guard`).toContain('guardStudentApp(')
      }
    }
  })
})
