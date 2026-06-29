interface ProgressRingProps {
  value: number
  max: number
  size?: number
}

export function ProgressRing({ value, max, size = 24 }: ProgressRingProps) {
  const pct = max > 0 ? Math.min(value / max, 1) : 0
  const r = (size - 4) / 2
  const circumference = 2 * Math.PI * r
  const offset = circumference * (1 - pct)
  const isComplete = max > 0 && value >= max

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-hidden="true"
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        strokeWidth={2.5}
        style={{ stroke: 'var(--color-progress-track)' }}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        strokeWidth={2.5}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ stroke: isComplete ? '#10b981' : '#fbbf24', transition: 'stroke-dashoffset 0.4s cubic-bezier(0.16,1,0.3,1)' }}
      />
    </svg>
  )
}
