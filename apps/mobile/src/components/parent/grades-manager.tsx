// grades-manager.tsx — web's parent/GradesManager.tsx.
//
// Web lays every subject out in a table with an inline number input. A phone
// gets one row per subject with stepper buttons: a score is 0–10 in half
// points, which is far quicker to tap than to type, and it cannot produce an
// out-of-range value the server would reject.

import {
  CURRENT_ACADEMIC_YEAR,
  SUBJECTS,
  calculateBadge,
  type SubjectGrade,
} from '@kid-hub/shared'
import { useState } from 'react'
import { Text, View } from 'react-native'

import { GradeTierBadge } from '@/components/grades/grade-tier-badge'
import { SemesterTabs } from '@/components/grades/semester-tabs'
import { SubjectIcon } from '@/components/dashboard/subject-icon'
import { KidButton } from '@/components/ui/kid-button'
import { shadow } from '@/lib/shadows'
import { useUpsertGrade } from '@/hooks/use-parent'

const STEP = 0.5
const MIN_SCORE = 0
const MAX_SCORE = 10

const clampScore = (n: number): number =>
  Math.min(MAX_SCORE, Math.max(MIN_SCORE, Math.round(n * 2) / 2))

export function GradesManager({ grades }: { grades: SubjectGrade[] }) {
  const [semester, setSemester] = useState<1 | 2>(1)
  const upsert = useUpsertGrade()
  // Which row is mid-save, so only that row shows a pending state.
  const [savingId, setSavingId] = useState<string | null>(null)

  const scoreFor = (subjectId: string): number =>
    grades.find((g) => g.subjectId === subjectId && g.semester === semester)?.score ?? 0

  const save = (subjectId: string, score: number) => {
    setSavingId(subjectId)
    upsert.mutate(
      { subjectId, score, semester, academicYear: CURRENT_ACADEMIC_YEAR },
      { onSettled: () => setSavingId(null) }
    )
  }

  return (
    <View className="gap-3">
      <View className="flex-row items-center justify-between">
        <Text className="font-display-extrabold text-base text-text-primary">Nhập điểm</Text>
        <SemesterTabs active={semester} onChange={setSemester} compact />
      </View>

      {SUBJECTS.map((subject) => {
        const score = scoreFor(subject.id)
        const isSaving = savingId === subject.id
        return (
          <View
            key={subject.id}
            className="flex-row items-center gap-3 rounded-button bg-white p-3"
            style={shadow('sm')}>
            <SubjectIcon subjectId={subject.id} size={36} rounded={10} />

            <View className="min-w-0 flex-1">
              <Text numberOfLines={1} className="font-display-extrabold text-sm text-text-primary">
                {subject.name}
              </Text>
              <View className="mt-1 flex-row items-center gap-2">
                <Text className="font-display-extrabold text-lg text-text-primary">
                  {score.toFixed(1)}
                </Text>
                <GradeTierBadge tier={calculateBadge(score)} compact />
              </View>
            </View>

            <View className="flex-row gap-1.5">
              <KidButton
                variant="ghost"
                isDisabled={isSaving || score <= MIN_SCORE}
                onPress={() => save(subject.id, clampScore(score - STEP))}
                accessibilityLabel={`Giảm điểm ${subject.name}`}>
                −
              </KidButton>
              <KidButton
                variant="secondary"
                isLoading={isSaving}
                isDisabled={score >= MAX_SCORE}
                onPress={() => save(subject.id, clampScore(score + STEP))}
                accessibilityLabel={`Tăng điểm ${subject.name}`}>
                +
              </KidButton>
            </View>
          </View>
        )
      })}
    </View>
  )
}
