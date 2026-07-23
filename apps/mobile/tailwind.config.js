/** @type {import('tailwindcss').Config} */
// Semantic design tokens come from @kid-hub/shared (Phase 8): the preset is
// generated from packages/shared/src/tokens/tokens.json — the same source that
// drives web's @theme. Edit tokens.json + run `pnpm -C packages/shared tokens`.
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset'), require('@kid-hub/shared/tailwind-preset')],
  theme: {
    extend: {},
  },
  plugins: [],
}
