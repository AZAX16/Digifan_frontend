import type { HTMLAttributes, ReactNode } from 'react'

import { cn } from '../../utils/cn'

export type AlertVariant = 'info' | 'success' | 'warning' | 'danger'

export interface AlertProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  variant?: AlertVariant
  title: ReactNode
  live?: boolean
}

const variants: Record<AlertVariant, string> = {
  info: 'border-[#b9d5e5] bg-[#edf7fc] text-brand-950',
  success: 'border-[#a9d7c7] bg-[#edf9f4] text-[#0e6948]',
  warning: 'border-[#f3d298] bg-[#fff8e9] text-[#825313]',
  danger: 'border-[#edb3b3] bg-[#fff1f1] text-[#922b2b]',
}

export function Alert({
  variant = 'info',
  title,
  live = false,
  className,
  children,
  ...props
}: AlertProps) {
  return (
    <div
      role={live ? (variant === 'danger' ? 'alert' : 'status') : undefined}
      className={cn('rounded-df-md border p-4', variants[variant], className)}
      {...props}
    >
      <p className="m-0 text-sm font-bold">{title}</p>
      {children && <div className="mt-1 text-sm opacity-85">{children}</div>}
    </div>
  )
}
