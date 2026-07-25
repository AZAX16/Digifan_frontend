import { cn } from '../../utils/cn'

export interface PaginationProps {
  page: number
  pageCount: number
  onPageChange?: (page: number) => void
  className?: string
}

export function Pagination({
  page,
  pageCount,
  onPageChange,
  className,
}: PaginationProps) {
  const pages = Array.from({ length: pageCount }, (_, index) => index + 1)

  return (
    <nav aria-label="صفحه‌بندی" className={cn('flex items-center gap-2', className)}>
      <button
        type="button"
        disabled={page <= 1}
        className="h-9 cursor-pointer rounded-df-sm border border-border-soft bg-white px-3 text-xs disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="صفحه قبل"
        onClick={() => onPageChange?.(page - 1)}
      >
        قبلی
      </button>
      {pages.map((pageNumber) => (
        <button
          key={pageNumber}
          type="button"
          aria-current={pageNumber === page ? 'page' : undefined}
          className={cn(
            'size-9 cursor-pointer rounded-df-sm border text-sm transition-colors',
            pageNumber === page
              ? 'border-brand-950 bg-brand-950 text-white'
              : 'border-border-soft bg-white text-brand-950 hover:border-brand-950',
          )}
          onClick={() => onPageChange?.(pageNumber)}
        >
          {pageNumber.toLocaleString('fa-IR')}
        </button>
      ))}
      <button
        type="button"
        disabled={page >= pageCount}
        className="h-9 cursor-pointer rounded-df-sm border border-border-soft bg-white px-3 text-xs disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="صفحه بعد"
        onClick={() => onPageChange?.(page + 1)}
      >
        بعدی
      </button>
    </nav>
  )
}
