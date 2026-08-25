import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { useAuth } from '@/hooks/use-auth';
import { useKidGate } from '@/hooks/use-kid-gate';

// Entry gate: while the persisted session is being restored, show a spinner;
// then send the user to login, the kid unlock screen, or the tabs. The unlock
// gate is per-launch, so a cold start always passes through it.
export default function Index() {
  const { status } = useAuth();
  const { isUnlocked } = useKidGate();

  if (status === 'loading') {
    return (
      <View className="flex-1 items-center justify-center bg-shell-kid">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (status !== 'authenticated') return <Redirect href="/login" />;

  return <Redirect href={isUnlocked ? '/(tabs)/dashboard' : '/kid-unlock'} />;
}
