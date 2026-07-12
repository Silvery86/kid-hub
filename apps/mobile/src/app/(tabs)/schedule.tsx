import { FlatList, Text, View } from 'react-native';

import { QueryBoundary } from '@/components/query-boundary';
import type { ClassPeriod } from '@kid-hub/shared';
import { useSchedule } from '@/hooks/use-schedule';

// Schedule tab: school periods then any evening extra-class blocks for today.
export default function ScheduleScreen() {
  const { data, isLoading, isError, refetch } = useSchedule();

  const periods: ClassPeriod[] = [
    ...(data?.schoolPeriods ?? []),
    ...(data?.eveningBlocks ?? []),
  ];

  return (
    <QueryBoundary isLoading={isLoading} isError={isError} onRetry={refetch}>
      <FlatList
        className="flex-1 bg-white dark:bg-neutral-950"
        contentContainerClassName="p-4 gap-3"
        data={periods}
        keyExtractor={(item, index) => item.id ?? `${item.subjectId}-${index}`}
        ListEmptyComponent={
          <Text className="mt-10 text-center text-neutral-500 dark:text-neutral-400">
            No classes scheduled today.
          </Text>
        }
        renderItem={({ item }) => (
          <View className="flex-row items-center gap-4 rounded-2xl bg-neutral-100 p-4 dark:bg-neutral-900">
            <Text className="w-24 text-sm font-medium text-blue-600 dark:text-blue-400">
              {item.startTime}–{item.endTime}
            </Text>
            <Text className="flex-1 text-base text-neutral-900 dark:text-white">
              {item.subjectId}
              {item.roomNumber ? ` · Room ${item.roomNumber}` : ''}
            </Text>
          </View>
        )}
      />
    </QueryBoundary>
  );
}
