'use client'

/**
 * ConfirmDialog — a two-answer question in front of a change that is hard to undo.
 *
 * Built on FullScreenModal so the portal, the scroll lock and the enter/exit
 * animation have one implementation. What it adds is the question itself: a
 * card, two labelled answers, and a pending state for the one that does work.
 *
 * Dismissing (Escape) is deliberately NOT the same as answering "no". Both
 * answers here change something — the cancel side of a confirm usually throws
 * away what the user just did — and a stray keypress must not be able to
 * trigger either. Escape closes the question and leaves the screen as it was.
 */

import { useEffect } from 'react'
import { FullScreenModal } from '@/components/ui/FullScreenModal'
import { KidButton } from '@/components/ui/KidButton'

export interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  description?: React.ReactNode
  confirmLabel: string
  cancelLabel: string
  /** Runs the action. */
  onConfirm: () => void
  /** The explicit "no" — usually undoes the edit that prompted the question. */
  onCancel: () => void
  /** Escape, or anything else that closes without answering. */
  onDismiss: () => void
  isPending?: boolean
  confirmVariant?: 'primary' | 'danger'
}

export const ConfirmDialog = ({
  isOpen,
  title,
  description,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  onDismiss,
  isPending = false,
  confirmVariant = 'primary',
}: ConfirmDialogProps) => {
  useEffect(() => {
    if (!isOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      // Not while the action is running: closing then would leave the user
      // unsure whether the save they started went through.
      if (e.key === 'Escape' && !isPending) onDismiss()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isOpen, isPending, onDismiss])

  return (
    <FullScreenModal
      isOpen={isOpen}
      hasCloseButton={false}
      className="flex items-center justify-center p-4"
    >
      <div
        role="document"
        className="flex w-full max-w-md flex-col gap-4 rounded-3xl border-4 border-slate-200 bg-white p-6 shadow-2xl"
      >
        <h2 className="text-lg font-black text-slate-800">{title}</h2>
        {description ? (
          <div className="text-sm font-bold text-slate-500">{description}</div>
        ) : null}

        <div className="mt-1 flex flex-col gap-2 sm:flex-row-reverse">
          <KidButton
            autoFocus
            variant={confirmVariant}
            onClick={onConfirm}
            isLoading={isPending}
            className="min-h-12 flex-1 text-base"
          >
            {confirmLabel}
          </KidButton>
          <KidButton
            variant="ghost"
            onClick={onCancel}
            isDisabled={isPending}
            className="min-h-12 flex-1 text-base"
          >
            {cancelLabel}
          </KidButton>
        </div>
      </div>
    </FullScreenModal>
  )
}
