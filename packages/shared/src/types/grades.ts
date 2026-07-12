// Grades domain — cross-platform contract types (Web + Mobile).
// Owner: @kid-hub/shared.

export type BadgeTier = 'excellent' | 'good' | 'needs-practice'

export interface SubjectGrade {
  subjectId: string
  score: number // 0–10 scale
  badge: BadgeTier
  semester: 1 | 2
  academicYear: string // e.g. "2025-2026"
}

export interface ReportCard {
  userId: string
  grades: SubjectGrade[]
  averageScore: number
}
