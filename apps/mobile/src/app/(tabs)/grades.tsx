// Grades tab — web's /grades phone-portrait branch (GradesView).
import { gradesForSemester, semesterAverage, topSubjectForSemester } from '@kid-hub/shared'
import { useMemo, useState } from 'react'
import { ScrollView, Text, View } from 'react-native'

import { QueryBoundary } from '@/components/query-boundary'
import { useGrades } from '@/hooks/use-grades'
import { GradeCard } from '@/components/grades/grade-card'
import { GradesSummaryBar } from '@/components/grades/grades-summary-bar'
import { SemesterTabs } from '@/components/grades/semester-tabs'
import { Screen } from '@/components/ui/screen'
import { FadeSlideUp, STAGGER_MS } from '@/components/ui/animated'

export default function GradesScreen() {
  const { data, isLoading, isError, refetch } = useGrades()
  const [semester, setSemester] = useState<1 | 2>(1)

  const rows = useMemo(() => gradesForSemester(data?.grades ?? [], semester), [data, semester])
  const average = useMemo(() => semesterAverage(rows), [rows])
  const topSubjectId = useMemo(() => topSubjectForSemester(rows), [rows])

  return (
    <Screen bare>
      <QueryBoundary isLoading={isLoading} isError={isError} onRetry={refetch}>
        <ScrollView
          className="flex-1"
          contentContainerClassName="gap-3 px-3.5 pb-4 pt-3.5"
          showsVerticalScrollIndicator={false}>
          <View className="flex-row items-center justify-between gap-2">
            <Text className="font-display-bold text-2xl text-text-primary">Điểm số ⭐</Text>
            <SemesterTabs active={semester} onChange={setSemester} compact />
          </View>

          <FadeSlideUp delay={STAGGER_MS[0]}>
            <GradesSummaryBar average={average} topSubjectId={topSubjectId} compact />
          </FadeSlideUp>

          <FadeSlideUp delay={STAGGER_MS[1]} className="gap-2">
            {rows.map((row) => (
              <GradeCard
                key={row.subjectId}
                subjectId={row.subjectId}
                score={row.score}
                badge={row.badge}
                compact
              />
            ))}
          </FadeSlideUp>
        </ScrollView>
      </QueryBoundary>
    </Screen>
  )
}
