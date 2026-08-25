// Not found — web's app/not-found.tsx.
import { useRouter } from 'expo-router'
import { Text, View } from 'react-native'

import { KidButton } from '@/components/ui/kid-button'
import { shadow } from '@/lib/shadows'

export default function NotFoundScreen() {
  const router = useRouter()

  return (
    <View className="flex-1 items-center justify-center bg-shell-parent p-4">
      <View className="w-full max-w-sm items-center rounded-card bg-white p-8" style={shadow('xl')}>
        <Text className="mb-4" style={{ fontSize: 64 }}>
          🗺️
        </Text>
        <Text className="mb-2 text-center font-display-bold text-2xl text-text-body">
          Trang này không có rồi
        </Text>
        <Text className="mb-6 text-center text-lg text-text-secondary">
          Quay về trang chủ nhé!
        </Text>
        <KidButton onPress={() => router.replace('/')}>Về trang chủ 🏠</KidButton>
      </View>
    </View>
  )
}
