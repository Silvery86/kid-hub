'use client'

/** GradesManager — parent panel for viewing and editing subject grades stored in localStorage. */

import { useState } from 'react'
import { Save, Check } from 'lucide-react'
import type { SubjectGrade } from '@/types'
import { SUBJECTS } from '@/lib/data/subjects'
import { SEED_GRADES } from '@/lib/data/grades'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { STORAGE_KEYS } from '@/lib/constants'
import { calculateBadge, cn } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import { KidButton } from '@/components/ui/KidButton'

export const GradesManager = () => {
  const [storedGrades, setStoredGrades] = useLocalStorage<SubjectGrade[]>(
    STORAGE_KEYS.GRADES,
    SEED_GRADES as SubjectGrade[]
  )

  // Use string inputs so partial values like "9." are allowed mid-edit
  const [editableScores, setEditableScores] = useState<Record<string, string>>(() =>
    Object.fromEntries(storedGrades.map((g) => [g.subjectId, String(g.score)]))
  )
  const [semester, setSemester] = useState<1 | 2>(storedGrades[0]?.semester ?? 1)
  const [isSaved, setIsSaved] = useState(false)

  const handleScoreChange = (subjectId: string, raw: string) => {
    setEditableScores((prev) => ({ ...prev, [subjectId]: raw }))
  }

  const handleSave = () => {
    const updated: SubjectGrade[] = SUBJECTS.map((s) => {
      const raw = editableScores[s.id] ?? ''
      const parsed = parseFloat(raw)
      const score = isNaN(parsed) ? 0 : Math.min(10, Math.max(0, parsed))
      return {
        subjectId: s.id,
        score,
        badge: calculateBadge(score),
        semester,
        academicYear: '2025-2026',
      }
    })
    setStoredGrades(updated)
    setIsSaved(true)
    setTimeout(() => setIsSaved(false), 2500)
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-extrabold text-slate-700">🌟 Điểm số</h2>
        <KidButton
          variant={isSaved ? 'secondary' : 'primary'}
          onClick={handleSave}
          className="min-h-10 gap-2 px-4 text-sm"
        >
          {isSaved ? <Check size={16} /> : <Save size={16} />}
          {isSaved ? 'Đã lưu!' : 'Lưu'}
        </KidButton>
      </div>

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
