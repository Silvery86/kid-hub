'use client'

import { useMemo, useState } from 'react'
import { GradeCard } from './GradeCard'
import { GradesSummaryBar } from './GradesSummaryBar'
import { SemesterTabs } from './SemesterTabs'
import { gradesForSemester, semesterAverage, topSubjectForSemester } from '@/lib/grades-display'
import type { SubjectGrade } from '@/types'

export function GradesView({ grades }: { grades: SubjectGrade[] }) {
  const [semester, setSemester] = useState<1 | 2>(1)
  const academicYear = grades[0]?.academicYear ?? '2025-2026'

  const rows = useMemo(() => gradesForSemester(grades, semester), [grades, semester])
  const average = useMemo(() => semesterAverage(rows), [rows])
  const topSubjectId = useMemo(() => topSubjectForSemester(rows), [rows])

  const list = (
    <div className="flex flex-col gap-2 md:gap-2.5">
      {rows.map((row) => (
        <GradeCard
          key={row.subjectId}
          subjectId={row.subjectId}
          score={row.score}
          badge={row.badge}
        />
      ))}
    </div>
  )

  const compactList = (
    <div className="flex flex-col gap-2">
      {rows.map((row) => (
        <GradeCard
          key={row.subjectId}
          subjectId={row.subjectId}
          score={row.score}
          badge={row.badge}
          compact
        />
      ))}
    </div>
  )

  return (
    <div className="flex h-dvh min-h-0 flex-col overflow-hidden bg-shell-kid portrait:overflow-y-auto">
      {/* Phone portrait */}
      <div className="hidden min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-3.5 pb-4 pt-3.5 portrait:max-md:flex">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-2xl font-black text-text-primary">Điểm số ⭐</h1>
          <SemesterTabs active={semester} onChange={setSemester} compact />
        </div>
        <GradesSummaryBar average={average} topSubjectId={topSubjectId} compact />
        {compactList}
      </div>

      {/* Tablet portrait + desktop main */}
      <div className="hidden min-h-0 flex-1 flex-col gap-4 overflow-hidden p-5 md:flex md:gap-5 md:p-6 lg:gap-6 lg:p-7">
        <div className="flex shrink-0 flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-black text-text-primary lg:text-4xl">Điểm số ⭐</h1>
            <p className="mt-1 text-sm font-bold text-text-secondary lg:text-base">
              Năm học {academicYear} · Lớp 1A
              <span className="hidden lg:inline"> · Học kỳ {semester}</span>
            </p>
          </div>
          <SemesterTabs active={semester} onChange={setSemester} />
        </div>
        <GradesSummaryBar average={average} topSubjectId={topSubjectId} />
        <div className="min-h-0 flex-1 overflow-y-auto md:grid md:grid-cols-2 md:gap-2.5 lg:gap-3">
          {list}
        </div>
      </div>
    </div>
  )
}
