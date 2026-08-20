// shadows.ts — the RN half of the shadow tokens.
//
// Elevation is the one design token that cannot travel as a class name.
// NativeWind's `shadow-*` mapping is incomplete on Android, and RN splits a
// single CSS shadow across five style props, so the values live in
// `@kid-hub/shared` (tokens.json → `shadows`) and are converted here.
// Web keeps Tailwind's own `shadow-{sm,lg,xl}`, which these mirror.

import type { ViewStyle } from 'react-native'
import { tokens, type ShadowName, type ShadowToken } from '@kid-hub/shared'

const SHADOWS = tokens.shadows as Record<ShadowName, ShadowToken>

/**
 * CSS blur is roughly twice RN's `shadowRadius` (which is a Gaussian sigma),
 * so halving is what keeps an iOS card looking like its web counterpart.
 */
const toStyle = (t: ShadowToken, color: string, opacity: number): ViewStyle => ({
  shadowColor: color,
  shadowOffset: { width: 0, height: t.offsetY },
  shadowOpacity: opacity,
  shadowRadius: t.blur / 2,
  elevation: t.elevation,
})

/** Neutral elevation — `shadow('lg')` is web's `shadow-lg`. */
export const shadow = (name: ShadowName): ViewStyle =>
  toStyle(SHADOWS[name], SHADOWS[name].color, SHADOWS[name].opacity)

/**
 * Tinted elevation, as web does for subject cards
 * (`0 20px 40px -20px {subjectColor}`) and primary buttons
 * (`0 4px 10px -3px rgba(59,130,246,0.55)`). Web pulls the colour back with a
 * negative spread, which RN has no equivalent for — the raised opacity is the
 * closest match.
 */
export const coloredShadow = (
  color: string,
  name: ShadowName = 'lg',
  opacity = 0.45
): ViewStyle => toStyle(SHADOWS[name], color, opacity)
