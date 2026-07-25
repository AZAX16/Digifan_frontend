import type { HTMLAttributes } from 'react'

import { cn } from '../../utils/cn'

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'animate-pulse rounded-df-sm bg-gradient-to-l from-[#e3e6e8] via-[#f1f2f3] to-[#e3e6e8] bg-[length:200%_100%]',
        className,
      )}
      {...props}
    />
  )
}
