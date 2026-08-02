import { authorizedRequest } from './auth'
import { ApiError } from './client'


export interface ProductImage {
  id: string
  url: string | null
  altText: string | null
  displayOrder: number
  isPrimary: boolean
}

export interface AddProductImageInput {
  url: string
  altText: string | null
  displayOrder: number
  isPrimary: boolean
}

export interface UpdateProductImageInput {
  url: string
  altText: string | null
  displayOrder: number
}

interface CollectionEnvelope<T> {
  items?: T[] | null
}

function normalizeCollection<T>(response: T[] | CollectionEnvelope<T> | null | undefined, label: string) {
  if (response == null) return []
  if (Array.isArray(response)) return response
  if (Array.isArray(response.items)) return response.items

  throw new ApiError(502, `ساختار پاسخ ${label} از سرور معتبر نبود.`)
}

function productPath(productId: string) {
  return `/api/admin/products/${encodeURIComponent(productId)}`
}


export async function getProductImages(productId: string, signal?: AbortSignal) {
  const response = await authorizedRequest<ProductImage[] | CollectionEnvelope<ProductImage> | null>(
    `${productPath(productId)}/images`,
    { signal },
  )

  return normalizeCollection(response, 'تصاویر محصول')
}

export function addProductImage(productId: string, input: AddProductImageInput) {
  return authorizedRequest<string>(`${productPath(productId)}/images`, {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function updateProductImage(
  productId: string,
  imageId: string,
  input: UpdateProductImageInput,
) {
  return authorizedRequest<void>(
    `${productPath(productId)}/images/${encodeURIComponent(imageId)}`,
    {
      method: 'PUT',
      body: JSON.stringify(input),
    },
  )
}

export function deleteProductImage(productId: string, imageId: string) {
  return authorizedRequest<void>(
    `${productPath(productId)}/images/${encodeURIComponent(imageId)}`,
    { method: 'DELETE' },
  )
}

export function setPrimaryProductImage(productId: string, imageId: string) {
  return authorizedRequest<void>(
    `${productPath(productId)}/images/${encodeURIComponent(imageId)}/primary`,
    { method: 'PUT' },
  )
}

export function reorderProductImages(productId: string, imageIds: string[]) {
  return authorizedRequest<void>(`${productPath(productId)}/images/order`, {
    method: 'PUT',
    body: JSON.stringify({ imageIds }),
  })
}
