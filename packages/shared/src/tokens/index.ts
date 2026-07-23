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
