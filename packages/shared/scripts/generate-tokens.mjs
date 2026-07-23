// generate-tokens.mjs — regenerate the platform token artifacts from tokens.json.
// One source of truth (src/tokens/tokens.json) → two committed outputs:
//   • apps/web/app/tokens.generated.css  — the Tailwind v4 `@theme` block
//   • packages/shared/tailwind-preset.cjs — the mobile NativeWind `theme.extend`
// Run: pnpm -C packages/shared tokens
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const tokens = JSON.parse(readFileSync(resolve(here, '../src/tokens/tokens.json'), 'utf8'))

const AUTOGEN = 'AUTO-GENERATED from packages/shared/src/tokens/tokens.json — do not edit by hand.'

// ── Web: @theme block ────────────────────────────────────────────────────────
const themeLines = [
  `/* ${AUTOGEN} */`,
  '@theme {',
  '  --font-sans: var(--font-display);',
  '',
  ...Object.entries(tokens.colors).map(([k, v]) => `  --color-${k}: ${v};`),
  '',
  ...Object.entries(tokens.radius).map(([k, v]) => `  --radius-${k}: ${v};`),
  '',
  ...Object.entries(tokens.spacing).map(([k, v]) => `  --spacing-${k}: ${v};`),
  '}',
  '',
]
writeFileSync(resolve(here, '../../../apps/web/app/tokens.generated.css'), themeLines.join('\n'))

// ── Mobile: NativeWind preset (CommonJS, required by tailwind.config.js) ──────
const preset = {
  theme: {
    extend: {
      colors: tokens.colors,
      borderRadius: tokens.radius,
      spacing: tokens.spacing,
      fontFamily: { display: tokens.fonts.display.split(',').map((s) => s.trim()) },
    },
  },
}
const presetFile = [
  `// ${AUTOGEN}`,
  `module.exports = ${JSON.stringify(preset, null, 2)}`,
  '',
].join('\n')
writeFileSync(resolve(here, '../tailwind-preset.cjs'), presetFile)

console.log('✓ tokens generated → apps/web/app/tokens.generated.css + packages/shared/tailwind-preset.cjs')
