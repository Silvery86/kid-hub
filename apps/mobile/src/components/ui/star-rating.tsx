// star-rating.tsx — web's ui/StarRating.tsx.
//
// Promoted here from components/games/ in Phase 3 and given web's `max` prop;
// the games screens keep importing it by name.

import { Text, View } from 'react-native'

interface StarRatingProps {
  value: number
  max?: number
  size?: number
  className?: string
}

export function StarRating({ value, max = 3, size = 28, className = '' }: StarRatingProps) {
  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={`${value} out of ${max} stars`}
      className={`flex-row items-center gap-2 ${className}`.trim()}>
      {Array.from({ length: max }).map((_, i) => (
        <Text
          key={i}
          style={{ fontSize: size, lineHeight: size * 1.1 }}
          className={i < value ? 'text-star-filled' : 'text-star-empty'}>
          ★
        </Text>
      ))}
    </View>
  )
}
