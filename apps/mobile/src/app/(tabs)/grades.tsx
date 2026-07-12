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
        className="flex-1 bg-white dark:bg-neutral-950"
        contentContainerClassName="p-4 gap-3"
        data={data?.grades ?? []}
        keyExtractor={(item) => `${item.subjectId}-${item.semester}`}
        ListHeaderComponent={
          <View className="mb-2 gap-1 rounded-2xl bg-blue-600 p-5">
            <Text className="text-sm text-blue-100">Average score</Text>
            <Text className="text-4xl font-bold text-white">
              {data ? data.averageScore.toFixed(1) : '—'}
            </Text>
          </View>
        }
        ListEmptyComponent={
          <Text className="mt-10 text-center text-neutral-500 dark:text-neutral-400">
            No grades recorded yet.
          </Text>
        }
        renderItem={({ item }) => (
          <View className="flex-row items-center justify-between rounded-2xl bg-neutral-100 p-4 dark:bg-neutral-900">
            <View className="gap-1">
              <Text className="text-base text-neutral-900 dark:text-white">{item.subjectId}</Text>
              <Text className="text-xs text-neutral-400">Semester {item.semester}</Text>
            </View>
            <View className="flex-row items-center gap-2">
              <Text className="text-lg">{BADGE_EMOJI[item.badge]}</Text>
              <Text className="text-xl font-bold text-neutral-900 dark:text-white">
                {item.score.toFixed(1)}
              </Text>
            </View>
          </View>
        )}
      />
    </QueryBoundary>
  );
}
