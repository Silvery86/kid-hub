// badge-modal.tsx — web's dashboard/BadgeModal.tsx.
//
// Web reads earned badges out of localStorage via useUserProgress; mobile takes
// the ids from GET /api/v1/progress, so the grid reflects the server rather than
// the device. Four columns is too tight on a phone, so the grid is two-up.

import { BADGE_DEFINITIONS } from '@kid-hub/shared'
import { ScrollView, Text, View } from 'react-native'

import { FullScreenModal } from '@/components/ui/full-screen-modal'

interface BadgeModalProps {
  isOpen: boolean
  onClose: () => void
  earnedBadgeIds: string[]
  kidName: string
}

export function BadgeModal({ isOpen, onClose, earnedBadgeIds, kidName }: BadgeModalProps) {
  const earned = new Set(earnedBadgeIds)

  return (
    <FullScreenModal isOpen={isOpen} onClose={onClose}>
      <ScrollView className="flex-1 bg-shell-dark" contentContainerClassName="p-8">
        <View className="mb-8 items-center">
          <Text className="font-display-bold text-4xl text-white">Huy hiệu của {kidName} 🏆</Text>
          <Text className="mt-2 text-lg text-text-muted">
            {earned.size} / {BADGE_DEFINITIONS.length} đã đạt được
          </Text>
        </View>

        <View className="flex-row flex-wrap gap-4 pb-8">
          {BADGE_DEFINITIONS.map((def) => {
            const isEarned = earned.has(def.id)
            return (
              <View
                key={def.id}
                className={`min-w-[140px] flex-1 items-center gap-2 rounded-card p-5 ${
                  isEarned ? 'bg-white/15' : 'bg-white/5'
                }`}
                style={{ opacity: isEarned ? 1 : 0.5 }}>
                <Text style={{ fontSize: 44 }}>{isEarned ? def.iconEmoji : '🔒'}</Text>
                <Text
                  className={`text-center font-display-bold text-sm ${
                    isEarned ? 'text-white' : 'text-text-secondary'
                  }`}>
                  {def.name}
                </Text>
                <Text
                  className={`text-center text-xs ${isEarned ? 'text-text-subtle' : 'text-text-secondary'}`}>
                  {isEarned ? def.description : '???'}
                </Text>
              </View>
            )
          })}
        </View>
      </ScrollView>
    </FullScreenModal>
  )
}
