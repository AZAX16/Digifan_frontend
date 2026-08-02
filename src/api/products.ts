import { authorizedRequest } from './auth'
import { normalizePaginatedResponse } from './pageResponse'

export type ProductStatus =
  | 'draft'
  | 'active'
  | 'inactive'
  | 'outOfStock'
  | 'discontinued'
  | 'archived'

export interface Product {
  id: string
  name: string | null
  sku: string | null
  slug: string | null
  description: string | null
  status: string | null
  categoryId: string
  categoryName: string | null
  brandId: string
  brandName: string | null
  price: number
  currency: string | null
  stockQuantity: number
  reorderPoint: number
  attributes: Record<string, string> | null
  createdAt: string
  updatedAt: string | null
}

export interface ProductInput {
  name: string
  sku: string | null
  description: string | null
  categoryId: string
  brandId: string
  price: number
  stockQuantity: number
  reorderPoint: number
  attributes: Record<string, string> | null
}

export interface ProductQuery {
  page?: number
  pageSize?: number
  search?: string
  sort?: string
  categoryId?: string
  brandId?: string
  status?: ProductStatus
}

export interface ProductPage {
  items: Product[]
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
}


function appendParameter(parameters: URLSearchParams, name: string, value: string | number | undefined) {
  if (value === undefined || value === '') return

  parameters.set(name, String(value))
}

export async function getProducts(query: ProductQuery = {}, signal?: AbortSignal) {
  const parameters = new URLSearchParams()
  appendParameter(parameters, 'Page', query.page)
  appendParameter(parameters, 'PageSize', query.pageSize)
  appendParameter(parameters, 'Search', query.search?.trim())
  appendParameter(parameters, 'Sort', query.sort)
  appendParameter(parameters, 'CategoryId', query.categoryId)
  appendParameter(parameters, 'BrandId', query.brandId)
  appendParameter(parameters, 'Status', query.status)
  const queryString = parameters.toString()
  const response = await authorizedRequest<unknown>(
    `/api/admin/products${queryString ? `?${queryString}` : ''}`,
    { signal },
  )

  return normalizePaginatedResponse<Product>(response, 'محصولات')
}

export function getProduct(id: string, signal?: AbortSignal) {
  return authorizedRequest<Product>(`/api/admin/products/${encodeURIComponent(id)}`, { signal })
}

export function createProduct(input: ProductInput) {
  return authorizedRequest<string>('/api/admin/products', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function updateProduct(id: string, input: ProductInput) {
  return authorizedRequest<void>(`/api/admin/products/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}

export function deleteProduct(id: string) {
  return authorizedRequest<void>(`/api/admin/products/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}

export function publishProduct(id: string) {
  return authorizedRequest<void>(`/api/admin/products/${encodeURIComponent(id)}/publish`, {
    method: 'POST',
  })
}

export function unpublishProduct(id: string) {
  return authorizedRequest<void>(`/api/admin/products/${encodeURIComponent(id)}/unpublish`, {
    method: 'POST',
  })
}

export function archiveProduct(id: string) {
  return authorizedRequest<void>(`/api/admin/products/${encodeURIComponent(id)}/archive`, {
    method: 'POST',
  })
}

export function discontinueProduct(id: string) {
  return authorizedRequest<void>(`/api/admin/products/${encodeURIComponent(id)}/discontinue`, {
    method: 'POST',
  })
}

export function duplicateProduct(id: string) {
  return authorizedRequest<string>(`/api/admin/products/${encodeURIComponent(id)}/duplicate`, {
    method: 'POST',
  })
}
