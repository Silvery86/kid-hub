/** TabletPageContainer — master page wrapper enforcing layout boundaries and PWA native-feel behaviour. */

import { cn } from '@/lib/utils'

export interface TabletPageContainerProps {
  children: React.ReactNode
  className?: string
}

/**
 * Master page wrapper applied to every main page in the app.
 * Enforces layout boundaries and PWA native-feel behaviours.
 *
 * Usage: Wrap the root element of EVERY page.tsx in (dashboard)/ and (games)/.
 */
export const TabletPageContainer = ({ children, className }: TabletPageContainerProps) => (
  <main
    className={cn(
      'min-h-dvh w-full',
      'overscroll-none', // Kills pull-to-refresh
      'select-none', // No text selection on long-press → native app feel
      '[touch-action:manipulation]', // Removes 300ms tap delay
      'bg-shell-kid', // Default kid page background (@theme)
      className
    )}
  >
    {children}
  </main>
)
