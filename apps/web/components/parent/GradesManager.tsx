'use client'

/** GradesManager — parent panel for viewing and editing subject grades via server actions. */

import { useState, useTransition, useEffect } from 'react'
import { Save, Check, AlertCircle } from 'lucide-react'
import type { SubjectGrade } from '@/types'
import { SUBJECTS } from '@/lib/data/subjects'
import { upsertGradeAction } from '@/server/actions/grades.actions'
import { calculateBadge, cn } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import { KidButton } from '@/components/ui/KidButton'

import type { ParentSaveState } from './ScheduleManager'

interface GradesManagerProps {
  initialGrades: SubjectGrade[]
  embedded?: boolean
  onSaveStateChange?: (state: ParentSaveState) => void
}

export const GradesManager = ({
  initialGrades,
  embedded = false,
  onSaveStateChange,
}: GradesManagerProps) => {
  const [editableScores, setEditableScores] = useState<Record<string, string>>(() =>
    Object.fromEntries(initialGrades.map((g) => [g.subjectId, String(g.score)]))
  )
  const [semester, setSemester] = useState<1 | 2>(initialGrades[0]?.semester ?? 1)
  const [isSaved, setIsSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleScoreChange = (subjectId: string, raw: string) => {
    setEditableScores((prev) => ({ ...prev, [subjectId]: raw }))
  }

  const handleSave = () => {
    setError(null)
    startTransition(async () => {
      const updates = SUBJECTS.map((s) => {
        const raw = editableScores[s.id] ?? ''
        const parsed = parseFloat(raw)
        const score = isNaN(parsed) ? 0 : Math.min(10, Math.max(0, parsed))
        return { subjectId: s.id, score, semester, academicYear: '2025-2026' }
      })

      const results = await Promise.all(updates.map((u) => upsertGradeAction(u)))
      const failed = results.find((r) => !r.success)
      if (failed) {
        setError(failed.error ?? 'Không thể lưu điểm')
        return
      }

      setIsSaved(true)
      setTimeout(() => setIsSaved(false), 2500)
    })
  }

  useEffect(() => {
    onSaveStateChange?.({ save: handleSave, isPending, isSaved })
  }, [onSaveStateChange, isPending, isSaved])

  return (
    <div className="flex h-full flex-col gap-4">
      {!embedded ? (
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-slate-700">🌟 Điểm số</h2>
          <KidButton
            variant={isSaved ? 'secondary' : 'primary'}
            onClick={handleSave}
            isDisabled={isPending}
            className="min-h-10 gap-2 px-4 text-sm"
          >
            {isSaved ? <Check size={16} /> : <Save size={16} />}
            {isSaved ? 'Đã lưu!' : isPending ? 'Đang lưu...' : 'Lưu'}
          </KidButton>
        </div>
      ) : null}

      {error && (
        <div className="flex items-center gap-2 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Semester selector */}
      <div className="flex w-fit gap-1 rounded-2xl bg-slate-100 p-1">
        {([1, 2] as const).map((s) => (
          <button
            key={s}
            onClick={() => setSemester(s)}
            className={cn(
              'rounded-xl px-5 py-2 text-sm font-bold transition-colors',
              semester === s
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            )}
          >
            Học kỳ {s}
          </button>
        ))}
      </div>

      {/* Subject list */}
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto">
        {SUBJECTS.map((subject) => {
          const raw = editableScores[subject.id] ?? ''
          const parsed = parseFloat(raw)
          const score = isNaN(parsed) ? 0 : Math.min(10, Math.max(0, parsed))
          const tier = calculateBadge(score)

          return (
            <div key={subject.id} className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
              {/* Subject colour dot */}
              <div
                className={`h-3 w-3 shrink-0 rounded-full ${subject.colorClass}`}
                aria-hidden="true"
              />
              <span className="flex-1 truncate text-sm font-bold text-slate-700">
                {subject.name}
              </span>
              {/* Score input */}
              <input
                type="number"
                min={0}
                max={10}
                step={0.5}
                value={raw}
                onChange={(e) => handleScoreChange(subject.id, e.target.value)}
                className="w-20 rounded-xl border-2 border-slate-200 bg-white px-2 py-2 text-center text-sm font-extrabold text-slate-800 focus:border-blue-400 focus:outline-none"
                aria-label={`Điểm ${subject.name}`}
              />
              {/* Live badge preview */}
              <Badge variant={tier} className="shrink-0 px-2 py-1 text-xs" />
            </div>
          )
        })}
      </div>
    </div>
  )
}
