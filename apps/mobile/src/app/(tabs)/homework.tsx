import { FlatList, Pressable, Text, View } from 'react-native';

import { QueryBoundary } from '@/components/query-boundary';
import { useMarkHomeworkDone, useTodayHomework } from '@/hooks/use-homework';

// Homework tab: tap a row to mark it done (optimistically invalidated by the
// mutation). Exercises both a read (GET) and a write (POST) route.
export default function HomeworkScreen() {
  const { data, isLoading, isError, refetch } = useTodayHomework();
  const markDone = useMarkHomeworkDone();

  return (
    <QueryBoundary isLoading={isLoading} isError={isError} onRetry={refetch}>
      <FlatList
        className="flex-1 bg-shell-kid"
        contentContainerClassName="p-4 gap-3"
        data={data ?? []}
        keyExtractor={(item) => item.periodId}
        ListEmptyComponent={
          <Text className="mt-10 text-center text-text-secondary">No homework today 🎉</Text>
        }
        renderItem={({ item }) => (
          <Pressable
            className="flex-row items-center justify-between rounded-card bg-white p-4"
            disabled={item.isDone || markDone.isPending}
            onPress={() => markDone.mutate(item.periodId)}>
            <View className="flex-1 gap-1">
              <Text className="text-xs uppercase text-text-muted">{item.subjectId}</Text>
              <Text
                className={`text-base ${
                  item.isDone ? 'text-text-muted line-through' : 'text-text-primary'
                }`}>
                {item.homeworkNote}
              </Text>
            </View>
            <Text className="text-xl">{item.isDone ? '✅' : '⬜️'}</Text>
          </Pressable>
        )}
      />
    </QueryBoundary>
  );
}
