import type { KeyboardEvent } from 'react'

import { cn } from '../../utils/cn'

export interface SortOption {
  value: string
  label: string
}

const defaultSortOptions: SortOption[] = [
  { value: 'most-viewed', label: 'پربازدیدترین' },
  { value: 'best-selling', label: 'پرفروش‌ترین' },
  { value: 'popular', label: 'محبوب‌ترین' },
  { value: 'newest', label: 'جدیدترین' },
  { value: 'cheapest', label: 'ارزان‌ترین' },
  { value: 'most-expensive', label: 'گران‌ترین' },
]

export interface SortBarProps {
  value: string
  onChange?: (value: string) => void
  options?: SortOption[]
  label?: string
  className?: string
}

export function SortBar({
  value,
  onChange,
  options = defaultSortOptions,
  label = 'مرتب‌سازی:',
  className,
}: SortBarProps) {
  const selectedIndex = options.findIndex((option) => option.value === value)

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, currentIndex: number) => {
    let nextIndex: number | undefined

    if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
      nextIndex = (currentIndex + 1) % options.length
    } else if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
      nextIndex = (currentIndex - 1 + options.length) % options.length
    } else if (event.key === 'Home') {
      nextIndex = 0
    } else if (event.key === 'End') {
      nextIndex = options.length - 1
    }

    if (nextIndex === undefined || options.length === 0) return

    event.preventDefault()
    const nextOption = options[nextIndex]
    if (!nextOption) return

    onChange?.(nextOption.value)
    const nextButton = event.currentTarget.parentElement?.querySelector<HTMLButtonElement>(
      `[data-sort-index="${nextIndex}"]`,
    )
    nextButton?.focus()
  }

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-x-1 gap-y-2 rounded-df-md border border-border-soft bg-white p-2 shadow-sm',
        className,
      )}
      role="radiogroup"
      aria-label="مرتب‌سازی محصولات"
    >
      <span className="px-2 text-xs font-extrabold text-brand-950">{label}</span>
      {options.map((option, index) => {
        const selected = option.value === value

        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            data-sort-index={index}
            tabIndex={index === (selectedIndex >= 0 ? selectedIndex : 0) ? 0 : -1}
            className={cn(
              'min-h-8 cursor-pointer whitespace-nowrap rounded-df-sm border px-3 text-xs font-bold transition-colors duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500/30',
              selected
                ? 'border-accent-500 bg-accent-500 text-white shadow-[0_3px_8px_rgba(248,139,36,0.24)] hover:bg-[#e97812]'
                : 'border-transparent bg-transparent text-muted hover:bg-canvas hover:text-brand-950',
            )}
            onKeyDown={(event) => handleKeyDown(event, index)}
            onClick={() => onChange?.(option.value)}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
