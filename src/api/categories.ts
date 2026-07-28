import { authorizedRequest } from './auth'

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
let categoriesRequest: Promise<Category[]> | undefined

function getCategoryItems(response: CategoriesResponse) {
  if (Array.isArray(response)) return response
  if (Array.isArray(response.items)) return response.items

  throw new TypeError('ساختار پاسخ دسته‌بندی‌ها با قرارداد مورد انتظار سازگار نیست.')
}

async function fetchCategories(signal?: AbortSignal) {
  const firstResponse = await authorizedRequest<CategoriesResponse>('/api/admin/Categories', {
    signal,
  })
  const firstPageItems = getCategoryItems(firstResponse)

  if (Array.isArray(firstResponse) || firstResponse.totalPages <= 1) return firstPageItems

  const remainingPages = await Promise.all(
    Array.from({ length: firstResponse.totalPages - 1 }, (_, index) =>
      authorizedRequest<CategoriesResponse>(`/api/admin/Categories?page=${index + 2}`, {
        signal,
      }),
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
  if (signal) return fetchCategories(signal)

  categoriesRequest ??= fetchCategories().finally(() => {
    categoriesRequest = undefined
  })

  return categoriesRequest
}

export function getCategory(id: string, signal?: AbortSignal) {
  return authorizedRequest<Category>(`/api/admin/Categories/${encodeURIComponent(id)}`, {
    signal,
  })
}

export function createCategory(input: CategoryInput) {
  return authorizedRequest<string>('/api/admin/Categories', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function updateCategory(id: string, input: CategoryInput) {
  return authorizedRequest<void>(`/api/admin/Categories/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}

export function deleteCategory(id: string) {
  return authorizedRequest<void>(`/api/admin/Categories/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}
