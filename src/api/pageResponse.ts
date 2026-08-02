import { ApiError } from './client'

export interface PaginatedResult<T> {
  items: T[]
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0
}

export function normalizePaginatedResponse<T>(
  response: unknown,
  resourceLabel: string,
): PaginatedResult<T> {
  if (!response || typeof response !== 'object' || Array.isArray(response)) {
    throw new ApiError(502, `ساختار پاسخ ${resourceLabel} با قرارداد مورد انتظار سازگار نیست.`)
  }

  const candidate = response as Record<string, unknown>
  const items = candidate.items
  if (
    (items !== null && !Array.isArray(items))
    || !isNonNegativeInteger(candidate.page)
    || !isNonNegativeInteger(candidate.pageSize)
    || !isNonNegativeInteger(candidate.totalCount)
    || !isNonNegativeInteger(candidate.totalPages)
  ) {
    throw new ApiError(502, `ساختار پاسخ ${resourceLabel} با قرارداد مورد انتظار سازگار نیست.`)
  }

  return {
    items: (items ?? []) as T[],
    page: candidate.page,
    pageSize: candidate.pageSize,
    totalCount: candidate.totalCount,
    totalPages: candidate.totalPages,
  }
}