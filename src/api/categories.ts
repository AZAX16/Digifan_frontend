import { authorizedRequest } from './auth'
import { fetchRemainingPages } from './pagination'
import { cachedQuery, invalidateQueryPrefix } from './queryCache'

export { ApiError } from './client'

export interface Category {
  id: string
  name: string | null
  description: string | null
  parentCategoryId: string | null
}

export interface CategoryInput {
  name: string
  description: string | null
  parentCategoryId: string | null
}

interface CategoryPage {
  items: Category[]
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
}

type CategoriesResponse = Category[] | CategoryPage
const CATEGORY_LIST_STALE_TIME_MS = 60_000
const CATEGORY_COUNT_STALE_TIME_MS = 30_000

function getCategoryItems(response: CategoriesResponse) {
  if (Array.isArray(response)) return response
  if (Array.isArray(response.items)) return response.items

  throw new TypeError('ساختار پاسخ دسته‌بندی‌ها با قرارداد مورد انتظار سازگار نیست.')
}

async function fetchCategories(signal?: AbortSignal) {
  const firstResponse = await authorizedRequest<CategoriesResponse>(
    '/api/admin/Categories?Page=1&PageSize=100',
    { signal },
  )
  const firstPageItems = getCategoryItems(firstResponse)

  if (Array.isArray(firstResponse) || firstResponse.totalPages <= 1) return firstPageItems

  const remainingPages = await fetchRemainingPages(
    firstResponse.totalPages,
    (page) =>
      authorizedRequest<CategoriesResponse>(
        `/api/admin/Categories?Page=${page}&PageSize=100`,
        {
        signal,
        },
      ),
  )
  const categoriesById = new Map(
    [firstResponse, ...remainingPages]
      .flatMap(getCategoryItems)
      .map((category) => [category.id, category]),
  )

  return [...categoriesById.values()]
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
  return cachedQuery({
    key: 'categories:count',
    staleTimeMs: CATEGORY_COUNT_STALE_TIME_MS,
    signal,
    queryFn: async (querySignal) => {
      const response = await authorizedRequest<CategoriesResponse>(
        '/api/admin/Categories?Page=1&PageSize=1',
        { signal: querySignal },
      )

      return Array.isArray(response) ? response.length : response.totalCount
    },
  })
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
