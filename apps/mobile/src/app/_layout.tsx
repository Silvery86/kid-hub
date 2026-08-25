import { tokens } from '@kid-hub/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider, usePathname } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';

import { lockPortrait } from '@/lib/screen-orientation';
import { AuthProvider } from '@/hooks/use-auth';
import { KidGateProvider } from '@/hooks/use-kid-gate';
import { ParentGateProvider } from '@/hooks/use-parent-gate';

import '@/global.css';

const queryClient = new QueryClient();

/**
 * Nunito — the family web actually renders (apps/web/app/layout.tsx loads it
 * through next/font/google and binds it to --font-display).
 *
 * MOBILE_UI_IMP.md §5.4 claimed web rendered Spline Sans, reading the stack out
 * of tokens.json; that value was dead, because Next's font loader sets
 * --font-display itself. Phase 2 vendored Spline Sans on that basis, which was
 * wrong twice over: it did not match web, and it has no Vietnamese subset at
 * all, so every diacritic in this app fell back to the system face mid-word.
 *
 * Keys are the family names the NativeWind preset emits for `font-display*`,
 * read from the token source so the two cannot drift. Each weight is its own
 * family because RN cannot select a face out of a family by numeric weight; the
 * paths must stay inline relative literals for Metro to resolve them, matching
 * the sound assets in use-game-audio.ts.
 */
const FONTS = {
  [tokens.fonts.faces.display]: require('../../assets/fonts/Nunito-Regular.ttf'),
  [tokens.fonts.faces['display-medium']]: require('../../assets/fonts/Nunito-Medium.ttf'),
  [tokens.fonts.faces['display-semibold']]: require('../../assets/fonts/Nunito-SemiBold.ttf'),
  [tokens.fonts.faces['display-bold']]: require('../../assets/fonts/Nunito-Bold.ttf'),
  [tokens.fonts.faces['display-extrabold']]: require('../../assets/fonts/Nunito-ExtraBold.ttf'),
  [tokens.fonts.faces['display-black']]: require('../../assets/fonts/Nunito-Black.ttf'),
};

void SplashScreen.preventAutoHideAsync();

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
  // `error` is deliberately not fatal: a missing face degrades to the system font,
  // which is a worse-looking app rather than a blank one.
  const [fontsLoaded, fontError] = useFonts(FONTS);

  useEffect(() => {
    if (fontsLoaded || fontError) void SplashScreen.hideAsync();
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <KidGateProvider>
          <ParentGateProvider>
            <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
              <OrientationGuardrail />
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="login" />
                <Stack.Screen name="kid-unlock" />
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="homework" />
                <Stack.Screen name="unlock" />
                <Stack.Screen name="parent" />
              </Stack>
            </ThemeProvider>
          </ParentGateProvider>
        </KidGateProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
