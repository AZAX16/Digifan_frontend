import type { HTMLAttributes } from 'react'

import { cn } from '../../utils/cn'

export interface ChevronProps extends HTMLAttributes<HTMLSpanElement> {
  open?: boolean
}

export function Chevron({ open = false, className, ...props }: ChevronProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'block size-2.5 shrink-0 border-b-2 border-r-2 border-current transition-transform duration-200',
        open ? 'rotate-[225deg]' : 'rotate-45',
        className,
      )}
      {...props}
    />
  )
}
