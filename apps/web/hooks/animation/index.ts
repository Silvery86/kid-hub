/**
 * The motion foundation's hook layer (N0).
 *
 * Client-only and domain-free: these know about time and geometry, never about
 * homework, badges or schedules. Nothing here imports from server/.
 */

export { useReducedMotion } from './useReducedMotion'
export { usePrevious } from './usePrevious'
export { useCountUp, type UseCountUpOptions } from './useCountUp'
export { useStagger } from './useStagger'
export { useAnimatedMount, type AnimatedMount, type MountState } from './useAnimatedMount'
export { useFlash } from './useFlash'
export { useCelebration, celebration, type Celebration } from './useCelebration'
