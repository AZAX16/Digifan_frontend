import type { ButtonHTMLAttributes, ReactNode } from 'react'

import { cn } from '../../utils/cn'

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string
  icon: ReactNode
  size?: 'sm' | 'md' | 'lg'
  selected?: boolean
}

const sizes = {
  sm: 'size-8',
  md: 'size-10',
  lg: 'size-12',
}

export function IconButton({
  label,
  icon,
  size = 'md',
  selected = false,
  className,
  type = 'button',
  ...props
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      aria-pressed={selected || undefined}
      className={cn(
        'inline-flex cursor-pointer items-center justify-center rounded-df-sm border transition-colors disabled:cursor-not-allowed disabled:opacity-45',
        selected
          ? 'border-brand-950 bg-brand-950 text-white'
          : 'border-border bg-white text-brand-950 hover:border-brand-950 hover:bg-brand-950/5',
        sizes[size],
        className,
      )}
      {...props}
    >
      {icon}
    </button>
  )
}
