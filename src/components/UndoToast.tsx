import type { KeyboardEvent, Ref } from 'react'
import type { IsoDate } from '../lib/dates'
import { formatDate } from '../lib/format'
import { CheckIcon, CloseIcon } from './icons'

interface UndoToastProps {
  task: string
  propertyName: string
  nextDue: IsoDate
  /** The page moves focus here after Mark done, so Undo is one key press away. */
  undoRef: Ref<HTMLButtonElement>
  onUndo: () => void
  onDismiss: () => void
}

/**
 * Confirms a "mark done", says when the task is next due and offers to undo
 * it. It stays until it's closed, undone or replaced, so nobody has to race a
 * timer to reach Undo. Escape closes it.
 */
export function UndoToast({ task, propertyName, nextDue, undoRef, onUndo, onDismiss }: UndoToastProps) {
  function closeOnEscape(event: KeyboardEvent) {
    if (event.key === 'Escape') onDismiss()
  }

  return (
    <div className="toast">
      <CheckIcon className="toast-icon" />
      <p className="toast-message">
        <strong>{task}</strong> at {propertyName} marked done. Next due{' '}
        <span className="nowrap">{formatDate(nextDue)}</span>.
      </p>
      <button ref={undoRef} type="button" className="toast-undo" onClick={onUndo} onKeyDown={closeOnEscape}>
        Undo
      </button>
      <button
        type="button"
        className="toast-close"
        onClick={onDismiss}
        onKeyDown={closeOnEscape}
        aria-label="Close"
      >
        <CloseIcon />
      </button>
    </div>
  )
}
