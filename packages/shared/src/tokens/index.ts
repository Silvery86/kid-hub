/**
 * Design tokens — the single source of truth for colors, radii, spacing and the
 * display font, shared by web (Tailwind v4 `@theme`) and mobile (NativeWind preset).
 *
 * Values live in `tokens.json` so a plain Node script can read them too
 * (`scripts/generate-tokens.mjs`), which regenerates:
 *   • `apps/web/app/tokens.generated.css`   (the web `@theme` block)
 *   • `packages/shared/tailwind-preset.cjs`  (the mobile `theme.extend`)
 * Change a value here → run `pnpm -C packages/shared tokens` → both apps shift.
 */
import tokens from './tokens.json'

export type TokenColorName = keyof (typeof tokens)['colors']

export { tokens }
export default tokens

/** One elevation step, expressed platform-neutrally (see `tokens.json` → `shadows`). */
export interface ShadowToken {
  /** Downward offset in px — CSS y-offset and RN `shadowOffset.height`. */
  offsetY: number
  /** CSS blur radius in px. RN's `shadowRadius` is half this value. */
  blur: number
  color: string
  opacity: number
  /** Android `elevation`, which ignores every other field. */
  elevation: number
}

export type ShadowName = keyof (typeof tokens)['shadows']
