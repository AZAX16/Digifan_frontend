import { useEffect, useRef, type RefObject } from 'react'

const focusableSelector = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'textarea:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

interface DialogLifecycleOptions {
  open?: boolean
  closeDisabled?: boolean
}

export function useDialogLifecycle<T extends HTMLElement>(
  dialogRef: RefObject<T | null>,
  onClose: () => void,
  {
    open = true,
    closeDisabled = false,
  }: DialogLifecycleOptions = {},
) {
  const onCloseRef = useRef(onClose)
  const closeDisabledRef = useRef(closeDisabled)

  useEffect(() => {
    onCloseRef.current = onClose
    closeDisabledRef.current = closeDisabled
  }, [closeDisabled, onClose])

  useEffect(() => {
    if (!open) return

    const dialog = dialogRef.current
    const previouslyFocused = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null
    const previousBodyOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const focusFrame = window.requestAnimationFrame(() => {
      const initialFocus = dialog?.querySelector<HTMLElement>('[data-dialog-initial-focus]')
        ?? dialog?.querySelector<HTMLElement>(focusableSelector)
      initialFocus?.focus()
      if (!dialog?.contains(document.activeElement)) dialog?.focus()
    })

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (!closeDisabledRef.current) onCloseRef.current()
        return
      }
      if (event.key !== 'Tab' || !dialog) return

      const focusableElements = [...dialog.querySelectorAll<HTMLElement>(focusableSelector)]
      if (focusableElements.length === 0) {
        event.preventDefault()
        dialog.focus()
        return
      }

      const firstElement = focusableElements[0]
      const lastElement = focusableElements.at(-1)
      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault()
        lastElement?.focus()
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault()
        firstElement?.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      window.cancelAnimationFrame(focusFrame)
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousBodyOverflow
      if (previouslyFocused?.isConnected) previouslyFocused.focus()
    }
  }, [dialogRef, open])
}