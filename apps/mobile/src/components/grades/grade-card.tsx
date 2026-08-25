// grade-card.tsx — web's grades/GradeCard.tsx.
//
// Web tints the icon tile and the top-score card with
// `color-mix(in oklab, {subject.color} N%, white)`. RN has no color-mix, so both
// use the shared mixWithWhite() — the same OKLab maths, so the tints match.

import { getSubjectById, mixWithWhite, type BadgeTier } from '@kid-hub/shared'
import { Text, View } from 'react-native'

import { shadow } from '@/lib/shadows'
import { GradeTierBadge } from './grade-tier-badge'

/** Score at or above which the whole card picks up the subject tint. */
const TINTED_CARD_SCORE = 9

const barColorClass = (score: number): string =>
  score >= 9 ? 'bg-progress-high' : score >= 7 ? 'bg-btn-primary' : 'bg-progress-low'

interface GradeCardProps {
  subjectId: string
  score: number
  badge: BadgeTier
  compact?: boolean
}

export function GradeCard({ subjectId, score, badge, compact = false }: GradeCardProps) {
  const subject = getSubjectById(subjectId)
  if (!subject) return null

  const pct = Math.min(100, Math.max(0, (score / 10) * 100))

  return (
    <View
      className={`flex-row items-center rounded-card ${compact ? 'gap-2.5 p-3' : 'gap-3.5 p-4'}`}
      style={[
        shadow('sm'),
        {
          backgroundColor:
            score >= TINTED_CARD_SCORE ? mixWithWhite(subject.color, 8) : '#ffffff',
        },
      ]}>
      <View
        className={`items-center justify-center rounded-chip ${compact ? 'h-9 w-9' : 'h-12 w-12'}`}
        style={{ backgroundColor: mixWithWhite(subject.color, 15) }}>
        <Text style={{ fontSize: compact ? 18 : 24 }}>{subject.icon}</Text>
      </View>

      <View className="min-w-0 flex-1">
        <View className="mb-1 flex-row items-center justify-between gap-2">
          <Text
            numberOfLines={1}
            className={`flex-1 font-display-extrabold text-text-primary ${compact ? 'text-sm' : 'text-base'}`}>
            {subject.name}
          </Text>
          <View className="flex-row items-center gap-2">
            <GradeTierBadge tier={badge} compact={compact} />
            <Text
              className={`min-w-9 text-right font-display-extrabold text-text-primary ${compact ? 'text-lg' : 'text-2xl'}`}>
              {score}
            </Text>
          </View>
        </View>

        <View
          accessibilityRole="progressbar"
          accessibilityValue={{ min: 0, max: 10, now: score }}
          className="h-1.5 overflow-hidden rounded-pill bg-surface-muted">
          <View className={`h-full rounded-pill ${barColorClass(score)}`} style={{ width: `${pct}%` }} />
        </View>
      </View>
    </View>
  )
}
