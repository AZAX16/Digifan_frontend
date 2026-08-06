import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'

import { cn } from '../../utils/cn'
import { Chevron } from './Chevron'

export interface DropdownOption {
  value: string
  label: string
  disabled?: boolean
}

export interface DropdownProps {
  value?: string
  options: DropdownOption[]
  onChange?: (value: string) => void
  label?: string
  placeholder?: string
  hint?: string
  error?: string
  disabled?: boolean
  required?: boolean
  className?: string
}

function getEnabledIndex(options: DropdownOption[], startIndex: number, direction: 1 | -1) {
  if (options.length === 0) return -1

  let nextIndex = startIndex

  for (const _option of options) {
    nextIndex = (nextIndex + direction + options.length) % options.length

    if (!options[nextIndex]?.disabled) return nextIndex
  }

  return -1
}

export function Dropdown({
  value,
  options,
  onChange,
  label,
  placeholder = 'انتخاب کنید',
  hint,
  error,
  disabled = false,
  required = false,
  className,
}: DropdownProps) {
  const id = useId()
  const listboxId = `${id}-listbox`
  const descriptionId = error ?? hint ? `${id}-description` : undefined
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([])
  const [open, setOpen] = useState(false)
  const selectedIndex = options.findIndex((option) => option.value === value)
  const [activeIndex, setActiveIndex] = useState(() =>
    selectedIndex >= 0 ? selectedIndex : getEnabledIndex(options, -1, 1),
  )
  const selectedOption = options[selectedIndex]

  useEffect(() => {
    if (!open || activeIndex < 0) return

    const animationFrame = requestAnimationFrame(() => optionRefs.current[activeIndex]?.focus())
    return () => cancelAnimationFrame(animationFrame)
  }, [activeIndex, open])

  useEffect(() => {
    if (!open) return

    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const closeOnEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Escape') return

      setOpen(false)
      triggerRef.current?.focus()
    }

    document.addEventListener('pointerdown', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)

    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [open])

  const openMenu = (direction: 1 | -1) => {
    const startIndex = selectedIndex >= 0 ? selectedIndex - direction : direction === 1 ? -1 : 0
    setActiveIndex(getEnabledIndex(options, startIndex, direction))
    setOpen(true)
  }

  const selectOption = (option: DropdownOption) => {
    if (option.disabled) return

    onChange?.(option.value)
    setOpen(false)
    triggerRef.current?.focus()
  }

  const handleOptionKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex(getEnabledIndex(options, index, event.key === 'ArrowDown' ? 1 : -1))
      return
    }

    if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault()
      setActiveIndex(getEnabledIndex(options, event.key === 'Home' ? -1 : 0, event.key === 'Home' ? 1 : -1))
      return
    }

    if (event.key === 'Tab') setOpen(false)
  }

  return (
    <div ref={rootRef} className={cn('relative grid gap-1.5', className)}>
      {label && (
        <span className="text-sm font-bold text-ink">
          {label}
          {required && <span aria-hidden="true" className="mr-1 text-danger-600">*</span>}
        </span>
      )}
      <button
        ref={triggerRef}
        id={id}
        type="button"
        disabled={disabled}
        aria-controls={listboxId}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-describedby={descriptionId}

        aria-label={label ? `${label}: ${selectedOption?.label ?? placeholder}` : undefined}
        data-invalid={error ? true : undefined}
        className={cn(
          'flex min-h-11 w-full cursor-pointer items-center justify-between rounded-df-md border border-border-soft bg-white px-3 text-right text-sm text-ink shadow-sm transition-[background-color,border-color,color,opacity] duration-200 ease-out hover:border-border focus:border-brand-950 focus:outline-none disabled:cursor-not-allowed disabled:bg-[#f0f1f2] disabled:opacity-60',
          error && 'border-danger-600 focus:border-danger-600',
        )}
        onClick={() => {
          if (open) setOpen(false)
          else openMenu(1)
        }}
        onKeyDown={(event) => {
          if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return

          event.preventDefault()
          openMenu(event.key === 'ArrowDown' ? 1 : -1)
        }}
      >
        <span className={cn(!selectedOption && 'text-muted/75')}>
          {selectedOption?.label ?? placeholder}
        </span>
        <Chevron open={open} className="ml-1 text-brand-950" />
      </button>

      {open && (
        <div
          id={listboxId}
          role="listbox"
          aria-label={label ?? 'گزینه‌ها'}
          tabIndex={-1}
          className="absolute inset-x-0 top-full z-40 mt-1 max-h-72 overflow-y-auto overscroll-contain rounded-df-md border border-border-soft bg-white p-1 shadow-raised"
        >
          {options.map((option, index) => {
            const selected = option.value === value

            return (
              <button
                key={option.value}
                ref={(element) => {
                  optionRefs.current[index] = element
                }}
                type="button"
                role="option"
                aria-selected={selected}
                disabled={option.disabled}
                tabIndex={index === activeIndex ? 0 : -1}
                className={cn(
                  'flex min-h-10 w-full cursor-pointer items-center rounded-df-sm px-3 text-right text-sm transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent-500 disabled:cursor-not-allowed disabled:opacity-40',
                  selected
                    ? 'bg-accent-500/12 font-bold text-accent-500'
                    : 'text-ink hover:bg-canvas hover:text-brand-950',
                )}
                onMouseEnter={() => setActiveIndex(index)}
                onKeyDown={(event) => handleOptionKeyDown(event, index)}
                onClick={() => selectOption(option)}
              >
                {option.label}
              </button>
            )
          })}
        </div>
      )}

      {(error ?? hint) && (
        <p
          id={descriptionId}
          className={cn('m-0 text-xs', error ? 'text-danger-600' : 'text-muted')}
        >
          {error ?? hint}
        </p>
      )}
    </div>
  )
}
