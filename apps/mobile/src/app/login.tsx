import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/hooks/use-auth';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = email.trim().length > 0 && password.length >= 8 && !submitting;

  async function onSubmit() {
    setError(null);
    setSubmitting(true);
    const result = await signIn(email.trim(), password);
    setSubmitting(false);

    if (result.ok) {
      router.replace('/(tabs)/dashboard');
      return;
    }
    if (result.error === 'locked') {
      const secs = result.lockoutSeconds ?? 0;
      setError(`Too many attempts. Try again in ${secs}s.`);
      return;
    }
    setError(result.error);
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-neutral-950">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View className="flex-1 justify-center gap-6 px-6">
          <View className="gap-1">
            <Text className="text-3xl font-bold text-neutral-900 dark:text-white">Kid Hub</Text>
            <Text className="text-base text-neutral-500 dark:text-neutral-400">
              Parent sign in
            </Text>
          </View>

          <View className="gap-3">
            <TextInput
              className="rounded-xl border border-neutral-300 px-4 py-3 text-base text-neutral-900 dark:border-neutral-700 dark:text-white"
              placeholder="Email"
              placeholderTextColor="#9ca3af"
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              editable={!submitting}
            />
            <TextInput
              className="rounded-xl border border-neutral-300 px-4 py-3 text-base text-neutral-900 dark:border-neutral-700 dark:text-white"
              placeholder="Password"
              placeholderTextColor="#9ca3af"
              secureTextEntry
              autoComplete="password"
              value={password}
              onChangeText={setPassword}
              editable={!submitting}
            />
          </View>

          {error ? (
            <Text className="text-sm text-red-500" testID="login-error">
              {error}
            </Text>
          ) : null}

          <Pressable
            className={`items-center rounded-xl py-3.5 ${canSubmit ? 'bg-blue-600' : 'bg-blue-600/50'}`}
            disabled={!canSubmit}
            onPress={onSubmit}
            testID="login-submit">
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-base font-semibold text-white">Sign in</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
