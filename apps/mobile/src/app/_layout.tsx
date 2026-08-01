import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider, usePathname } from 'expo-router';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';

import { lockPortrait } from '@/lib/screen-orientation';
import { AuthProvider } from '@/hooks/use-auth';

import '@/global.css';

const queryClient = new QueryClient();

// Path prefixes that run landscape; everything else is forced back to portrait.
const GAME_ROUTES = ['/math', '/english'];

/**
 * Path C safety net (see mobile_imp.md §2.3): if the focused route is NOT a game
 * route and orientation drifted, force portrait. Prevents a "stuck landscape" if
 * a screen ever forgets its <OrientationLock/>. Game screens own their own lock,
 * so this no-ops while one is focused.
 */
function OrientationGuardrail() {
  const pathname = usePathname();
  useEffect(() => {
    const isGame = GAME_ROUTES.some((route) => pathname.startsWith(route));
    if (!isGame) {
      void lockPortrait();
    }
  }, [pathname]);
  return null;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <OrientationGuardrail />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="login" />
            <Stack.Screen name="(tabs)" />
          </Stack>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
