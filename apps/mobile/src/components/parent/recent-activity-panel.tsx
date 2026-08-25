// recent-activity-panel.tsx — web's kid-access/RecentActivityPanel.tsx.

import type { ActivityItem } from '@kid-hub/shared'
import { Text, View } from 'react-native'

import { shadow } from '@/lib/shadows'

/** "Hôm nay HH:MM" for today's events, bare HH:MM for older ones — as on web. */
function formatTime(iso: string): string {
  const d = new Date(iso)
  const today = new Date().toISOString().split('T')[0]
  const eventDay = iso.split('T')[0]
  const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  return eventDay === today ? `Hôm nay ${time}` : time
}

export function RecentActivityPanel({ activities }: { activities: ActivityItem[] }) {
  if (activities.length === 0) {
    return (
      <View className="items-center gap-2 py-6">
        <Text style={{ fontSize: 24 }}>🎮</Text>
        <Text className="font-display-semibold text-xs text-text-muted">
          Chưa có hoạt động nào
        </Text>
      </View>
    )
  }

  return (
    <View className="gap-2">
      {activities.map((a) => (
        <View
          key={a.id}
          className="flex-row items-center gap-3 rounded-button bg-white p-3"
          style={shadow('sm')}>
          <Text style={{ fontSize: 20 }}>{a.iconKey ?? '📋'}</Text>
          <View className="min-w-0 flex-1">
            <Text numberOfLines={1} className="font-display-bold text-sm text-text-primary">
              {a.label}
            </Text>
            <Text className="mt-0.5 font-display-semibold text-xs text-text-muted">
              {formatTime(a.createdAt)}
            </Text>
          </View>
        </View>
      ))}
    </View>
  )
}
