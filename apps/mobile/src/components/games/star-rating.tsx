import { Text, View } from 'react-native'

/** Three stars, filled up to `value`. Amber for earned, faded for the rest. */
export function StarRating({ value, size = 28 }: { value: number; size?: number }) {
  return (
    <View className="flex-row items-center" style={{ gap: 2 }}>
      {[1, 2, 3].map((i) => (
        <Text
          key={i}
          style={{ fontSize: size, lineHeight: size * 1.1 }}
          className={i <= value ? 'text-amber-400' : 'text-white/25'}>
          ★
        </Text>
      ))}
    </View>
  )
}
