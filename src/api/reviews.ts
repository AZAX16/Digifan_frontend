import { authorizedRequest } from './auth'

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

interface ProductReviewPageResponse extends Omit<ProductReviewPage, 'items'> {
  items: ProductReview[] | null
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
  const response = await authorizedRequest<ProductReviewPageResponse>(
    `/api/admin/reviews${queryString ? `?${queryString}` : ''}`,
    { signal },
  )

  return { ...response, items: response.items ?? [] } satisfies ProductReviewPage
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
