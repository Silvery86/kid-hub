/** ShapeDisplay — inline SVG shapes for the Shape Quest mini-game. */

import type { ShapeId } from '@/types'
import { cn } from '@/lib/utils'

interface ShapeDisplayProps {
  shape: ShapeId
  className?: string
  filled?: boolean
}

const SHAPE_LABELS: Record<ShapeId, string> = {
  circle: 'Hình tròn',
  square: 'Hình vuông',
  triangle: 'Hình tam giác',
  rectangle: 'Hình chữ nhật',
  star: 'Hình ngôi sao',
  heart: 'Hình trái tim',
}

const ShapeSvg = ({ shape, filled }: { shape: ShapeId; filled: boolean }) => {
  const fill = filled ? 'currentColor' : 'none'
  const stroke = 'currentColor'

  switch (shape) {
    case 'circle':
      return (
        <svg viewBox="0 0 100 100" aria-hidden="true">
          <circle cx="50" cy="50" r="45" fill={fill} stroke={stroke} strokeWidth="6" />
        </svg>
      )
    case 'square':
      return (
        <svg viewBox="0 0 100 100" aria-hidden="true">
          <rect x="8" y="8" width="84" height="84" fill={fill} stroke={stroke} strokeWidth="6" />
        </svg>
      )
    case 'triangle':
      return (
        <svg viewBox="0 0 100 100" aria-hidden="true">
          <polygon points="50,8 95,92 5,92" fill={fill} stroke={stroke} strokeWidth="6" strokeLinejoin="round" />
        </svg>
      )
    case 'rectangle':
      return (
        <svg viewBox="0 0 100 60" aria-hidden="true">
          <rect x="5" y="5" width="90" height="50" fill={fill} stroke={stroke} strokeWidth="6" />
        </svg>
      )
    case 'star':
      return (
        <svg viewBox="0 0 100 100" aria-hidden="true">
          <polygon
            points="50,5 61,35 95,35 68,57 79,91 50,70 21,91 32,57 5,35 39,35"
            fill={fill}
            stroke={stroke}
            strokeWidth="4"
            strokeLinejoin="round"
          />
        </svg>
      )
    case 'heart':
      return (
        <svg viewBox="0 0 100 90" aria-hidden="true">
          <path
            d="M50,82 C50,82 8,52 8,28 C8,15 18,5 30,5 C38,5 45,10 50,17 C55,10 62,5 70,5 C82,5 92,15 92,28 C92,52 50,82 50,82 Z"
            fill={fill}
            stroke={stroke}
            strokeWidth="5"
            strokeLinejoin="round"
          />
        </svg>
      )
  }
}

/** Renders a named shape as an accessible SVG element. */
export const ShapeDisplay = ({ shape, className, filled = true }: ShapeDisplayProps) => (
  <div
    className={cn('text-white', className)}
    role="img"
    aria-label={SHAPE_LABELS[shape]}
    title={SHAPE_LABELS[shape]}
  >
    <ShapeSvg shape={shape} filled={filled} />
  </div>
)

export { SHAPE_LABELS }
