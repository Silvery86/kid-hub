/**
 * Every student-scoped path names its tenant. Building them here rather than at
 * each call site means a fetcher cannot quietly forget the segment — the one
 * mistake that would send a request for the wrong child.
 */
export const studentPath = (studentId: string, suffix = ''): string =>
  `/students/${encodeURIComponent(studentId)}${suffix}`
