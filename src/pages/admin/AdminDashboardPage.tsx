import {
  Archive,
  BadgeCheck,
  Boxes,
  ChevronLeft,
  CircleDollarSign,
  ClipboardCheck,
  FileClock,
  FolderTree,
  RefreshCw,
  Tags,
} from 'lucide-react'
import { useEffect, useMemo, useState, type ComponentType } from 'react'

import { getBrands } from '../../api/brands'
import { getCategories } from '../../api/categories'
import { ApiError } from '../../api/client'
import { getProducts } from '../../api/products'
import { Alert, Button, Skeleton, Surface } from '../../components/ui'
import { toPersianDigits } from '../../utils/persianDigits'
import { AdminShell } from './AdminShell'

interface DashboardData {
  totalProducts: number
  activeProducts: number
  draftProducts: number
  archivedProducts: number
  categories: number
  brands: number
}

interface MetricCardProps {
  label: string
  value: number
  description: string
  icon: ComponentType<{ size?: number; strokeWidth?: number; 'aria-hidden'?: boolean }>
  progress: number
}

const EMPTY_DASHBOARD: DashboardData = {
  totalProducts: 0,
  activeProducts: 0,
  draftProducts: 0,
  archivedProducts: 0,
  categories: 0,
  brands: 0,
}

function getErrorMessage(error: unknown) {
  return error instanceof ApiError ? error.message : 'خطای پیش‌بینی‌نشده‌ای رخ داد.'
}

function formatCount(value: number) {
  return toPersianDigits(new Intl.NumberFormat('en-US').format(value))
}

