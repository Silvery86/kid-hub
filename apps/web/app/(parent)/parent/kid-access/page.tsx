export const dynamic = 'force-dynamic'

import { KidAccessView } from '@/components/parent/kid-access/KidAccessView'
import { getKidProgressAction } from '@/server/actions/kid-progress.actions'
import { getKidAccessSettingsAction, getRecentActivityAction } from '@/server/actions/kid-access.actions'
import { getScreenTimeAction } from '@/server/actions/screen-time.actions'
import { getKidPatternStatusAction } from '@/server/actions/auth.actions'
import { DEFAULT_KID_ACCESS_TOGGLES } from '@/lib/data/kid-access'

export default async function KidAccessPage() {
  const [progressResult, settingsResult, screenTimeResult, activityResult, patternStatus] =
    await Promise.all([
      getKidProgressAction(),
      getKidAccessSettingsAction(),
      getScreenTimeAction(),
      getRecentActivityAction(10),
      getKidPatternStatusAction(),
    ])
  // Keyed by the child on screen. Every prop below is per-student, and the
  // header switcher can change which one that is without unmounting the view —
  // React would keep the previous child's state and show it under the new
  // child's name.
  return (
    <KidAccessView
      key={patternStatus.studentId ?? 'no-student'}
      kidProgress={progressResult.success ? progressResult.data : null}
      initialToggles={settingsResult.success ? (settingsResult.data ?? DEFAULT_KID_ACCESS_TOGGLES) : DEFAULT_KID_ACCESS_TOGGLES}
      screenTime={screenTimeResult.success ? (screenTimeResult.data ?? { usedSecs: 0, limitMins: 120 }) : { usedSecs: 0, limitMins: 120 }}
      recentActivity={activityResult.success ? activityResult.data : []}
      hasKidPattern={patternStatus.hasPattern}
    />
  )
}
