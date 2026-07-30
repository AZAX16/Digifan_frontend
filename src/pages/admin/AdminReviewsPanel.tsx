import { MessageSquareReply, RefreshCw, Send, Star, UserRound } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'

import { ApiError } from '../../api/client'
import {
  getAdminReviews,
  replyToAdminReview,
  type ProductReviewPage,
} from '../../api/reviews'
import { Alert, Badge, Button, Pagination, Rating, Skeleton, Surface, Textarea, type BadgeVariant } from '../../components/ui'
import { toPersianDigits } from '../../utils/persianDigits'

const PAGE_SIZE = 8
const EMPTY_PAGE: ProductReviewPage = {
  items: [],
  page: 1,
  pageSize: PAGE_SIZE,
  totalCount: 0,
  totalPages: 1,
}
const reviewDateFormatter = new Intl.DateTimeFormat('fa-IR', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

function getActionError(error: unknown) {
  return error instanceof ApiError ? error.message : 'خطای پیش‌بینی‌نشده‌ای رخ داد.'
}

function getText(value: string | null | undefined, fallback: string) {
  const trimmedValue = value?.trim()

  return trimmedValue?.length ? trimmedValue : fallback
}

function getReviewDate(value: string) {
  const date = new Date(value)

  return Number.isNaN(date.getTime()) ? 'زمان نامشخص' : reviewDateFormatter.format(date)
}

function getReviewStatus(status: string | null): { label: string; variant: BadgeVariant } {
  const normalizedStatus = status?.trim().toLowerCase()

  if (normalizedStatus === 'approved') return { label: 'تأییدشده', variant: 'success' }
  if (normalizedStatus === 'rejected') return { label: 'ردشده', variant: 'danger' }
  if (normalizedStatus === 'pending') return { label: 'در انتظار', variant: 'accent' }

  return { label: getText(status, 'نامشخص'), variant: 'neutral' }
}

export function AdminReviewsPanel() {
  const [result, setResult] = useState<ProductReviewPage>(EMPTY_PAGE)
  const [page, setPage] = useState(1)
  const [refreshKey, setRefreshKey] = useState(0)
  const [resolvedRequestKey, setResolvedRequestKey] = useState<string | null>(null)
  const [selectedReviewId, setSelectedReviewId] = useState<string | null>(null)
  const [reply, setReply] = useState('')
  const [isReplying, setIsReplying] = useState(false)
  const [feedback, setFeedback] = useState<{ variant: 'success' | 'danger'; title: string } | null>(null)
  const requestKey = `${page}:${refreshKey}`
  const isLoading = resolvedRequestKey !== requestKey
  const selectedReview = result.items.find((review) => review.id === selectedReviewId)
    ?? result.items[0]
    ?? null

  useEffect(() => {
    const abortController = new AbortController()
    let isActive = true

    void getAdminReviews({ page, pageSize: PAGE_SIZE }, abortController.signal)
      .then((nextResult) => {
        if (isActive) setResult(nextResult)
      })
      .catch((error: unknown) => {
        if (!isActive || (error instanceof DOMException && error.name === 'AbortError')) return
        setFeedback({ variant: 'danger', title: getActionError(error) })
      })
      .finally(() => {
        if (isActive) setResolvedRequestKey(requestKey)
      })

    return () => {
      isActive = false
      abortController.abort()
    }
  }, [page, refreshKey, requestKey])

  const handleReply = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const normalizedReply = reply.trim()
    if (!selectedReview || !normalizedReply) return

    setIsReplying(true)
    setFeedback(null)

    try {
      await replyToAdminReview(selectedReview.id, normalizedReply)
      setResult((currentResult) => ({
        ...currentResult,
        items: currentResult.items.map((review) =>
          review.id === selectedReview.id
            ? { ...review, adminReply: normalizedReply, repliedAt: new Date().toISOString() }
            : review,
        ),
      }))
      setReply('')
      setFeedback({ variant: 'success', title: 'پاسخ نظر با موفقیت ثبت شد.' })
    } catch (error) {
      setFeedback({ variant: 'danger', title: getActionError(error) })
    } finally {
      setIsReplying(false)
    }
  }

  return (
    <section className="mt-6" aria-labelledby="reviews-title" dir="rtl">
      {feedback && (
        <Alert className="mb-5" live title={feedback.title} variant={feedback.variant} />
      )}

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]" dir="ltr">
        <Surface className="overflow-hidden !rounded-xl !border-[#293647] !bg-white !p-0" dir="rtl" elevation="flat" padding="none">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e0e3e5] bg-[#f7f9fb] px-4 py-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 id="reviews-title" className="m-0 text-lg font-bold text-[#191c1e]">نظرات محصولات</h2>
                <Badge variant="success">API زنده</Badge>
              </div>
              <p className="mb-0 mt-1 text-xs text-[#5b5f62]">
                {isLoading
                  ? 'در حال دریافت نظرات…'
                  : `${toPersianDigits(String(result.totalCount))} نظر ثبت‌شده`}
              </p>
            </div>
            <Button
              disabled={isLoading}
              leadingIcon={<RefreshCw aria-hidden="true" size={15} />}
              size="sm"
              variant="outline"
              onClick={() => setRefreshKey((currentKey) => currentKey + 1)}
            >
              به‌روزرسانی
            </Button>
          </div>

          {isLoading ? (
            <div className="grid gap-3 p-4" role="status" aria-label="در حال بارگذاری نظرات">
              {Array.from({ length: 4 }, (_, index) => (
                <Skeleton key={index} className="h-32 w-full rounded-lg" />
              ))}
            </div>
          ) : result.items.length === 0 ? (
            <div className="p-12 text-center">
              <Star aria-hidden="true" className="mx-auto text-accent-500" size={32} />
              <p className="mb-0 mt-3 font-bold text-[#191c1e]">هنوز نظری ثبت نشده است</p>
            </div>
          ) : (
            <div className="divide-y divide-[#e0e3e5]">
              {result.items.map((review) => {
                const isSelected = selectedReview?.id === review.id
                const status = getReviewStatus(review.status)

                return (
                  <button
                    key={review.id}
                    type="button"
                    aria-pressed={isSelected}
                    className={`relative flex w-full cursor-pointer items-start gap-3 px-4 py-4 text-right transition-colors ${isSelected ? 'bg-orange-50' : 'bg-white hover:bg-[#f7f9fb]'}`}
                    onClick={() => {
                      setSelectedReviewId(review.id)
                      setReply('')
                      setFeedback(null)
                    }}
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-orange-100 text-[#c85f00]">
                      <UserRound aria-hidden="true" size={19} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-start justify-between gap-2">
                        <strong className="text-sm text-[#191c1e]">
                          {getText(review.productName, 'محصول بدون نام')}
                        </strong>
                        <span className="text-[11px] text-[#5b5f62]">{getReviewDate(review.createdAt)}</span>
                      </span>
                      <span className="mt-1 block text-xs text-[#5b5f62]" dir="ltr">
                        {getText(review.authorPhoneNumber, 'شماره ثبت نشده')}
                      </span>
                      <span className="mt-2 line-clamp-1 block text-sm font-bold text-[#293647]">
                        {getText(review.title, 'نظر بدون عنوان')}
                      </span>
                      <span className="mt-1 line-clamp-2 block text-sm leading-6 text-[#5b5f62]">
                        {getText(review.text, 'متنی برای این نظر ثبت نشده است.')}
                      </span>
                      <span className="mt-3 flex flex-wrap items-center gap-3">
                        <Rating value={Math.max(0, Math.min(5, review.rating))} size={16} />
                        <Badge variant={status.variant}>{status.label}</Badge>
                        {review.adminReply?.trim() && <Badge variant="brand">پاسخ داده شده</Badge>}
                      </span>
                    </span>
                    {isSelected && <span aria-hidden="true" className="absolute inset-y-3 right-0 w-1 rounded-l-full bg-accent-500" />}
                  </button>
                )
              })}
            </div>
          )}

          {result.totalPages > 1 && (
            <Pagination
              className="border-t border-[#e0e3e5] p-4"
              page={page}
              pageCount={result.totalPages}
              onPageChange={setPage}
            />
          )}
        </Surface>

        <Surface className="!rounded-xl !border-[#293647] !bg-white !p-0 lg:sticky lg:top-24" dir="rtl" elevation="flat" padding="none">
          {selectedReview ? (
            <>
              <div className="border-b border-[#e0e3e5] bg-[#f7f9fb] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="m-0 text-xs text-[#5b5f62]">پاسخ به نظر محصول</p>
                    <h3 className="mb-0 mt-1 text-lg font-bold text-[#191c1e]">
                      {getText(selectedReview.productName, 'محصول بدون نام')}
                    </h3>
                  </div>
                  <MessageSquareReply aria-hidden="true" className="text-accent-500" size={24} />
                </div>
              </div>
              <div className="p-4">
                <div className="rounded-lg border border-[#e0e3e5] bg-[#f7f9fb] p-3">
                  <Rating value={Math.max(0, Math.min(5, selectedReview.rating))} size={17} />
                  <h4 className="mb-0 mt-3 text-sm font-black text-[#191c1e]">
                    {getText(selectedReview.title, 'نظر بدون عنوان')}
                  </h4>
                  <p className="mb-0 mt-2 text-sm leading-7 text-[#5b5f62]">
                    {getText(selectedReview.text, 'متنی برای این نظر ثبت نشده است.')}
                  </p>
                </div>

                {selectedReview.adminReply?.trim() && (
                  <div className="mt-3 rounded-lg border border-orange-200 bg-orange-50 p-3">
                    <p className="m-0 text-xs font-bold text-[#a84f00]">پاسخ فعلی مدیر</p>
                    <p className="mb-0 mt-2 text-sm leading-7 text-[#5b5f62]">
                      {selectedReview.adminReply}
                    </p>
                  </div>
                )}

                <form className="mt-4 grid gap-3" onSubmit={(event) => void handleReply(event)}>
                  <Textarea
                    required
                    disabled={isReplying}
                    label={selectedReview.adminReply?.trim() ? 'ویرایش پاسخ مدیر' : 'پاسخ مدیر'}
                    placeholder="پاسخ خود را بنویسید…"
                    value={reply}
                    onChange={(event) => setReply(event.target.value)}
                  />
                  <Button
                    fullWidth
                    loading={isReplying}
                    leadingIcon={<Send aria-hidden="true" size={17} />}
                    type="submit"
                  >
                    ثبت پاسخ
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="p-10 text-center text-sm text-[#5b5f62]">
              یک نظر را برای مشاهده و پاسخ انتخاب کنید.
            </div>
          )}
        </Surface>
      </div>
    </section>
  )
}
