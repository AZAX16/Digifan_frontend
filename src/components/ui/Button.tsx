import type { ButtonHTMLAttributes, ReactNode } from 'react'

import { cn } from '../../utils/cn'

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'danger'

export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
  loading?: boolean
  leadingIcon?: ReactNode
  trailingIcon?: ReactNode
}

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-brand-950 text-white shadow-sm hover:bg-brand-900 active:translate-y-px',
  secondary:
    'bg-accent-500 text-white shadow-sm hover:bg-[#e97812] active:translate-y-px',
  outline:
    'border border-border bg-white text-brand-950 hover:border-brand-950 hover:bg-brand-950/5 active:translate-y-px',
  ghost: 'bg-transparent text-brand-950 hover:bg-brand-950/8',
  danger:
    'bg-danger-600 text-white shadow-sm hover:bg-[#aa2f2f] active:translate-y-px',
}

const sizes: Record<ButtonSize, string> = {
  sm: 'min-h-8 px-3 text-xs',
  md: 'min-h-10 px-4 text-sm',
  lg: 'min-h-12 px-6 text-base',
}

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  leadingIcon,
  trailingIcon,
  disabled,
  className,
  children,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        'inline-flex cursor-pointer items-center justify-center gap-2 rounded-df-sm font-extrabold transition-[background-color,border-color,box-shadow,opacity,transform] duration-150 disabled:cursor-not-allowed disabled:opacity-45',
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    >
      {loading ? (
        <span
          aria-hidden="true"
          className="size-4 animate-spin rounded-full border-2 border-current border-l-transparent"
        />
      ) : (
        leadingIcon
      )}
      <span>{children}</span>
      {!loading && trailingIcon}
    </button>
  )
}
