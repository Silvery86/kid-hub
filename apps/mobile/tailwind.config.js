/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    // Phase 5 (§17): replace with the shared token preset from packages/shared.
    extend: {},
  },
  plugins: [],
}
