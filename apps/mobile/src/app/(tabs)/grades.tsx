import { FlatList, Text, View } from 'react-native';

import { QueryBoundary } from '@/components/query-boundary';
import type { BadgeTier } from '@kid-hub/shared';
import { useGrades } from '@/hooks/use-grades';

const BADGE_EMOJI: Record<BadgeTier, string> = {
  excellent: '🏆',
  good: '👍',
  'needs-practice': '📈',
};

// Grades tab: the report card with the running average pinned at the top.
export default function GradesScreen() {
  const { data, isLoading, isError, refetch } = useGrades();

  return (
    <QueryBoundary isLoading={isLoading} isError={isError} onRetry={refetch}>
      <FlatList
        className="flex-1 bg-shell-kid"
        contentContainerClassName="p-4 gap-3"
        data={data?.grades ?? []}
        keyExtractor={(item) => `${item.subjectId}-${item.semester}`}
        ListHeaderComponent={
          <View className="mb-2 gap-1 rounded-card bg-math p-5">
            <Text className="text-sm text-white/80">Average score</Text>
            <Text className="text-4xl font-bold text-white">
              {data ? data.averageScore.toFixed(1) : '—'}
            </Text>
          </View>
        }
        ListEmptyComponent={
          <Text className="mt-10 text-center text-text-secondary">No grades recorded yet.</Text>
        }
        renderItem={({ item }) => (
          <View className="flex-row items-center justify-between rounded-card bg-white p-4">
            <View className="gap-1">
              <Text className="text-base text-text-primary">{item.subjectId}</Text>
              <Text className="text-xs text-text-muted">Semester {item.semester}</Text>
            </View>
            <View className="flex-row items-center gap-2">
              <Text className="text-lg">{BADGE_EMOJI[item.badge]}</Text>
              <Text className="text-xl font-bold text-text-primary">{item.score.toFixed(1)}</Text>
            </View>
          </View>
        )}
      />
    </QueryBoundary>
  );
}
