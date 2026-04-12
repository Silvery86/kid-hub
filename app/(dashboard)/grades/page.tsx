'use client'

/** Grades page — read-only report card grid driven by localStorage grades data. */

import {
  Calculator,
  BookOpen,
  Globe,
  Leaf,
  Heart,
  Dumbbell,
  Music,
  Palette,
  Monitor,
  Star,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { TabletPageContainer } from '@/components/layout/TabletPageContainer'
import { Badge } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { useGrades } from '@/hooks/useGrades'
import { getSubjectById } from '@/lib/data/subjects'

const ICON_MAP: Record<string, LucideIcon> = {
  Calculator,
  BookOpen,
  Globe,
  Leaf,
  Heart,
  Dumbbell,
  Music,
  Palette,
  Monitor,
  Star,
}

export default function GradesPage() {
  const { reportCard } = useGrades()

  return (
    <TabletPageContainer className="h-screen overflow-y-auto p-6">
      {/* Header */}
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800">Bảng điểm</h1>
          <p className="mt-1 text-lg text-slate-500">Học kỳ 1 · 2025–2026</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold tracking-wide text-slate-400 uppercase">
            Điểm trung bình
          </p>
          <p className="text-5xl font-extrabold text-blue-600">{reportCard.averageScore}</p>
        </div>
      </div>

      {/* Subject cards grid */}
      <div className="grid grid-cols-2 gap-4">
        {reportCard.grades.map((grade) => {
          const subject = getSubjectById(grade.subjectId)
          if (!subject) return null
          const Icon = ICON_MAP[subject.iconName] ?? Star

          return (
            <div key={grade.subjectId} className="flex gap-4 rounded-3xl bg-white p-5 shadow-sm">
              {/* Icon */}
              <div
                className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-white ${subject.colorClass}`}
                aria-hidden="true"
              >
                <Icon size={26} strokeWidth={2} />
              </div>
              {/* Info */}
              <div className="min-w-0 flex-1">
                <div className="mb-2 flex items-center justify-between">
                  <p className="truncate text-base font-extrabold text-slate-800">{subject.name}</p>
                  <span className="ml-2 shrink-0 text-2xl font-extrabold text-slate-800">
                    {grade.score}
                  </span>
                </div>
                <ProgressBar
                  value={grade.score}
                  max={10}
                  aria-label={`Điểm ${subject.name}: ${grade.score}/10`}
                  className="mb-2"
                />
                <Badge variant={grade.badge} />
              </div>
            </div>
          )
        })}
      </div>
    </TabletPageContainer>
  )
}
