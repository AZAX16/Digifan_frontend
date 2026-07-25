import type { InputHTMLAttributes, ReactNode } from 'react'
import { useId } from 'react'

import { cn } from '../../utils/cn'

export interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: ReactNode
  description?: ReactNode
}

export function Switch({
  id,
  label,
  description,
  className,
  disabled,
  ...props
}: SwitchProps) {
  const generatedId = useId()
  const controlId = id ?? generatedId

  return (
    <label
      htmlFor={controlId}
      className={cn(
        'inline-flex cursor-pointer items-center gap-3',
        disabled && 'cursor-not-allowed opacity-50',
        className,
      )}
    >
      <input
        id={controlId}
        type="checkbox"
        role="switch"
        disabled={disabled}
        className="peer sr-only"
        {...props}
      />
      <span className="relative h-6 w-11 shrink-0 rounded-full bg-[#c7cbd0] transition-colors peer-checked:bg-brand-950 peer-focus-visible:ring-3 peer-focus-visible:ring-focus/35 after:absolute after:right-1 after:top-1 after:size-4 after:rounded-full after:bg-white after:shadow-sm after:transition-transform peer-checked:after:-translate-x-5" />
      <span className="grid gap-0.5">
        <span className="text-sm font-medium text-ink">{label}</span>
        {description && <span className="text-xs text-muted">{description}</span>}
      </span>
    </label>
  )
}
