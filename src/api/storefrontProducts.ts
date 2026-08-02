import { apiRequest } from './client'
import { normalizePaginatedResponse } from './pageResponse'

export type StorefrontProductSort =
  | 'NameAscending'
  | 'NameDescending'
  | 'PriceAscending'
  | 'PriceDescending'
  | 'Newest'
  | 'Oldest'

export interface StorefrontProductListItem {
  id: string
  name: string | null
  sku: string | null
  slug: string | null
  summary: string | null
  categoryId: string
  categoryName: string | null
  categorySlug: string | null
  brandId: string
  brandName: string | null
  brandSlug: string | null
  price: number
  currency: string | null
  stockQuantity: number
  reorderPoint: number
  attributes: Record<string, string> | null
  primaryImageUrl: string | null
}


export interface StorefrontProductImage {
  id: string
  url: string | null
  altText: string | null
  displayOrder: number
  isPrimary: boolean
}

export interface StorefrontProductDetails
  extends Omit<StorefrontProductListItem, 'summary' | 'primaryImageUrl'> {
  description: string | null
  averageRating: number
  reviewCount: number
  images: StorefrontProductImage[] | null
}

export interface StorefrontProductQuery {
  page?: number
  pageSize?: number
  search?: string
  categorySlug?: string
  brandSlug?: string
  minPrice?: number
  maxPrice?: number
  sort?: StorefrontProductSort
}

export interface StorefrontProductPage {
  items: StorefrontProductListItem[]
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
}


function appendParameter(
  parameters: URLSearchParams,
  name: string,
  value: string | number | undefined,
) {
  if (value === undefined || value === '') return

  parameters.set(name, String(value))
}

export async function getStorefrontProducts(
  query: StorefrontProductQuery = {},
  signal?: AbortSignal,
) {
  const parameters = new URLSearchParams()
  appendParameter(parameters, 'Page', query.page)
  appendParameter(parameters, 'PageSize', query.pageSize)
  appendParameter(parameters, 'Search', query.search?.trim())
  appendParameter(parameters, 'CategorySlug', query.categorySlug)
  appendParameter(parameters, 'BrandSlug', query.brandSlug)
  appendParameter(parameters, 'MinPrice', query.minPrice)
  appendParameter(parameters, 'MaxPrice', query.maxPrice)
  appendParameter(parameters, 'Sort', query.sort)
  const queryString = parameters.toString()
  const response = await apiRequest<unknown>(
    `/api/storefront/products${queryString ? `?${queryString}` : ''}`,
    { signal },
  )

  return normalizePaginatedResponse<StorefrontProductListItem>(
    response,
    'محصولات فروشگاه',
  )
}

export function getStorefrontProduct(slug: string, signal?: AbortSignal) {
  return apiRequest<StorefrontProductDetails>(
    `/api/storefront/products/${encodeURIComponent(slug)}`,
    { signal },
  )
}
