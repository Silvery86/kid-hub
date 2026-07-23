import { FlatList, Text, View } from 'react-native';
import { getIcon } from '@kid-hub/assets';

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
        className="flex-1 bg-shell-kid"
        contentContainerClassName="p-4 gap-3"
        data={periods}
        keyExtractor={(item, index) => item.id ?? `${item.subjectId}-${index}`}
        ListEmptyComponent={
          <Text className="mt-10 text-center text-text-secondary">
            No classes scheduled today.
          </Text>
        }
        renderItem={({ item }) => (
          <View className="flex-row items-center gap-4 rounded-card bg-white p-4">
            <Text className="w-24 text-sm font-medium text-schedule">
              {item.startTime}–{item.endTime}
            </Text>
            <Text style={{ fontSize: 24 }} accessibilityLabel={getIcon(item.iconKey).label}>
              {getIcon(item.iconKey).emoji}
            </Text>
            <Text className="flex-1 text-base text-text-primary">
              {item.subjectId}
              {item.roomNumber ? ` · Room ${item.roomNumber}` : ''}
            </Text>
          </View>
        )}
      />
    </QueryBoundary>
  );
}
