// animated.tsx — the motion primitives, ported 1:1 from web's globals.css.
//
// Web values these mirror:
//   .animate-fade-slide-up  fadeSlideUp 0.4s  cubic-bezier(0.16, 1, 0.3, 1)  (opacity 0→1, y 12→0)
//   .animate-pop-in         popIn       0.35s cubic-bezier(0.16, 1, 0.3, 1)  (opacity 0→1, scale 0.85→1)
//   active:scale-[0.97]     press feedback
//   @media (prefers-reduced-motion: reduce) → animations effectively off
//
// Reanimated's useReducedMotion() is the RN counterpart of that media query; when
// it is on, every entrance renders at its final frame instead of animating.

import { useEffect } from 'react'
import { Pressable, type PressableProps, type ViewProps } from 'react-native'
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated'

const EASE = Easing.bezier(0.16, 1, 0.3, 1)

const FADE_SLIDE_MS = 400
const POP_MS = 350
const PRESS_MS = 120

const SLIDE_FROM_Y = 12
const POP_FROM_SCALE = 0.85
const PRESS_SCALE = 0.97

/** Web's section entrance stagger — 0.08s / 0.14s / 0.18s, in order. */
export const STAGGER_MS = [80, 140, 180] as const

interface EnterProps extends ViewProps {
  /** Entrance delay in ms — pass `STAGGER_MS[n]` to match web's section order. */
  delay?: number
}

/** Fades and lifts its children into place. Web's `.animate-fade-slide-up`. */
export function FadeSlideUp({ delay = 0, style, children, ...rest }: EnterProps) {
  const reduceMotion = useReducedMotion()
  const progress = useSharedValue(reduceMotion ? 1 : 0)

  useEffect(() => {
    if (reduceMotion) {
      progress.value = 1
      return
    }
    progress.value = withDelay(delay, withTiming(1, { duration: FADE_SLIDE_MS, easing: EASE }))
  }, [delay, progress, reduceMotion])

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * SLIDE_FROM_Y }],
  }))

  return (
    <Animated.View style={[style, animatedStyle]} {...rest}>
      {children}
    </Animated.View>
  )
}

/** Scales its children up from 0.85. Web's `.animate-pop-in`. */
export function PopIn({ delay = 0, style, children, ...rest }: EnterProps) {
  const reduceMotion = useReducedMotion()
  const progress = useSharedValue(reduceMotion ? 1 : 0)

  useEffect(() => {
    if (reduceMotion) {
      progress.value = 1
      return
    }
    progress.value = withDelay(delay, withTiming(1, { duration: POP_MS, easing: EASE }))
  }, [delay, progress, reduceMotion])

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: POP_FROM_SCALE + (1 - POP_FROM_SCALE) * progress.value }],
  }))

  return (
    <Animated.View style={[style, animatedStyle]} {...rest}>
      {children}
    </Animated.View>
  )
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

/**
 * A Pressable that dips to 0.97 while held — web's `active:scale-[0.97]`.
 * Driven from onPressIn/onPressOut rather than the `pressed` render prop so the
 * scale runs on the UI thread and survives a busy JS thread.
 */
export function PressableScale({ style, onPressIn, onPressOut, children, ...rest }: PressableProps) {
  const reduceMotion = useReducedMotion()
  const scale = useSharedValue(1)

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))

  return (
    <AnimatedPressable
      style={[style as PressableProps['style'], animatedStyle]}
      onPressIn={(e) => {
        if (!reduceMotion) scale.value = withTiming(PRESS_SCALE, { duration: PRESS_MS, easing: EASE })
        onPressIn?.(e)
      }}
      onPressOut={(e) => {
        if (!reduceMotion) scale.value = withTiming(1, { duration: PRESS_MS, easing: EASE })
        onPressOut?.(e)
      }}
      {...rest}>
      {children}
    </AnimatedPressable>
  )
}
