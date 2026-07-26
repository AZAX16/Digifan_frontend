import { useId, useState, type ReactNode } from 'react'

import { cn } from '../../utils/cn'
import { Chevron } from './Chevron'

export interface FilterAccordionProps {
  title: string
  children: ReactNode
  defaultOpen?: boolean
  className?: string
}

export function FilterAccordion({
  title,
  children,
  defaultOpen = false,
  className,
}: FilterAccordionProps) {
  const [open, setOpen] = useState(defaultOpen)
  const id = useId()
  const triggerId = `${id}-trigger`
  const panelId = `${id}-panel`

  return (
    <div className={cn('border-b border-border-soft bg-white first:border-t', className)}>
      <button
        id={triggerId}
        type="button"
        aria-controls={panelId}
        aria-expanded={open}
        className="flex min-h-14 w-full cursor-pointer items-center justify-between bg-white px-2 text-sm font-extrabold text-ink transition-colors duration-200 hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent-500"
        onClick={() => setOpen((currentValue) => !currentValue)}
      >
        <span>{title}</span>
        <Chevron open={open} className="ml-1 text-ink" />
      </button>
      <div
        id={panelId}
        role="region"
        aria-labelledby={triggerId}
        aria-hidden={!open}
        inert={!open}
        className={cn(
          'grid transition-[grid-template-rows,opacity] duration-250 ease-out',
          open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
        )}
      >
        <div className="overflow-hidden">
          <div className="border-t border-border-soft px-2 py-4">{children}</div>
        </div>
      </div>
    </div>
  )
}
