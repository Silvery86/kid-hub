import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { useAuth } from '@/hooks/use-auth';

// Entry gate: while the persisted session is being restored, show a spinner;
// then send the user to the tabs or the login screen.
export default function Index() {
  const { status } = useAuth();

  if (status === 'loading') {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-neutral-950">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <Redirect href={status === 'authenticated' ? '/(tabs)/dashboard' : '/login'} />;
}
