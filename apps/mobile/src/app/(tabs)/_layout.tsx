import { tokens } from '@kid-hub/shared'
import { Redirect, Tabs } from 'expo-router'
import { Text } from 'react-native'

import { useAuth } from '@/hooks/use-auth'

/**
 * Web's portrait bottom bar: h-16 white, a hairline shadow above it, 22px emoji
 * and a 10px extrabold label (AppSidebar.tsx NavLink, variant="tabbar").
 *
 * The tab set matches web's TAB_ITEMS exactly — four items, with homework and
 * badges deliberately excluded. Both are stack routes reached from the
 * dashboard, as they are in web portrait.
 */
const TAB_BAR_HEIGHT = 64

function TabIcon({ emoji }: { emoji: string }) {
  return <Text style={{ fontSize: 22, lineHeight: 26 }}>{emoji}</Text>
}

export default function TabsLayout() {
  const { status } = useAuth()

  // Guard: signing out from any tab bounces back to login.
  if (status === 'unauthenticated') return <Redirect href="/login" />

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: tokens.colors['btn-primary'],
        tabBarInactiveTintColor: tokens.colors['text-secondary'],
        tabBarStyle: {
          height: TAB_BAR_HEIGHT,
          backgroundColor: '#ffffff',
          borderTopWidth: 0,
          // Web's shadow-[0_-1px_4px_rgba(0,0,0,0.08)] — upward, so a negative offset.
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: -1 },
          shadowOpacity: 0.08,
          shadowRadius: 2,
          elevation: 8,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontFamily: tokens.fonts.faces['display-extrabold'],
        },
      }}>
      <Tabs.Screen
        name="dashboard"
        options={{ title: 'Trang chủ', tabBarIcon: () => <TabIcon emoji="🏠" /> }}
      />
      <Tabs.Screen
        name="schedule"
        options={{ title: 'Lịch', tabBarIcon: () => <TabIcon emoji="🗓️" /> }}
      />
      <Tabs.Screen
        name="grades"
        options={{ title: 'Điểm', tabBarIcon: () => <TabIcon emoji="⭐" /> }}
      />
      <Tabs.Screen
        name="games"
        options={{ title: 'Trò chơi', tabBarIcon: () => <TabIcon emoji="🎮" /> }}
      />
    </Tabs>
  )
}
