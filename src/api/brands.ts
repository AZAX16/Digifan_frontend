import { authorizedRequest } from './auth'

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
let brandsRequest: Promise<Brand[]> | undefined

function getBrandItems(response: BrandsResponse) {
  if (Array.isArray(response)) return response

  return response.items ?? []
}

async function fetchBrands(signal?: AbortSignal) {
  const firstResponse = await authorizedRequest<BrandsResponse>(
    '/api/admin/Brands?Page=1&PageSize=100',
    { signal },
  )
  const firstPageItems = getBrandItems(firstResponse)

  if (Array.isArray(firstResponse) || firstResponse.totalPages <= 1) return firstPageItems

  const remainingPages = await Promise.all(
    Array.from({ length: firstResponse.totalPages - 1 }, (_, index) =>
      authorizedRequest<BrandsResponse>(
        `/api/admin/Brands?Page=${index + 2}&PageSize=100`,
        { signal },
      ),
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
  if (signal) return fetchBrands(signal)

  brandsRequest ??= fetchBrands().finally(() => {
    brandsRequest = undefined
  })

  return brandsRequest
}

export function getBrand(id: string, signal?: AbortSignal) {
  return authorizedRequest<Brand>(`/api/admin/Brands/${encodeURIComponent(id)}`, { signal })
}

export function createBrand(name: string) {
  return authorizedRequest<string>('/api/admin/Brands', {
    method: 'POST',
    body: JSON.stringify({ name }),
  })
}

export function updateBrand(id: string, name: string) {
  return authorizedRequest<void>(`/api/admin/Brands/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify({ name }),
  })
}

export function deleteBrand(id: string) {
  return authorizedRequest<void>(`/api/admin/Brands/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}
