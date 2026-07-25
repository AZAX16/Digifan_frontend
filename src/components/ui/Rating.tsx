import { cn } from '../../utils/cn'
import { Icon } from './Icon'

export interface RatingProps {
  value: number
  max?: number
  size?: number
  label?: string
  onChange?: (value: number) => void
  className?: string
}

export function Rating({
  value,
  max = 5,
  size = 24,
  label = 'امتیاز محصول',
  onChange,
  className,
}: RatingProps) {
  const normalizedValue = Math.max(0, Math.min(max, value))

  return (
    <div
      className={cn('inline-flex items-center', className)}
      role={onChange ? 'radiogroup' : 'img'}
      aria-label={`${label}: ${normalizedValue} از ${max}`}
      dir="rtl"
    >
      {Array.from({ length: max }, (_, index) => {
        const starValue = index + 1
        const active = starValue <= Math.round(normalizedValue)
        const star = (
          <Icon
            name="star"
            size={size}
            tone={active ? 'var(--df-warning-400)' : '#d4d6d8'}
          />
        )

        if (!onChange) {
          return <span key={starValue}>{star}</span>
        }

        return (
          <button
            key={starValue}
            type="button"
            role="radio"
            aria-checked={starValue === normalizedValue}
            aria-label={`${starValue} از ${max}`}
            className="cursor-pointer rounded-sm border-0 bg-transparent p-0 transition-transform hover:scale-110"
            onClick={() => onChange(starValue)}
          >
            {star}
          </button>
        )
      })}
    </div>
  )
}
