// homework-item-row.tsx — web's homework/HomeworkItemRow.tsx.
//
// Web owns the mutation inside the row via a Server Action; on mobile the
// mutation lives in the screen's TanStack hook, so the row stays presentational
// and reports the tap through onDone.

import { getSubjectById, mixWithWhite, tokens, type HomeworkItem } from '@kid-hub/shared'
import { Text, View } from 'react-native'

import { coloredShadow, shadow } from '@/lib/shadows'
import { PressableScale } from '@/components/ui/animated'

/** Subject colour for an id the catalogue does not know. */
const FALLBACK_COLOR = tokens.colors['text-muted']

interface HomeworkItemRowProps {
  item: HomeworkItem
  isPriority?: boolean
  compact?: boolean
  isPending?: boolean
  onDone?: () => void
}

export function HomeworkItemRow({
  item,
  isPriority = false,
  compact = false,
  isPending = false,
  onDone,
}: HomeworkItemRowProps) {
  const subject = getSubjectById(item.subjectId)
  const color = subject?.color ?? FALLBACK_COLOR
  const highlighted = isPriority && !item.isDone

  return (
    <PressableScale
      onPress={item.isDone || isPending ? undefined : onDone}
      disabled={item.isDone || isPending}
      accessibilityRole="button"
      accessibilityState={{ checked: item.isDone, disabled: item.isDone || isPending }}
      className={`w-full flex-row items-center ${
        compact ? 'gap-2.5 rounded-button p-3' : 'gap-3.5 rounded-row p-4'
      } ${item.isDone ? 'bg-shell-light opacity-60' : 'bg-white'} ${highlighted ? 'border-2' : ''}`}
      style={
        highlighted
          ? [{ borderColor: color }, coloredShadow(color, 'lg', 0.35)]
          : item.isDone
            ? undefined
            : shadow('sm')
      }>
      <View
        className={`items-center justify-center ${
          compact ? 'h-[38px] w-[38px] rounded-[10px]' : 'h-12 w-12 rounded-[13px]'
        }`}
        style={{
          backgroundColor: item.isDone
            ? tokens.colors['surface-muted']
            : mixWithWhite(color, 15),
        }}>
        <Text style={{ fontSize: compact ? 18 : 24 }}>{subject?.icon ?? '📚'}</Text>
      </View>

      <View className="min-w-0 flex-1">
        <Text
          numberOfLines={1}
          className={`font-display-extrabold text-text-primary ${compact ? 'text-[13px]' : 'text-[15px]'} ${
            item.isDone ? 'line-through' : ''
          }`}>
          {item.homeworkNote || subject?.name || 'Bài tập'}
        </Text>
        {subject ? (
          <Text
            className={`mt-0.5 font-display-bold text-text-secondary ${compact ? 'text-[11px]' : 'text-xs'}`}>
            {subject.name}
          </Text>
        ) : null}
      </View>

      {highlighted ? (
        <View
          className="rounded-pill px-2 py-0.5"
          style={{ backgroundColor: mixWithWhite(color, 12) }}>
          <Text className="font-display-extrabold text-[10px]" style={{ color }}>
            Ưu tiên
          </Text>
        </View>
      ) : null}

      <View
        className={`items-center justify-center rounded-pill ${
          compact ? 'h-[26px] w-[26px]' : 'h-8 w-8'
        } ${item.isDone ? 'bg-progress-complete' : 'border-[3px] border-border-soft bg-white'}`}>
        {item.isDone ? (
          <Text className={`font-display-extrabold text-white ${compact ? 'text-xs' : 'text-sm'}`}>✓</Text>
        ) : null}
      </View>
    </PressableScale>
  )
}
