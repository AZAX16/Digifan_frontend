import type { KeyboardEvent } from 'react'

import { cn } from '../../utils/cn'
import { Icon } from './Icon'

export interface RatingProps {
  value: number
  max?: number
  size?: number
  label?: string
  onChange?: (value: number) => void
  className?: string
}

const ratingFormatter = new Intl.NumberFormat('fa-IR')

export function Rating({
  value,
  max = 5,
  size = 24,
  label = 'امتیاز محصول',
  onChange,
  className,
}: RatingProps) {
  const safeMax = Number.isFinite(max) ? Math.min(10, Math.max(1, Math.floor(max))) : 5
  const safeValue = Number.isFinite(value) ? value : 0
  const normalizedValue = Math.max(0, Math.min(safeMax, safeValue))
  const selectedValue = Math.round(normalizedValue)

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, currentValue: number) => {
    let nextValue: number | undefined

    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      nextValue = Math.min(safeMax, currentValue + 1)
    } else if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      nextValue = Math.max(1, currentValue - 1)
    } else if (event.key === 'Home') {
      nextValue = 1
    } else if (event.key === 'End') {
      nextValue = safeMax
    }

    if (nextValue === undefined) return

    event.preventDefault()
    onChange?.(nextValue)
    const nextButton = event.currentTarget.parentElement?.querySelector<HTMLButtonElement>(
      `[data-rating-value="${nextValue}"]`,
    )
    nextButton?.focus()
  }

  return (
    <div
      className={cn('inline-flex items-center', className)}
      role={onChange ? 'radiogroup' : 'img'}
      aria-label={`${label}: ${ratingFormatter.format(normalizedValue)} از ${ratingFormatter.format(safeMax)}`}
      dir="rtl"
    >
      {Array.from({ length: safeMax }, (_, index) => {
        const starValue = index + 1
        const active = starValue <= selectedValue
        const star = (
          <Icon
            name="star"
            size={size}
            tone={active ? 'var(--df-warning-400)' : '#d4d6d8'}
          />
        )

        if (!onChange) {
          return <span key={starValue}>{star}</span>
        }

        return (
          <button
            key={starValue}
            type="button"
            role="radio"
            aria-checked={starValue === selectedValue}
            aria-label={`${ratingFormatter.format(starValue)} از ${ratingFormatter.format(safeMax)}`}
            data-rating-value={starValue}
            tabIndex={starValue === (selectedValue || 1) ? 0 : -1}
            className="cursor-pointer rounded-sm border-0 bg-transparent p-0 transition-transform duration-150 hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500"
            onKeyDown={(event) => handleKeyDown(event, starValue)}
            onClick={() => onChange(starValue)}
          >
            {star}
          </button>
        )
      })}
    </div>
  )
}
