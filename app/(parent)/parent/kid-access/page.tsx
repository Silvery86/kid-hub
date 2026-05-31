export const dynamic = 'force-dynamic'

import { KidAccessView } from '@/components/parent/kid-access/KidAccessView'
import { getKidProgressAction } from '@/server/actions/kid-progress.actions'
import { getKidAccessSettingsAction, getRecentActivityAction } from '@/server/actions/kid-access.actions'
import { getScreenTimeAction } from '@/server/actions/screen-time.actions'
import { DEFAULT_KID_ACCESS_TOGGLES } from '@/lib/data/kid-access'

export default async function KidAccessPage() {
  const [progressResult, settingsResult, screenTimeResult, activityResult] = await Promise.all([
    getKidProgressAction(),
    getKidAccessSettingsAction(),
    getScreenTimeAction(),
    getRecentActivityAction(10),
  ])
  return (
    <KidAccessView
      kidProgress={progressResult.data ?? null}
      initialToggles={settingsResult.data ?? DEFAULT_KID_ACCESS_TOGGLES}
      screenTime={screenTimeResult.data ?? { usedSecs: 0, limitMins: 120 }}
      recentActivity={activityResult.data ?? []}
    />
  )
}
