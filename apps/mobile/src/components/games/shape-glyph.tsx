import { Text } from 'react-native'
import type { ShapeId } from '@kid-hub/shared'

/**
 * Shape rendered as an emoji glyph. The web draws precise SVG shapes; mobile uses
 * emoji to stay dependency-free (no react-native-svg). Faithful enough for
 * recognition; visual polish is Phase 8's re-skin.
 */
const SHAPE_EMOJI: Record<ShapeId, string> = {
  circle: '🔵',
  square: '🟦',
  triangle: '🔺',
  rectangle: '▭',
  star: '⭐',
  heart: '❤️',
}

export const SHAPE_LABELS: Record<ShapeId, string> = {
  circle: 'Hình tròn',
  square: 'Hình vuông',
  triangle: 'Hình tam giác',
  rectangle: 'Hình chữ nhật',
  star: 'Hình ngôi sao',
  heart: 'Hình trái tim',
}

export function ShapeGlyph({ shape, size }: { shape: ShapeId; size: number }) {
  return <Text style={{ fontSize: size, lineHeight: size * 1.1 }}>{SHAPE_EMOJI[shape]}</Text>
}
