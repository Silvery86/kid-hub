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
        className="flex-1 bg-white dark:bg-neutral-950"
        contentContainerClassName="p-4 gap-3"
        data={data ?? []}
        keyExtractor={(item) => item.periodId}
        ListEmptyComponent={
          <Text className="mt-10 text-center text-neutral-500 dark:text-neutral-400">
            No homework today 🎉
          </Text>
        }
        renderItem={({ item }) => (
          <Pressable
            className="flex-row items-center justify-between rounded-2xl bg-neutral-100 p-4 dark:bg-neutral-900"
            disabled={item.isDone || markDone.isPending}
            onPress={() => markDone.mutate(item.periodId)}>
            <View className="flex-1 gap-1">
              <Text className="text-xs uppercase text-neutral-400">{item.subjectId}</Text>
              <Text
                className={`text-base ${
                  item.isDone
                    ? 'text-neutral-400 line-through'
                    : 'text-neutral-900 dark:text-white'
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
