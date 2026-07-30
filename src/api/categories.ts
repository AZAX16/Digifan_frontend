import { authorizedRequest } from './auth'
import { cachedQuery, invalidateQueryPrefix } from './queryCache'

export { ApiError } from './client'

export interface Category {
  id: string
  name: string | null
  slug?: string | null
  description: string | null
  parentCategoryId: string | null
}

export interface CategoryInput {
  name: string
  description: string | null
  parentCategoryId: string | null
}

const CATEGORY_LIST_STALE_TIME_MS = 60_000

async function fetchCategories(signal?: AbortSignal) {
  const response = await authorizedRequest<Category[]>(
    '/api/admin/Categories',
    { signal },
  )

  if (!Array.isArray(response)) {
    throw new TypeError('ساختار پاسخ دسته‌بندی‌ها با قرارداد مورد انتظار سازگار نیست.')
  }

  return response
}

export function getCategories(signal?: AbortSignal) {
  return cachedQuery({
    key: 'categories:list',
    staleTimeMs: CATEGORY_LIST_STALE_TIME_MS,
    signal,
    queryFn: fetchCategories,
  })
}

export function getCategoryCount(signal?: AbortSignal) {
  return getCategories(signal).then((categories) => categories.length)
}

export function getCategory(id: string, signal?: AbortSignal) {
  return cachedQuery({
    key: `categories:detail:${id.toLowerCase()}`,
    staleTimeMs: CATEGORY_LIST_STALE_TIME_MS,
    signal,
    queryFn: (querySignal) => authorizedRequest<Category>(
      `/api/admin/Categories/${encodeURIComponent(id)}`,
      { signal: querySignal },
    ),
  })
}

export function invalidateCategoryQueries() {
  invalidateQueryPrefix('categories:')
}

export async function createCategory(input: CategoryInput) {
  const id = await authorizedRequest<string>('/api/admin/Categories', {
    method: 'POST',
    body: JSON.stringify(input),
  })

  invalidateCategoryQueries()
  return id
}

export async function updateCategory(id: string, input: CategoryInput) {
  await authorizedRequest<void>(`/api/admin/Categories/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })

  invalidateCategoryQueries()
  invalidateQueryPrefix('products:')
}

export async function deleteCategory(id: string) {
  await authorizedRequest<void>(`/api/admin/Categories/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })

  invalidateCategoryQueries()
  invalidateQueryPrefix('products:')
}
