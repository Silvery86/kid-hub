'use client'

/**
 * Transient feedback — the store behind every toast in the app.
 *
 * Deliberately a module-level store rather than a React context. The two route
 * group layouts render <Toaster /> as a *sibling* of {children}, so a provider
 * there would not wrap the components that need to raise a toast; making it a
 * provider instead would mean restructuring both layouts and threading a
 * boundary through server components that have no other reason to be client.
 *
 * A store means `toast.success(...)` is importable from any client component
 * with no ceremony, which is the whole point — fourteen components currently
 * hand-roll this, and the migration only succeeds if the replacement is easier
 * than what it replaces.
 *
 * Server Actions know nothing about any of this (D2). They keep returning
 * ActionResult<T>; the caller decides whether it is worth a toast. That keeps
 * actions callable from the mobile REST path, which has no toasts at all.
 */

import { useSyncExternalStore } from 'react'

import { DURATION_BASE } from '@/lib/motion'
import { idsToEvict, resolveDuration, type ToastTone } from '@/lib/toast-queue'

export type { ToastTone }

export interface ToastAction {
  label: string
  onClick: () => void
}

export interface ToastItem {
  id: string
  tone: ToastTone
  title: string
  description?: string
  /** ms before auto-dismiss; `null` pins it until the viewer acts. */
  duration: number | null
  action?: ToastAction
  /** Animating out. Held on screen until the exit finishes, then removed. */
  leaving: boolean
}

export interface ToastInput {
  title: string
  description?: string
  duration?: number | null
  action?: ToastAction
}

let toasts: ToastItem[] = []
const listeners = new Set<() => void>()
let sequence = 0

const emit = (): void => {
  listeners.forEach((fn) => fn())
}

const remove = (id: string): void => {
  toasts = toasts.filter((t) => t.id !== id)
  emit()
}

/** Start the exit, then drop it once the animation has had its time. */
const beginExit = (id: string): void => {
  const target = toasts.find((t) => t.id === id)
  if (!target || target.leaving) return
  toasts = toasts.map((t) => (t.id === id ? { ...t, leaving: true } : t))
  emit()
  if (typeof window === 'undefined') {
    remove(id)
    return
  }
  window.setTimeout(() => remove(id), DURATION_BASE)
}

const push = (tone: ToastTone, input: ToastInput): string => {
  const id = `toast-${++sequence}`

  const item: ToastItem = {
    id,
    tone,
    title: input.title,
    description: input.description,
    duration: resolveDuration(tone, input.duration),
    action: input.action,
    leaving: false,
  }

  toasts = [...toasts, item]
  // A fourth arrival evicts the oldest rather than growing the stack.
  idsToEvict(toasts).forEach(beginExit)

  emit()
  return id
}

const normalise = (input: ToastInput | string): ToastInput =>
  typeof input === 'string' ? { title: input } : input

export const toast = {
  success: (input: ToastInput | string): string => push('success', normalise(input)),
  error: (input: ToastInput | string): string => push('error', normalise(input)),
  info: (input: ToastInput | string): string => push('info', normalise(input)),
  /** Begin the exit animation for one toast. */
  dismiss: (id: string): void => beginExit(id),
  dismissAll: (): void => toasts.forEach((t) => beginExit(t.id)),
}

const subscribe = (onChange: () => void): (() => void) => {
  listeners.add(onChange)
  return () => listeners.delete(onChange)
}

const getSnapshot = (): ToastItem[] => toasts

/** Stable identity — a fresh array here would loop useSyncExternalStore. */
const EMPTY: ToastItem[] = []
const getServerSnapshot = (): ToastItem[] => EMPTY

/** Subscribe to the live list. Only <Toaster /> should need this. */
export const useToasts = (): ToastItem[] =>
  useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
