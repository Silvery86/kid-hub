import { Redirect, Tabs } from 'expo-router';
import { Text } from 'react-native';
import { tokens } from '@kid-hub/shared';

import { useAuth } from '@/hooks/use-auth';

// Emoji tab icon (keeps the tabs dependency-free — no vector-icon package).
function TabIcon({ emoji }: { emoji: string }) {
  return <Text style={{ fontSize: 20 }}>{emoji}</Text>;
}

export default function TabsLayout() {
  const { status } = useAuth();

  // Guard: signing out from any tab bounces back to login.
  if (status === 'unauthenticated') return <Redirect href="/login" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: tokens.colors.math,
        tabBarInactiveTintColor: tokens.colors['text-muted'],
        headerTitleStyle: { color: tokens.colors['text-primary'] },
      }}>
      <Tabs.Screen
        name="dashboard"
        options={{ title: 'Home', tabBarIcon: () => <TabIcon emoji="🏠" /> }}
      />
      <Tabs.Screen
        name="homework"
        options={{ title: 'Homework', tabBarIcon: () => <TabIcon emoji="📓" /> }}
      />
      <Tabs.Screen
        name="schedule"
        options={{ title: 'Schedule', tabBarIcon: () => <TabIcon emoji="📅" /> }}
      />
      <Tabs.Screen
        name="grades"
        options={{ title: 'Grades', tabBarIcon: () => <TabIcon emoji="⭐" /> }}
      />
    </Tabs>
  );
}
