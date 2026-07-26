import { cn } from '../../utils/cn'

export interface PaginationProps {
  page: number
  pageCount: number
  onPageChange?: (page: number) => void
  className?: string
}

type PaginationItem = number | 'ellipsis-start' | 'ellipsis-end'

const pageFormatter = new Intl.NumberFormat('fa-IR')

function getPaginationItems(currentPage: number, pageCount: number): PaginationItem[] {
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, index) => index + 1)
  }

  const visiblePages = new Set([1, pageCount, currentPage - 1, currentPage, currentPage + 1])

  if (currentPage <= 4) {
    ;[2, 3, 4, 5].forEach((pageNumber) => visiblePages.add(pageNumber))
  }

  if (currentPage >= pageCount - 3) {
    ;[pageCount - 4, pageCount - 3, pageCount - 2, pageCount - 1].forEach((pageNumber) =>
      visiblePages.add(pageNumber),
    )
  }

  const sortedPages = [...visiblePages]
    .filter((pageNumber) => pageNumber >= 1 && pageNumber <= pageCount)
    .sort((firstPage, secondPage) => firstPage - secondPage)
  const items: PaginationItem[] = []

  sortedPages.forEach((pageNumber, index) => {
    const previousPage = sortedPages[index - 1]

    if (previousPage !== undefined && pageNumber - previousPage > 1) {
      items.push(index === 1 ? 'ellipsis-start' : 'ellipsis-end')
    }

    items.push(pageNumber)
  })

  return items
}

export function Pagination({
  page,
  pageCount,
  onPageChange,
  className,
}: PaginationProps) {
  const safePageCount = Number.isFinite(pageCount) ? Math.max(1, Math.floor(pageCount)) : 1
  const safePage = Number.isFinite(page)
    ? Math.min(Math.max(1, Math.floor(page)), safePageCount)
    : 1
  const items = getPaginationItems(safePage, safePageCount)

  return (
    <nav aria-label="صفحه‌بندی" className={cn('flex items-center gap-2', className)}>
      <button
        type="button"
        disabled={safePage <= 1}
        className="h-9 cursor-pointer rounded-df-sm border border-border-soft bg-white px-3 text-xs shadow-sm transition-[background-color,border-color,color,opacity,transform] duration-200 ease-out hover:-translate-y-0.5 hover:border-brand-950 active:translate-y-[0.5px] disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="صفحه قبل"
        onClick={() => onPageChange?.(safePage - 1)}
      >
        قبلی
      </button>
      {items.map((item) => {
        if (typeof item !== 'number') {
          return (
            <span key={item} aria-hidden="true" className="flex size-9 items-center justify-center text-muted">
              …
            </span>
          )
        }

        return (
          <button
            key={item}
            type="button"
            aria-current={item === safePage ? 'page' : undefined}
            aria-label={`صفحه ${pageFormatter.format(item)}`}
            className={cn(
              'size-9 cursor-pointer rounded-df-sm border text-sm shadow-sm transition-[background-color,border-color,color,opacity,transform] duration-200 ease-out hover:-translate-y-0.5 active:translate-y-[0.5px]',
              item === safePage
                ? 'border-accent-500 bg-accent-500 text-white hover:border-[#e97812] hover:bg-[#e97812]'
                : 'border-border-soft bg-white text-brand-950 hover:border-brand-950',
            )}
            onClick={() => onPageChange?.(item)}
          >
            {pageFormatter.format(item)}
          </button>
        )
      })}
      <button
        type="button"
        disabled={safePage >= safePageCount}
        className="h-9 cursor-pointer rounded-df-sm border border-border-soft bg-white px-3 text-xs shadow-sm transition-[background-color,border-color,color,opacity,transform] duration-200 ease-out hover:-translate-y-0.5 hover:border-brand-950 active:translate-y-[0.5px] disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="صفحه بعد"
        onClick={() => onPageChange?.(safePage + 1)}
      >
        بعدی
      </button>
    </nav>
  )
}
