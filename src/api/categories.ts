const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim()
const apiBaseUrl = (configuredApiBaseUrl?.length ? configuredApiBaseUrl : '').replace(/\/+$/, '')

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

interface ProblemDetails {
  title?: string | null
  detail?: string | null
}

export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function getErrorMessage(response: Response) {
  const fallback = `درخواست با خطای ${response.status} روبه‌رو شد.`

  try {
    const contentType = response.headers.get('content-type') ?? ''

    if (contentType.includes('json')) {
      const problem = (await response.json()) as ProblemDetails
      const detail = problem.detail?.trim()
      const title = problem.title?.trim()

      if (detail) return detail
      if (title) return title

      return fallback
    }

    const message = (await response.text()).trim()

    return message.length ? message : fallback
  } catch {
    return fallback
  }
}

async function apiRequest<T>(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers)
  headers.set('Accept', 'application/json')

  if (init.body !== undefined) {
    headers.set('Content-Type', 'application/json')
  }

  let response: Response

  try {
    response = await fetch(`${apiBaseUrl}${path}`, {
      ...init,
      headers,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error

    throw new ApiError(
      0,
      'ارتباط با سرور برقرار نشد. اتصال اینترنت و تنظیمات CORS را بررسی کنید.',
    )
  }

  if (!response.ok) {
    throw new ApiError(response.status, await getErrorMessage(response))
  }

  if (response.status === 204) return undefined as T

  const contentType = response.headers.get('content-type') ?? ''

  if (contentType.includes('json')) return (await response.json()) as T

  return (await response.text()) as T
}

type CategoriesResponse = Category[] | CategoryPage
let categoriesRequest: Promise<Category[]> | undefined

function getCategoryItems(response: CategoriesResponse) {
  if (Array.isArray(response)) return response
  if (Array.isArray(response.items)) return response.items

  throw new ApiError(
    200,
    'ساختار پاسخ دسته‌بندی‌ها با قرارداد مورد انتظار سازگار نیست.',
  )
}

async function fetchCategories(signal?: AbortSignal) {
  const firstResponse = await apiRequest<CategoriesResponse>('/api/Categories', { signal })
  const firstPageItems = getCategoryItems(firstResponse)

  if (Array.isArray(firstResponse) || firstResponse.totalPages <= 1) return firstPageItems

  const remainingPages = await Promise.all(
    Array.from({ length: firstResponse.totalPages - 1 }, (_, index) =>
      apiRequest<CategoriesResponse>(`/api/Categories?page=${index + 2}`, { signal }),
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

export function createCategory(input: CategoryInput) {
  return apiRequest<string>('/api/Categories', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function updateCategory(id: string, input: CategoryInput) {
  return apiRequest<void>(`/api/Categories/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}

export function deleteCategory(id: string) {
  return apiRequest<void>(`/api/Categories/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}
