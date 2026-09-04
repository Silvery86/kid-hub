// student-switcher.tsx — which child the parent screens are about.
//
// Hidden for a one-child household: a chooser with a single option is noise.
import { Text, View } from 'react-native'

import { PressableScale } from '@/components/ui/animated'
import { useStudent } from '@/hooks/use-student'

export function StudentSwitcher() {
  const { students, studentId, switchTo } = useStudent()

  if (students.length < 2) return null

  return (
    <View className="mb-4 flex-row flex-wrap gap-2">
      {students.map((student) => {
        const isActive = student.id === studentId
        return (
          <PressableScale
            key={student.id}
            onPress={() => switchTo(student.id)}
            accessibilityRole="button"
            accessibilityLabel={`Xem dữ liệu của ${student.name}`}
            accessibilityState={{ selected: isActive }}
            className={
              isActive
                ? 'rounded-button bg-btn-primary px-4 py-2'
                : 'rounded-button border-2 border-white/20 bg-white/10 px-4 py-2'
            }>
            <Text
              className={
                isActive
                  ? 'font-display-extrabold text-sm text-white'
                  : 'font-display-bold text-sm text-text-secondary'
              }>
              {student.name}
            </Text>
          </PressableScale>
        )
      })}
    </View>
  )
}
