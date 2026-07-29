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
    'bg-brand-950 text-white shadow-[0_4px_10px_rgba(32,56,72,0.28)] hover:-translate-y-0.5 hover:bg-[#31566e] active:translate-y-[0.5px]',
  secondary:
    'bg-accent-500 text-brand-950 shadow-[0_4px_10px_rgba(255,132,26,0.28)] hover:-translate-y-0.5 hover:bg-[#ff9d45] active:translate-y-[0.5px]',
  outline:
    'border border-border bg-white text-brand-950 shadow-[0_3px_8px_rgba(32,56,72,0.12)] hover:-translate-y-0.5 hover:border-brand-950 hover:bg-brand-950/5 active:translate-y-[0.5px]',
  ghost:
    'bg-transparent text-brand-950 shadow-[0_2px_6px_rgba(32,56,72,0.1)] hover:-translate-y-0.5 hover:bg-white active:translate-y-[0.5px]',
  danger:
    'bg-danger-600 text-white shadow-[0_4px_10px_rgba(191,56,56,0.26)] hover:-translate-y-0.5 hover:bg-[#aa2f2f] active:translate-y-[0.5px]',
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
  const isDisabled = loading ? true : disabled

  return (
    <button
      type={type}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={cn(
        'inline-flex cursor-pointer items-center justify-center gap-2 rounded-df-sm font-extrabold transition-[background-color,border-color,color,opacity,transform] duration-200 ease-out disabled:cursor-not-allowed disabled:opacity-45',
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
      <span className="whitespace-nowrap leading-none">{children}</span>
      {!loading && trailingIcon}
    </button>
  )
}
