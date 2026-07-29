import type { InputHTMLAttributes, ReactNode } from 'react'
import { useId } from 'react'

import { cn } from '../../utils/cn'
import { Icon } from './Icon'

export interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: ReactNode
  type?: 'checkbox' | 'radio'
  description?: ReactNode
}

export function Checkbox({
  id,
  label,
  description,
  className,
  disabled,
  type = 'checkbox',
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
        type={type}
        disabled={disabled}
        className="peer sr-only"
        {...props}
      />
      <span
        className={cn(
          'mt-0.5 inline-flex size-5 shrink-0 items-center justify-center border-2 border-brand-950 bg-white transition-colors peer-checked:bg-brand-950 peer-focus-visible:ring-3 peer-focus-visible:ring-focus/35',
          type === 'radio' ? 'rounded-full' : 'rounded-[4px]',
        )}
      >
        {type === 'radio' ? (
          <span className="size-2 rounded-full bg-white opacity-0 transition-opacity group-has-[:checked]:opacity-100" />
        ) : (
          <Icon
            name="check"
            size={12}
            className="opacity-0 brightness-0 invert transition-opacity group-has-[:checked]:opacity-100"
          />
        )}
      </span>
      <span className="grid gap-0.5">
        <span className="text-sm font-medium text-ink">{label}</span>
        {description && <span className="text-xs text-muted">{description}</span>}
      </span>
    </label>
  )
}
