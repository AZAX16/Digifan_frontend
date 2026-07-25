import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react'
import { useId } from 'react'

import { cn } from '../../utils/cn'

interface FieldChromeProps {
  id?: string
  label?: string
  hint?: string
  error?: string
  required?: boolean
  className?: string
  children: (ids: { controlId: string; descriptionId?: string }) => ReactNode
}

function FieldChrome({
  id,
  label,
  hint,
  error,
  required,
  className,
  children,
}: FieldChromeProps) {
  const generatedId = useId()
  const controlId = id ?? generatedId
  const descriptionId = hint || error ? `${controlId}-description` : undefined

  return (
    <div className={cn('grid gap-1.5', className)}>
      {label && (
        <label className="text-sm font-bold text-ink" htmlFor={controlId}>
          {label}
          {required && <span className="mr-1 text-danger-600">*</span>}
        </label>
      )}
      {children({ controlId, descriptionId })}
      {(error || hint) && (
        <p
          id={descriptionId}
          className={cn('m-0 text-xs', error ? 'text-danger-600' : 'text-muted')}
        >
          {error ?? hint}
        </p>
      )}
    </div>
  )
}

const controlClassName =
  'min-h-11 w-full rounded-df-md border border-border-soft bg-white px-3 text-sm text-ink shadow-sm transition-colors placeholder:text-muted/75 hover:border-border focus:border-brand-950 focus:outline-none disabled:cursor-not-allowed disabled:bg-[#f0f1f2] disabled:opacity-60'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  hint?: string
  error?: string
  leading?: ReactNode
  trailing?: ReactNode
  containerClassName?: string
}

export function Input({
  id,
  label,
  hint,
  error,
  leading,
  trailing,
  required,
  className,
  containerClassName,
  ...props
}: InputProps) {
  return (
    <FieldChrome
      id={id}
      label={label}
      hint={hint}
      error={error}
      required={required}
      className={containerClassName}
    >
      {({ controlId, descriptionId }) => (
        <div className="relative">
          {leading && (
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-muted">
              {leading}
            </span>
          )}
          <input
            id={controlId}
            required={required}
            aria-invalid={Boolean(error) || undefined}
            aria-describedby={descriptionId}
            className={cn(
              controlClassName,
              Boolean(leading) && 'pr-10',
              Boolean(trailing) && 'pl-10',
              error && 'border-danger-600 focus:border-danger-600',
              className,
            )}
            {...props}
          />
          {trailing && (
            <span className="absolute inset-y-0 left-3 flex items-center text-muted">
              {trailing}
            </span>
          )}
        </div>
      )}
    </FieldChrome>
  )
}

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  hint?: string
  error?: string
  containerClassName?: string
}

export function Textarea({
  id,
  label,
  hint,
  error,
  required,
  className,
  containerClassName,
  ...props
}: TextareaProps) {
  return (
    <FieldChrome
      id={id}
      label={label}
      hint={hint}
      error={error}
      required={required}
      className={containerClassName}
    >
      {({ controlId, descriptionId }) => (
        <textarea
          id={controlId}
          required={required}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={descriptionId}
          className={cn(
            controlClassName,
            'min-h-28 resize-y py-3',
            error && 'border-danger-600 focus:border-danger-600',
            className,
          )}
          {...props}
        />
      )}
    </FieldChrome>
  )
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  hint?: string
  error?: string
  containerClassName?: string
}

export function Select({
  id,
  label,
  hint,
  error,
  required,
  className,
  containerClassName,
  children,
  ...props
}: SelectProps) {
  return (
    <FieldChrome
      id={id}
      label={label}
      hint={hint}
      error={error}
      required={required}
      className={containerClassName}
    >
      {({ controlId, descriptionId }) => (
        <select
          id={controlId}
          required={required}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={descriptionId}
          className={cn(
            controlClassName,
            'cursor-pointer',
            error && 'border-danger-600 focus:border-danger-600',
            className,
          )}
          {...props}
        >
          {children}
        </select>
      )}
    </FieldChrome>
  )
}
