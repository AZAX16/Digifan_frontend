import { ApiError } from './client'
import { authorizedCustomerRequest } from './customerAuth'

export interface CustomerCartItem {
  id: string
  productId: string
  productName: string | null
  productSlug: string | null
  sku: string | null
  quantity: number
  availableStock: number
  unitPrice: number
  lineTotal: number
  currency: string | null
  isAvailable: boolean
  imageUrl: string | null
}

export interface CustomerCart {
  items: CustomerCartItem[]
  totalQuantity: number
  total: number
  currency: string | null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function normalizeCustomerCart(value: unknown): CustomerCart {
  if (!isRecord(value) || !Array.isArray(value.items)) {
    throw new ApiError(502, 'پاسخ سبد خرید سرور معتبر نیست.')
  }

  return value as unknown as CustomerCart
}

export async function getCustomerCart(signal?: AbortSignal) {
  const response = await authorizedCustomerRequest<unknown>('/api/customer/cart', { signal })
  return normalizeCustomerCart(response)
}

export function addCustomerCartItem(productId: string, quantity = 1) {
  return authorizedCustomerRequest<void>('/api/customer/cart/items', {
    method: 'POST',
    body: JSON.stringify({ productId, quantity }),
  })
}

export function updateCustomerCartItem(itemId: string, quantity: number) {
  return authorizedCustomerRequest<void>(
    '/api/customer/cart/items/' + encodeURIComponent(itemId),
    {
      method: 'PUT',
      body: JSON.stringify({ quantity }),
    },
  )
}

export function removeCustomerCartItem(itemId: string) {
  return authorizedCustomerRequest<void>(
    '/api/customer/cart/items/' + encodeURIComponent(itemId),
    { method: 'DELETE' },
  )
}

export function clearCustomerCart() {
  return authorizedCustomerRequest<void>('/api/customer/cart', { method: 'DELETE' })
}