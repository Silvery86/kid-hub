import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

// Shared loading/error shell for the data tabs so each screen only describes
// its happy path. `onRetry` refetches the underlying query.
export function QueryBoundary({
  isLoading,
  isError,
  onRetry,
  children,
}: {
  isLoading: boolean;
  isError: boolean;
  onRetry?: () => void;
  children: ReactNode;
}) {
  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-neutral-950">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (isError) {
    return (
      <View className="flex-1 items-center justify-center gap-3 bg-white px-6 dark:bg-neutral-950">
        <Text className="text-center text-base text-neutral-500 dark:text-neutral-400">
          Couldn&apos;t load this. Check that the app is on the same network as the dev server.
        </Text>
        {onRetry ? (
          <Pressable className="rounded-lg bg-blue-600 px-4 py-2" onPress={onRetry}>
            <Text className="font-semibold text-white">Retry</Text>
          </Pressable>
        ) : null}
      </View>
    );
  }

  return <>{children}</>;
}
