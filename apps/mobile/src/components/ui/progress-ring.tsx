// progress-ring.tsx — web's ui/ProgressRing.tsx, on react-native-svg.
//
// Web animates stroke-dashoffset via a CSS transition, which RN has no
// equivalent for; the ring snaps to its value instead. Nothing on mobile
// currently animates a ring, so this is parity in every static frame.

import { tokens } from '@kid-hub/shared'
import Svg, { Circle } from 'react-native-svg'

interface ProgressRingProps {
  value: number
  max: number
  size?: number
}

const STROKE_WIDTH = 2.5

export function ProgressRing({ value, max, size = 24 }: ProgressRingProps) {
  const pct = max > 0 ? Math.min(value / max, 1) : 0
  const r = (size - 4) / 2
  const circumference = 2 * Math.PI * r
  const isComplete = max > 0 && value >= max

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        strokeWidth={STROKE_WIDTH}
        stroke={tokens.colors['progress-track']}
      />
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        strokeWidth={STROKE_WIDTH}
        strokeDasharray={circumference}
        strokeDashoffset={circumference * (1 - pct)}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        stroke={isComplete ? tokens.colors['progress-complete'] : tokens.colors['progress-high']}
      />
    </Svg>
  )
}
