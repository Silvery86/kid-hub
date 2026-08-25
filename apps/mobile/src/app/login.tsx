// Parent sign-in — web's /parent/login (ParentLoginView), reduced to the one
// step mobile can actually perform.
//
// Web's version is a setup wizard: email → welcome → create PIN → confirm →
// success, with a step indicator across the top. Mobile can only sign in.
// registerParentAccountAction and setPinAction have no REST route, so an
// account and its PIN must both be created on the web app first. A step
// indicator over a single step would claim a flow that does not exist here.
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { KeyboardAvoidingView, Platform, Text, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { KidButton } from '@/components/ui/kid-button'
import { tokens } from '@kid-hub/shared'
import { useAuth } from '@/hooks/use-auth'

/** Matches the server's ParentPasswordSchema minimum. */
const MIN_PASSWORD_LENGTH = 8

const inputClass =
  'min-h-tap rounded-button border-2 border-border-soft bg-white px-4 py-3 text-base text-text-primary'

export default function LoginScreen() {
  const router = useRouter()
  const { signIn } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const canSubmit =
    email.trim().length > 0 && password.length >= MIN_PASSWORD_LENGTH && !isSubmitting

  const onSubmit = async () => {
    setError('')
    setIsSubmitting(true)
    const result = await signIn(email.trim(), password)
    setIsSubmitting(false)

    if (result.ok) {
      router.replace('/')
      return
    }
    if (result.error === 'locked') {
      setError(`Đăng nhập sai quá nhiều lần. Thử lại sau ${result.lockoutSeconds ?? 0}s.`)
      return
    }
    setError('Email hoặc mật khẩu chưa đúng.')
  }

  return (
    <SafeAreaView className="flex-1 bg-shell-parent">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View className="flex-1 justify-center gap-6 px-6">
          <View className="items-center gap-1">
            <Text style={{ fontSize: 56 }}>🛡️</Text>
            <Text className="font-display-bold text-3xl text-text-primary">Kid Hub</Text>
            <Text className="font-display-semibold text-base text-text-secondary">
              Đăng nhập cho bố mẹ
            </Text>
          </View>

          <View className="gap-3">
            <TextInput
              className={inputClass}
              placeholder="Email"
              placeholderTextColor={tokens.colors['text-muted']}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              editable={!isSubmitting}
              accessibilityLabel="Email"
            />
            <TextInput
              className={inputClass}
              placeholder={`Mật khẩu (tối thiểu ${MIN_PASSWORD_LENGTH} ký tự)`}
              placeholderTextColor={tokens.colors['text-muted']}
              secureTextEntry
              autoComplete="password"
              value={password}
              onChangeText={setPassword}
              editable={!isSubmitting}
              accessibilityLabel="Mật khẩu"
            />
          </View>

          {error ? (
            <Text className="font-display-semibold text-sm text-btn-danger" testID="login-error">
              {error}
            </Text>
          ) : null}

          <KidButton
            onPress={onSubmit}
            isDisabled={!canSubmit}
            isLoading={isSubmitting}
            className="w-full">
            Đăng nhập
          </KidButton>

          <Text className="text-center font-display-semibold text-xs text-text-muted">
            Tài khoản và mã PIN được tạo trên bản web.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
