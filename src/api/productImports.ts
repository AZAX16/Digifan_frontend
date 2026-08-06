import { authorizedRequest } from './auth'
import { ApiError } from './client'
import { invalidateQueryPrefix } from './queryCache'

export interface ProductWorkbookImportResult {
  created: number
  updated: number
  archived: number
  deleted: number
  unchanged: number
}

const resultFields = ['created', 'updated', 'archived', 'deleted', 'unchanged'] as const

function normalizeImportResult(response: unknown): ProductWorkbookImportResult {
  if (!response || typeof response !== 'object' || Array.isArray(response)) {
    throw new ApiError(502, 'نتیجه پردازش فایل اکسل از سمت سرور معتبر نبود.')
  }

  const record = response as Record<string, unknown>
  const result = {} as ProductWorkbookImportResult

  for (const field of resultFields) {
    const value = record[field]

    if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
      throw new ApiError(502, 'نتیجه پردازش فایل اکسل از سمت سرور کامل نبود.')
    }

    result[field] = value
  }

  return result
}

export async function importProductsWorkbook(
  parentCategoryId: string,
  file: File,
  signal?: AbortSignal,
) {
  const formData = new FormData()
  formData.append('file', file, file.name)

  const response = await authorizedRequest<unknown>(
    `/api/admin/product-imports/${encodeURIComponent(parentCategoryId)}`,
    {
      method: 'POST',
      body: formData,
      signal,
    },
  )
  const result = normalizeImportResult(response)
  invalidateQueryPrefix('products:')

  return result
}
