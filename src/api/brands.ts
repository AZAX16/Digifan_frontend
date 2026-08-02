import { authorizedRequest } from './auth'
import { normalizePaginatedResponse } from './pageResponse'
import { fetchRemainingPages } from './pagination'
import { cachedQuery, invalidateQueryPrefix } from './queryCache'

export interface Brand {
  id: string
  name: string | null
  slug?: string | null
}

interface BrandPage {
  items: Brand[] | null
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
}

type BrandsResponse = Brand[] | BrandPage
const BRAND_LIST_STALE_TIME_MS = 60_000
const BRAND_COUNT_STALE_TIME_MS = 30_000

function getBrandItems(response: BrandsResponse) {
  return Array.isArray(response)
    ? response
    : normalizePaginatedResponse<Brand>(response, 'برندها').items
}

async function fetchBrands(signal?: AbortSignal) {
  const firstResponse = await authorizedRequest<BrandsResponse>(
    '/api/admin/Brands?Page=1&PageSize=100',
    { signal },
  )
  if (Array.isArray(firstResponse)) return firstResponse

  const firstPage = normalizePaginatedResponse<Brand>(firstResponse, 'برندها')
  if (firstPage.totalPages <= 1) return firstPage.items

  const remainingPages = await fetchRemainingPages(
    firstPage.totalPages,
    (page) =>
      authorizedRequest<BrandsResponse>(
        `/api/admin/Brands?Page=${page}&PageSize=100`,
        { signal },
      ),
  )
  const brandsById = new Map(
    [firstResponse, ...remainingPages]
      .flatMap(getBrandItems)
      .map((brand) => [brand.id, brand]),
  )

  return [...brandsById.values()]
}

export function getBrands(signal?: AbortSignal) {
  return cachedQuery({
    key: 'brands:list',
    staleTimeMs: BRAND_LIST_STALE_TIME_MS,
    signal,
    queryFn: fetchBrands,
  })
}

export function getBrandCount(signal?: AbortSignal) {
  return cachedQuery({
    key: 'brands:count',
    staleTimeMs: BRAND_COUNT_STALE_TIME_MS,
    signal,
    queryFn: async (querySignal) => {
      const response = await authorizedRequest<BrandsResponse>(
        '/api/admin/Brands?Page=1&PageSize=1',
        { signal: querySignal },
      )

      return Array.isArray(response)
        ? response.length
        : normalizePaginatedResponse<Brand>(response, 'برندها').totalCount
    },
  })
}

export function getBrand(id: string, signal?: AbortSignal) {
  return cachedQuery({
    key: `brands:detail:${id.toLowerCase()}`,
    staleTimeMs: BRAND_LIST_STALE_TIME_MS,
    signal,
    queryFn: (querySignal) => authorizedRequest<Brand>(
      `/api/admin/Brands/${encodeURIComponent(id)}`,
      { signal: querySignal },
    ),
  })
}

export function invalidateBrandQueries() {
  invalidateQueryPrefix('brands:')
}

export async function createBrand(name: string) {
  const id = await authorizedRequest<string>('/api/admin/Brands', {
    method: 'POST',
    body: JSON.stringify({ name }),
  })

  invalidateBrandQueries()
  return id
}

export async function updateBrand(id: string, name: string) {
  await authorizedRequest<void>(`/api/admin/Brands/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify({ name }),
  })

  invalidateBrandQueries()
  invalidateQueryPrefix('products:')
}

export async function deleteBrand(id: string) {
  await authorizedRequest<void>(`/api/admin/Brands/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })

  invalidateBrandQueries()
  invalidateQueryPrefix('products:')
}
