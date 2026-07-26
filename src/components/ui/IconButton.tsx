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
  selected,
  className,
  type = 'button',
  ...props
}: IconButtonProps) {
  const isSelected = selected ?? false

  return (
    <button
      type={type}
      aria-label={label}
      aria-pressed={selected}
      className={cn(
        'inline-flex cursor-pointer items-center justify-center rounded-df-sm border shadow-[0_3px_8px_rgba(32,56,72,0.14)] transition-[background-color,border-color,color,opacity,transform] duration-200 ease-out hover:-translate-y-0.5 active:translate-y-[0.5px] disabled:cursor-not-allowed disabled:opacity-45',
        isSelected
          ? 'border-brand-950 bg-brand-950 text-white hover:bg-[#31566e]'
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
