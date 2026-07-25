import type { ButtonHTMLAttributes } from 'react'

import { cn } from '../../utils/cn'

export interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean
}

export function Chip({
  selected = false,
  className,
  children,
  type = 'button',
  ...props
}: ChipProps) {
  return (
    <button
      type={type}
      aria-pressed={selected}
      className={cn(
        'inline-flex min-h-8 cursor-pointer items-center rounded-full border px-3 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50',
        selected
          ? 'border-brand-950 bg-brand-950 text-white'
          : 'border-border-soft bg-white text-brand-950 hover:border-brand-950',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
