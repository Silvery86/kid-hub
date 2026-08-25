// Parent · kid access — web's parent/kid-access (KidAccessView).
import {
  DEFAULT_KID_ACCESS_TOGGLES,
  KID_ACCESS_FEATURES,
  KID_ACCESS_GROUP_LABELS,
  type KidAccessGroup,
} from '@kid-hub/shared'
import { Redirect } from 'expo-router'
import { useEffect, useState } from 'react'
import { ScrollView, Text, View } from 'react-native'

import { AccessToggleRow } from '@/components/parent/access-toggle-row'
import { KidPatternSetup } from '@/components/parent/kid-pattern-setup'
import { RecentActivityPanel } from '@/components/parent/recent-activity-panel'
import { ScreenTimePanel } from '@/components/parent/screen-time-panel'
import { FadeSlideUp, STAGGER_MS } from '@/components/ui/animated'
import { Screen } from '@/components/ui/screen'
import { shadow } from '@/lib/shadows'
import {
  useKidAccessSettings,
  useRecentActivity,
  useSaveKidAccessSettings,
  useScreenTime,
  useSetScreenTimeLimit,
} from '@/hooks/use-parent'
import { useParentGate } from '@/hooks/use-parent-gate'

const GROUPS: KidAccessGroup[] = ['games', 'views', 'settings']

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="gap-3 rounded-card bg-white p-4" style={shadow('sm')}>
      <Text className="font-display-extrabold text-base text-text-primary">{title}</Text>
      {children}
    </View>
  )
}

export default function KidAccessScreen() {
  const { isVerified } = useParentGate()
  const settings = useKidAccessSettings()
  const saveSettings = useSaveKidAccessSettings()
  const screenTime = useScreenTime()
  const setLimit = useSetScreenTimeLimit()
  const activity = useRecentActivity(10)

  const [toggles, setToggles] = useState<Record<string, boolean>>(DEFAULT_KID_ACCESS_TOGGLES)

  // Adopt the saved map once it arrives; null means never customised.
  useEffect(() => {
    if (settings.data) setToggles(settings.data)
  }, [settings.data])

  if (!isVerified) return <Redirect href="/parent/pin" />

  const toggle = (id: string, next: boolean) => {
    const updated = { ...toggles, [id]: next }
    setToggles(updated)
    saveSettings.mutate(updated)
  }

  return (
    <Screen variant="parent" bare>
      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-3 px-3.5 pb-6 pt-3.5"
        showsVerticalScrollIndicator={false}>
        <Text className="font-display-extrabold text-2xl text-text-primary">Quyền của bé 🔐</Text>

        <FadeSlideUp delay={STAGGER_MS[0]}>
          <Card title="Thời gian dùng máy">
            {screenTime.data ? (
              <ScreenTimePanel
                screenTime={screenTime.data}
                isSaving={setLimit.isPending}
                onChangeLimit={(mins) => setLimit.mutate(mins)}
              />
            ) : (
              <Text className="font-display-bold text-xs text-text-muted">Đang tải…</Text>
            )}
          </Card>
        </FadeSlideUp>

        <FadeSlideUp delay={STAGGER_MS[1]} className="gap-3">
          {GROUPS.map((group) => (
            <Card key={group} title={KID_ACCESS_GROUP_LABELS[group]}>
              <View className="gap-2">
                {KID_ACCESS_FEATURES.filter((f) => f.group === group).map((feature) => (
                  <AccessToggleRow
                    key={feature.id}
                    feature={feature}
                    enabled={toggles[feature.id] ?? true}
                    disabled={saveSettings.isPending}
                    onToggle={(next) => toggle(feature.id, next)}
                  />
                ))}
              </View>
            </Card>
          ))}
        </FadeSlideUp>

        <FadeSlideUp delay={STAGGER_MS[2]} className="gap-3">
          <Card title="Mã mở khóa cho bé">
            <KidPatternSetup />
          </Card>

          <Card title="Hoạt động gần đây">
            <RecentActivityPanel activities={activity.data ?? []} />
          </Card>
        </FadeSlideUp>
      </ScrollView>
    </Screen>
  )
}