function MetricCard({ label, value, description, icon: Icon, progress }: MetricCardProps) {
  return (
    <Surface
      className="relative min-h-[162px] overflow-hidden !rounded-xl !border-[#293647] !bg-white !p-4 !shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
      elevation="flat"
      padding="none"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="text-right">
          <p className="m-0 text-sm font-semibold tracking-[0.14px] text-[#5d5e61]">{label}</p>
          <p className="mb-0 mt-1 text-[40px] font-bold leading-[48px] tracking-[-0.8px] text-[#191c1d]">
            {formatCount(value)}
          </p>
          <p className="mb-0 mt-1 text-sm leading-6 text-[#5d5e61]">{description}</p>
        </div>
        <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-[#e1e3e4] text-[#293647]">
          <Icon aria-hidden={true} size={21} strokeWidth={2.1} />
        </span>
      </div>
      <div className="absolute inset-x-4 bottom-5 h-1.5 overflow-hidden rounded-full bg-[#edeef0]">
        <span
          className="block h-full rounded-full bg-[#293647] transition-[width] duration-500"
          style={{ width: `${Math.max(4, Math.min(100, progress))}%` }}
        />
      </div>
      <span aria-hidden="true" className="absolute inset-x-px bottom-px h-1 bg-[#edeef0]" />
    </Surface>
  )
}

export function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData>(EMPTY_DASHBOARD)
  const [refreshKey, setRefreshKey] = useState(0)
  const [resolvedRefreshKey, setResolvedRefreshKey] = useState<number | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
  const isLoading = resolvedRefreshKey !== refreshKey

  useEffect(() => {
    const abortController = new AbortController()
    let isActive = true

    void Promise.all([
      getProducts({ page: 1, pageSize: 1 }, abortController.signal),
      getProducts({ page: 1, pageSize: 1, status: 'active' }, abortController.signal),
      getProducts({ page: 1, pageSize: 1, status: 'draft' }, abortController.signal),
      getProducts({ page: 1, pageSize: 1, status: 'archived' }, abortController.signal),
      getCategories(abortController.signal),
      getBrands(abortController.signal),
    ])
      .then(([allProducts, active, drafts, archived, categories, brands]) => {
        if (!isActive) return
        setData({
          totalProducts: allProducts.totalCount,
          activeProducts: active.totalCount,
          draftProducts: drafts.totalCount,
          archivedProducts: archived.totalCount,
          categories: categories.length,
          brands: brands.length,
        })
        setFeedback(null)
      })
      .catch((error: unknown) => {
        if (!isActive || (error instanceof DOMException && error.name === 'AbortError')) return
        setFeedback(getErrorMessage(error))
      })
      .finally(() => {
        if (isActive) setResolvedRefreshKey(refreshKey)
      })

    return () => {
      isActive = false
      abortController.abort()
    }
  }, [refreshKey])

  const metrics = useMemo(() => {
    const total = Math.max(data.totalProducts, 1)

    return [
      {
        label: 'کل محصولات',
        value: data.totalProducts,
        description: 'ثبت‌شده در سامانه',
        icon: Boxes,
        progress: 100,
      },
      {
        label: 'محصولات فعال',
        value: data.activeProducts,
        description: 'قابل نمایش در فروشگاه',
        icon: BadgeCheck,
        progress: (data.activeProducts / total) * 100,
      },
      {
        label: 'در انتظار بررسی',
        value: data.draftProducts,
        description: 'نیازمند تکمیل یا انتشار',
        icon: FileClock,
        progress: (data.draftProducts / total) * 100,
      },
      {
        label: 'بایگانی‌شده',
        value: data.archivedProducts,
        description: 'خارج از چرخه انتشار',
        icon: Archive,
        progress: (data.archivedProducts / total) * 100,
      },
    ]
  }, [data])

  const chartItems = useMemo(() => {
    const maxValue = Math.max(
      data.totalProducts,
      data.activeProducts,
      data.draftProducts,
      data.archivedProducts,
      1,
    )

    return [
      { label: 'کل', value: data.totalProducts, emphasis: true },
      { label: 'فعال', value: data.activeProducts },
      { label: 'پیش‌نویس', value: data.draftProducts },
      { label: 'بایگانی', value: data.archivedProducts },
    ].map((item) => ({ ...item, height: Math.max(8, (item.value / maxValue) * 100) }))
  }, [data])

  const managementNotices = [
    {
      title: 'محصولات نیازمند بررسی',
      description: `${formatCount(data.draftProducts)} محصول در وضعیت پیش‌نویس قرار دارد.`,
      icon: FileClock,
    },
    {
      title: 'دسته‌بندی‌های سامانه',
      description: `${formatCount(data.categories)} دسته‌بندی برای محصولات تعریف شده است.`,
      icon: FolderTree,
    },
    {
      title: 'برندهای ثبت‌شده',
      description: `${formatCount(data.brands)} برند در فهرست مدیریت موجود است.`,
      icon: Tags,
    },
    {
      title: 'وضعیت اتصال API',
      description: 'اطلاعات این صفحه مستقیماً از backend دریافت شد.',
      icon: BadgeCheck,
    },
  ]

  return (
    <AdminShell activeSection="dashboard">
      <main className="px-4 pb-10 pt-4 sm:px-6 lg:px-10 lg:pb-8" aria-labelledby="dashboard-title">
        <div className="sr-only">
          <h1 id="dashboard-title">پیشخوان مدیریت</h1>
        </div>

        {feedback && (
          <Alert className="mb-4" live title={feedback} variant="danger" />
        )}

        <section aria-label="خلاصه محصولات" className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {isLoading
            ? Array.from({ length: 4 }, (_, index) => (
                <Skeleton key={index} className="h-[162px] w-full rounded-xl" />
              ))
            : metrics.map((metric) => <MetricCard key={metric.label} {...metric} />)}
        </section>

        <div className="mt-10 grid gap-8 lg:grid-cols-[286px_minmax(0,1fr)]" dir="ltr">
          <Surface
            className="order-2 overflow-hidden !rounded-xl !border-[#293647] !bg-white !p-0 lg:order-1"
            dir="rtl"
            elevation="flat"
            padding="none"
          >
            <div className="flex min-h-20 items-center justify-between border-b border-[#e0e3e5] bg-[#f0f1f2] px-4">
              <div className="flex items-center gap-2">
                <ClipboardCheck aria-hidden="true" className="text-[#293647]" size={22} />
                <h2 className="m-0 text-xl font-bold text-[#191c1d]">اطلاعیه‌های مدیریت</h2>
              </div>
              <span className="rounded-full bg-[#293647] px-2.5 py-1 text-xs font-bold text-white">
                {formatCount(managementNotices.length)} مورد
              </span>
            </div>
            <div className="grid gap-2 p-2.5">
              {isLoading
                ? Array.from({ length: 4 }, (_, index) => (
                    <Skeleton key={index} className="h-[78px] w-full rounded-lg" />
                  ))
                : managementNotices.map((notice, index) => {
                    const Icon = notice.icon

                    return (
                      <article
                        key={notice.title}
                        className="relative flex items-start gap-2 rounded-lg border border-[#293647] bg-[#f8f9fa] p-2"
                      >
                        <span className="flex size-8 shrink-0 items-center justify-center rounded bg-[#e1e3e4] text-[#293647]">
                          <Icon aria-hidden="true" size={15} strokeWidth={2.1} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="m-0 text-sm font-bold text-[#191c1d]">{notice.title}</h3>
                            <span className="text-[10px] text-[#5d5e61]">{formatCount(index + 1)}</span>
                          </div>
                          <p className="mb-0 mt-1 text-xs leading-5 text-[#5d5e61]">{notice.description}</p>
                        </div>
                        <span aria-hidden="true" className="absolute inset-y-2 right-0 w-1 rounded-l-full bg-[#293647]" />
                      </article>
                    )
                  })}
            </div>
            <Button
              className="mx-2.5 mb-4 w-[calc(100%-1.25rem)] !border-[#293647] !bg-[#edeef0] !text-[#191c1d] !shadow-none"
              disabled={isLoading}
              leadingIcon={<RefreshCw aria-hidden="true" size={16} />}
              variant="outline"
              onClick={() => setRefreshKey((currentKey) => currentKey + 1)}
            >
              به‌روزرسانی اطلاعات
            </Button>
          </Surface>

          <div className="order-1 grid content-start gap-8 lg:order-2" dir="rtl">
            <Surface
              className="min-h-[410px] !rounded-xl !border-[#293647] !bg-white !p-5"
              elevation="flat"
              padding="none"
            >
              <div className="flex items-center justify-between gap-3 border-b border-[#e0e3e5] pb-4">
                <div className="flex items-center gap-2">
                  <Boxes aria-hidden="true" className="text-[#293647]" size={24} />
                  <h2 className="m-0 text-2xl font-bold tracking-[-0.4px] text-[#191c1d]">وضعیت انتشار محصولات</h2>
                </div>
                <button
                  type="button"
                  className="flex cursor-pointer items-center gap-1 text-sm font-bold text-[#293647] hover:underline"
                  onClick={() => {
                    window.location.hash = '#/admin/products'
                  }}
                >
                  مشاهده محصولات
                  <ChevronLeft aria-hidden="true" size={17} />
                </button>
              </div>

              {isLoading ? (
                <Skeleton className="mt-8 h-72 w-full rounded-lg" />
              ) : (
                <div className="relative mt-8 h-[285px] border-b border-dashed border-[#d9dcdf]" role="img" aria-label="نمودار وضعیت انتشار محصولات">
                  <div className="pointer-events-none absolute inset-0 grid grid-rows-3">
                    {Array.from({ length: 3 }, (_, index) => (
                      <span key={index} className="border-t border-dashed border-[#e6e8ea]" />
                    ))}
                  </div>
                  <div className="absolute inset-x-2 bottom-0 top-2 flex items-end justify-around gap-5">
                    {chartItems.map((item) => (
                      <div key={item.label} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end">
                        <span className="mb-2 text-xs font-bold text-[#293647]">{formatCount(item.value)}</span>
                        <span
                          className={item.emphasis ? 'w-full max-w-28 bg-[#293647]' : 'w-full max-w-28 bg-[#dfe1e3]'}
                          style={{ height: `${item.height}%` }}
                        />
                        <span className="mt-3 whitespace-nowrap text-xs font-bold text-[#5d5e61] sm:text-sm">{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Surface>

            <div className="grid gap-6 sm:grid-cols-2">
              <button
                type="button"
                className="flex min-h-28 cursor-pointer items-center justify-between rounded-xl border border-[#293647] bg-white px-6 text-right transition-colors hover:bg-[#f3f4f5]"
                onClick={() => {
                  window.location.hash = '#/admin/products?focus=price'
                }}
              >
                <span className="flex items-center gap-4">
                  <span className="flex size-14 items-center justify-center rounded-full border border-[#d8dbde] bg-[#f0f1f2] text-[#293647]">
                    <CircleDollarSign aria-hidden="true" size={24} />
                  </span>
                  <span>
                    <strong className="block text-xl text-[#191c1d]">مدیریت قیمت‌ها</strong>
                    <span className="mt-1 block text-sm text-[#5d5e61]">بررسی و ویرایش قیمت محصولات</span>
                  </span>
                </span>
                <ChevronLeft aria-hidden="true" className="text-[#5d5e61]" size={20} />
              </button>
              <button
                type="button"
                className="flex min-h-28 cursor-pointer items-center justify-between rounded-xl border border-[#293647] bg-white px-6 text-right transition-colors hover:bg-[#f3f4f5]"
                onClick={() => {
                  window.location.hash = '#/admin/products'
                }}
              >
                <span className="flex items-center gap-4">
                  <span className="flex size-14 items-center justify-center rounded-full border border-[#d8dbde] bg-[#f0f1f2] text-[#293647]">
                    <ClipboardCheck aria-hidden="true" size={24} />
                  </span>
                  <span>
                    <strong className="block text-xl text-[#191c1d]">مدیریت موجودی</strong>
                    <span className="mt-1 block text-sm text-[#5d5e61]">مدیریت چرخه انتشار کالاها</span>
                  </span>
                </span>
                <ChevronLeft aria-hidden="true" className="text-[#5d5e61]" size={20} />
              </button>
            </div>
          </div>
        </div>
      </main>
    </AdminShell>
  )
}
