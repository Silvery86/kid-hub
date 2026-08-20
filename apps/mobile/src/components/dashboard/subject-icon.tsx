// subject-icon.tsx — web's dashboard/SubjectIcon.tsx.

import { getSubjectById } from '@kid-hub/shared'
import { Text, View } from 'react-native'

interface SubjectIconProps {
  subjectId: string
  size?: number
  rounded?: number
  className?: string
}

export function SubjectIcon({ subjectId, size = 40, rounded = 12, className = '' }: SubjectIconProps) {
  const subject = getSubjectById(subjectId)

  if (!subject) {
    return (
      <View
        className={`bg-surface-muted ${className}`.trim()}
        style={{ width: size, height: size, borderRadius: rounded }}
      />
    )
  }

  return (
    <View
      className={`items-center justify-center ${className}`.trim()}
      style={{ width: size, height: size, borderRadius: rounded, backgroundColor: subject.color }}>
      <Text style={{ fontSize: Math.round(size * 0.45) }}>{subject.icon}</Text>
    </View>
  )
}
