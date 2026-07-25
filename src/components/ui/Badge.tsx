import type { HTMLAttributes } from 'react'

import { cn } from '../../utils/cn'

export type BadgeVariant = 'brand' | 'accent' | 'neutral' | 'success' | 'danger'

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
}

const variants: Record<BadgeVariant, string> = {
  brand: 'bg-brand-950 text-white',
  accent: 'bg-accent-500 text-white',
  neutral: 'bg-[#e8ebed] text-brand-950',
  success: 'bg-success-600 text-white',
  danger: 'bg-danger-600 text-white',
}

export function Badge({
  variant = 'brand',
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex min-h-6 items-center justify-center rounded-df-sm px-3 text-xs font-medium leading-none',
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  )
}
