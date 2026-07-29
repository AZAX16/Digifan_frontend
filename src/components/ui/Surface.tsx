import type { HTMLAttributes, Ref } from 'react'

import { cn } from '../../utils/cn'

export interface SurfaceProps extends HTMLAttributes<HTMLDivElement> {
  elevation?: 'flat' | 'raised' | 'card'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  ref?: Ref<HTMLDivElement>
}

const elevations = {
  flat: 'border border-border-soft bg-surface-raised',
  raised: 'bg-surface-raised shadow-raised',
  card: 'bg-surface shadow-card',
}

const paddings = {
  none: '',
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-7',
}

export function Surface({
  elevation = 'flat',
  padding = 'md',
  className,
  ...props
}: SurfaceProps) {
  return (
    <div
      className={cn(
        'rounded-df-lg',
        elevations[elevation],
        paddings[padding],
        className,
      )}
      {...props}
    />
  )
}
