import { authorizedRequest } from './auth'
import { normalizePaginatedResponse } from './pageResponse'

export interface ProductReview {
  id: string
  productId: string
  productName: string | null
  customerId: string
  authorPhoneNumber: string | null
  rating: number
  title: string | null
  text: string | null
  status: string | null
  adminReply: string | null
  createdAt: string
  updatedAt: string | null
  approvedAt: string | null
  repliedAt: string | null
}

export interface ProductReviewPage {
  items: ProductReview[]
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
}


export interface ProductReviewQuery {
  page?: number
  pageSize?: number
  status?: string
}

export async function getAdminReviews(
  query: ProductReviewQuery = {},
  signal?: AbortSignal,
) {
  const parameters = new URLSearchParams()
  if (query.page !== undefined) parameters.set('Page', String(query.page))
  if (query.pageSize !== undefined) parameters.set('PageSize', String(query.pageSize))
  if (query.status?.trim()) parameters.set('Status', query.status.trim())
  const queryString = parameters.toString()
  const response = await authorizedRequest<unknown>(
    `/api/admin/reviews${queryString ? `?${queryString}` : ''}`,
    { signal },
  )

  return normalizePaginatedResponse<ProductReview>(response, 'نظرات محصولات')
}

export function replyToAdminReview(reviewId: string, reply: string) {
  return authorizedRequest<void>(
    `/api/admin/reviews/${encodeURIComponent(reviewId)}/reply`,
    {
      method: 'PUT',
      body: JSON.stringify({ reply }),
    },
  )
}
