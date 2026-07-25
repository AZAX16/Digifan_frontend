import type { InputHTMLAttributes, ReactNode } from 'react'
import { useId } from 'react'

import { cn } from '../../utils/cn'
import { Icon } from './Icon'

export interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: ReactNode
  description?: ReactNode
}

export function Checkbox({
  id,
  label,
  description,
  className,
  disabled,
  ...props
}: CheckboxProps) {
  const generatedId = useId()
  const controlId = id ?? generatedId

  return (
    <label
      htmlFor={controlId}
      className={cn(
        'group inline-flex cursor-pointer items-start gap-2.5',
        disabled && 'cursor-not-allowed opacity-50',
        className,
      )}
    >
      <input
        id={controlId}
        type="checkbox"
        disabled={disabled}
        className="peer sr-only"
        {...props}
      />
      <span className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-[4px] border-2 border-brand-950 bg-white transition-colors peer-checked:bg-brand-950 peer-focus-visible:ring-3 peer-focus-visible:ring-focus/35">
        <Icon
          name="check"
          size={12}
          className="opacity-0 brightness-0 invert transition-opacity peer-checked:opacity-100 group-has-[:checked]:opacity-100"
        />
      </span>
      <span className="grid gap-0.5">
        <span className="text-sm font-medium text-ink">{label}</span>
        {description && <span className="text-xs text-muted">{description}</span>}
      </span>
    </label>
  )
}
