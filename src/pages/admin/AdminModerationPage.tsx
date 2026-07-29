import { useEffect, useMemo, useState } from 'react'

import { getBrands, type Brand } from '../../api/brands'
import { getCategories, type Category } from '../../api/categories'
import { ApiError } from '../../api/client'
import {
  archiveProduct,
  deleteProduct,
  duplicateProduct,
  getProducts,
  publishProduct,
  unpublishProduct,
  type Product,
  type ProductPage,
  type ProductStatus,
} from '../../api/products'
import {
  Alert,
  Badge,
  Button,
  Checkbox,
  Dropdown,
  Pagination,
  Skeleton,
  Surface,
  type BadgeVariant,
} from '../../components/ui'
import { toPersianDigits } from '../../utils/persianDigits'
import { ProductEditorDialog, type ProductEditorTarget } from './ProductEditorDialog'
import { AdminShell } from './AdminShell'

type ProductAction = 'publish' | 'unpublish' | 'archive' | 'duplicate' | 'delete'

interface Feedback {
  variant: 'success' | 'danger'
  title: string
}

const PAGE_SIZE = 8
const EMPTY_PAGE: ProductPage = {
  items: [],
  page: 1,
  pageSize: PAGE_SIZE,
  totalCount: 0,
  totalPages: 1,
}

const statusOptions: { value: ProductStatus | ''; label: string }[] = [
  { value: '', label: 'همه وضعیت‌ها' },
  { value: 'draft', label: 'پیش‌نویس' },
  { value: 'active', label: 'فعال' },
  { value: 'inactive', label: 'غیرفعال' },
  { value: 'outOfStock', label: 'ناموجود' },
  { value: 'discontinued', label: 'توقف تولید' },
  { value: 'archived', label: 'بایگانی‌شده' },
]

const sortOptions = [
  { value: '', label: 'مرتب‌سازی پیش‌فرض' },
  { value: 'Newest', label: 'جدیدترین' },
  { value: 'Oldest', label: 'قدیمی‌ترین' },
  { value: 'NameAscending', label: 'نام: الف تا ی' },
  { value: 'NameDescending', label: 'نام: ی تا الف' },
  { value: 'PriceAscending', label: 'کمترین قیمت' },
  { value: 'PriceDescending', label: 'بیشترین قیمت' },
]

const dateFormatter = new Intl.DateTimeFormat('fa-IR', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
})
const priceFormatter = new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 2 })

function formatProductDate(value: string) {
  const date = new Date(value)

  return Number.isNaN(date.getTime()) ? 'نامشخص' : dateFormatter.format(date)
}

function getActionError(error: unknown) {
  return error instanceof ApiError ? error.message : 'خطای پیش‌بینی‌نشده‌ای رخ داد.'
}

function getDisplayValue(value: string | null | undefined, fallback: string) {
  const trimmedValue = value?.trim()

  return trimmedValue?.length ? trimmedValue : fallback
}

function getProductName(product: Product) {
  return getDisplayValue(product.name, 'محصول بدون نام')
}

function getStatusDetails(status: string | null): { label: string; variant: BadgeVariant } {
  switch (status?.trim().toLowerCase()) {
    case 'active':
      return { label: 'فعال', variant: 'success' }
    case 'inactive':
      return { label: 'غیرفعال', variant: 'brand' }
    case 'outofstock':
      return { label: 'ناموجود', variant: 'danger' }
    case 'discontinued':
      return { label: 'توقف تولید', variant: 'neutral' }
    case 'archived':
      return { label: 'بایگانی‌شده', variant: 'neutral' }
    case 'draft':
      return { label: 'پیش‌نویس', variant: 'accent' }
    default:
      return { label: getDisplayValue(status, 'نامشخص'), variant: 'brand' }
  }
}

function isStatus(product: Product, status: string) {
  return product.status?.trim().toLowerCase() === status.toLowerCase()
}

function getCategoryLabel(category: Category) {
  return getDisplayValue(category.name, 'دسته‌بندی بدون نام')
}

function getBrandLabel(brand: Brand) {
  return getDisplayValue(brand.name, 'برند بدون نام')
}

function getInitialProductSearch() {
  const queryString = window.location.hash.split('?')[1] ?? ''

  return new URLSearchParams(queryString).get('search')?.trim() ?? ''
}

export function AdminModerationPage() {
  const [productsPage, setProductsPage] = useState<ProductPage>(EMPTY_PAGE)
  const [categories, setCategories] = useState<Category[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [searchDraft, setSearchDraft] = useState(getInitialProductSearch)
  const [search, setSearch] = useState(getInitialProductSearch)
  const [status, setStatus] = useState<ProductStatus | ''>('')
  const [categoryId, setCategoryId] = useState('')
  const [brandId, setBrandId] = useState('')
  const [sort, setSort] = useState('')
  const [page, setPage] = useState(1)
  const [refreshKey, setRefreshKey] = useState(0)
  const [resolvedRequestKey, setResolvedRequestKey] = useState<string | null>(null)
  const [isLoadingOptions, setIsLoadingOptions] = useState(true)
  const [pendingAction, setPendingAction] = useState<ProductAction | null>(null)
  const [pendingProductId, setPendingProductId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [editorTarget, setEditorTarget] = useState<ProductEditorTarget | null>(null)
  const requestKey = [page, search, status, categoryId, brandId, sort, refreshKey].join('|')
  const isLoading = resolvedRequestKey !== requestKey

  const categoryOptions = useMemo(
    () => [
      { value: '', label: 'همه دسته‌بندی‌ها' },
      ...categories.map((category) => ({ value: category.id, label: getCategoryLabel(category) })),
    ],
    [categories],
  )
  const brandOptions = useMemo(
    () => [
      { value: '', label: 'همه برندها' },
      ...brands.map((brand) => ({ value: brand.id, label: getBrandLabel(brand) })),
    ],
    [brands],
  )

  useEffect(() => {
    let isActive = true

    void Promise.all([getCategories(), getBrands()])
      .then(([nextCategories, nextBrands]) => {
        if (!isActive) return
        setCategories(nextCategories)
        setBrands(nextBrands)
      })
      .catch((error: unknown) => {
        if (isActive) setFeedback({ variant: 'danger', title: getActionError(error) })
      })
      .finally(() => {
        if (isActive) setIsLoadingOptions(false)
      })

    return () => {
      isActive = false
    }
  }, [])

  useEffect(() => {
    const abortController = new AbortController()
    let isActive = true

    void getProducts(
      {
        page,
        pageSize: PAGE_SIZE,
        search,
        sort,
        categoryId,
        brandId,
        status: status || undefined,
      },
      abortController.signal,
    )
      .then((nextPage) => {
        if (isActive) setProductsPage(nextPage)
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
  }, [brandId, categoryId, page, refreshKey, requestKey, search, sort, status])

  const handleSearch = (nextSearch: string) => {
    setPage(1)
    setSearch(nextSearch)
  }

  const resetFilters = () => {
    setSearchDraft('')
    setSearch('')
    setStatus('')
    setCategoryId('')
    setBrandId('')
    setSort('')
    setPage(1)
  }

  const runProductAction = async (product: Product, action: ProductAction) => {
    if (
      action === 'delete' &&
      !window.confirm(`محصول «${getProductName(product)}» برای همیشه حذف شود؟`)
    ) {
      return
    }

    if (
      action === 'archive' &&
      !window.confirm(`محصول «${getProductName(product)}» بایگانی شود؟`)
    ) {
      return
    }

    setPendingAction(action)
    setPendingProductId(product.id)
    setFeedback(null)

    try {
      if (action === 'publish') await publishProduct(product.id)
      if (action === 'unpublish') await unpublishProduct(product.id)
      if (action === 'archive') await archiveProduct(product.id)
      if (action === 'duplicate') await duplicateProduct(product.id)
      if (action === 'delete') await deleteProduct(product.id)

      if (action === 'publish' || action === 'unpublish' || action === 'archive') {
        const nextStatus = action === 'publish' ? 'active' : action === 'archive' ? 'archived' : 'inactive'
        setProductsPage((currentPage) => ({
          ...currentPage,
          items: currentPage.items.map((currentProduct) =>
            currentProduct.id === product.id
              ? { ...currentProduct, status: nextStatus }
              : currentProduct,
          ),
        }))
      } else {
        setRefreshKey((currentKey) => currentKey + 1)
      }

      const actionMessage: Record<ProductAction, string> = {
        publish: 'محصول منتشر شد.',
        unpublish: 'انتشار محصول متوقف شد.',
        archive: 'محصول بایگانی شد.',
        duplicate: 'یک نسخه جدید از محصول ساخته شد.',
        delete: 'محصول حذف شد.',
      }
      setFeedback({ variant: 'success', title: actionMessage[action] })
    } catch (error) {
      setFeedback({ variant: 'danger', title: getActionError(error) })
    } finally {
      setPendingAction(null)
      setPendingProductId(null)
    }
  }

  const isProductBusy = pendingProductId !== null

  return (
    <AdminShell
      activeSection="products"
      search={{
        value: searchDraft,
        disabled: isLoading,
        placeholder: 'جستجو در محصولات…',
        onChange: setSearchDraft,
        onSubmit: handleSearch,
      }}
    >
      <main className="p-4 sm:p-6 lg:p-10">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="m-0 text-xs font-bold text-accent-500">پنل مدیریت محتوا</p>
                <h1 className="mb-0 mt-1 text-2xl font-black text-brand-950 sm:text-3xl">
                  مدیریت و نظارت محصولات
                </h1>
                <p className="mb-0 mt-2 text-sm leading-7 text-muted">
                  بررسی، ویرایش و تغییر وضعیت انتشار محصولات فروشگاه
                </p>
              </div>
              <Button
                disabled={isLoadingOptions || categories.length === 0 || brands.length === 0}
                variant="secondary"
                onClick={() => setEditorTarget({ mode: 'create' })}
              >
                افزودن محصول
              </Button>
            </div>

            {feedback && (
              <Alert className="mb-5" live title={feedback.title} variant={feedback.variant} />
            )}

            <div className="grid items-start gap-5 lg:grid-cols-[256px_minmax(0,1fr)]">
              <Surface className="lg:sticky lg:top-28" elevation="flat" padding="md">
                <h2 className="m-0 text-lg font-black text-brand-950">فیلترها</h2>
                <div className="mt-5 grid gap-5">
                  <fieldset className="m-0 grid gap-3 border-0 p-0">
                    <legend className="mb-2 text-sm font-black text-brand-950">وضعیت</legend>
                    {statusOptions.map((option) => (
                      <Checkbox
                        key={option.value.length ? option.value : 'all'}
                        checked={status === option.value}
                        disabled={isLoading}
                        label={option.label}
                        onChange={() => {
                          setStatus(option.value)
                          setPage(1)
                        }}
                      />
                    ))}
                  </fieldset>
                  <div className="h-px bg-border-soft" />
                  <Dropdown
                    disabled={isLoadingOptions}
                    label="دسته‌بندی"
                    options={categoryOptions}
                    value={categoryId}
                    onChange={(nextCategoryId) => {
                      setCategoryId(nextCategoryId)
                      setPage(1)
                    }}
                  />
                  <Dropdown
                    disabled={isLoadingOptions}
                    label="برند"
                    options={brandOptions}
                    value={brandId}
                    onChange={(nextBrandId) => {
                      setBrandId(nextBrandId)
                      setPage(1)
                    }}
                  />
                  <Dropdown
                    label="مرتب‌سازی"
                    options={sortOptions}
                    value={sort}
                    onChange={(nextSort) => {
                      setSort(nextSort)
                      setPage(1)
                    }}
                  />
                  <Button fullWidth variant="outline" onClick={resetFilters}>
                    پاک‌کردن فیلترها
                  </Button>
                </div>
              </Surface>

              <section aria-labelledby="products-heading" className="min-w-0">
                <Surface elevation="flat" padding="md">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-soft pb-4">
                    <div>
                      <h2 id="products-heading" className="m-0 text-lg font-black text-brand-950">
                        صف بررسی محصولات
                      </h2>
                      <p className="mb-0 mt-1 text-xs text-muted">
                        {isLoading
                          ? 'در حال دریافت محصولات…'
                          : `${toPersianDigits(String(productsPage.totalCount))} محصول`}
                      </p>
                    </div>
                    <Button
                      disabled={isLoading || isProductBusy}
                      size="sm"
                      variant="ghost"
                      onClick={() => setRefreshKey((currentKey) => currentKey + 1)}
                    >
                      به‌روزرسانی
                    </Button>
                  </div>

                  {isLoading ? (
                    <div className="grid gap-3 pt-4" role="status" aria-label="در حال بارگذاری محصولات">
                      {Array.from({ length: 4 }, (_, index) => (
                        <Skeleton key={index} className="h-36 w-full rounded-df-md" />
                      ))}
                    </div>
                  ) : productsPage.items.length === 0 ? (
                    <div className="mt-4 rounded-df-md border border-dashed border-border p-8 text-center">
                      <p className="m-0 font-bold text-brand-950">محصولی پیدا نشد</p>
                      <p className="mb-0 mt-2 text-sm text-muted">فیلترها را تغییر دهید یا محصول تازه‌ای بسازید.</p>
                    </div>
                  ) : (
                    <div className="grid gap-3 pt-4">
                      {productsPage.items.map((product) => {
                        const statusDetails = getStatusDetails(product.status)
                        const isPending = pendingProductId === product.id
                        const description = product.description?.trim()

                        return (
                          <article key={product.id} className="rounded-df-md border border-border-soft bg-white p-4 shadow-sm">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <Badge variant={statusDetails.variant}>{statusDetails.label}</Badge>
                                  <span className="text-xs text-muted">{getDisplayValue(product.categoryName, 'بدون دسته‌بندی')}</span>
                                  <span aria-hidden="true" className="size-1 rounded-full bg-border" />
                                  <span className="text-xs text-muted">{getDisplayValue(product.brandName, 'بدون برند')}</span>
                                </div>
                                <h3 className="mb-0 mt-3 truncate text-lg font-black text-brand-950">
                                  {getProductName(product)}
                                </h3>
                                <p className="mb-0 mt-1 line-clamp-2 text-sm leading-6 text-muted">
                                  {description?.length ? description : 'توضیحی برای این محصول ثبت نشده است.'}
                                </p>
                                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted">
                                  <span>قیمت: <strong className="text-ink">{priceFormatter.format(product.price)} {product.currency ?? ''}</strong></span>
                                  <span>ساخته‌شده: {formatProductDate(product.createdAt)}</span>
                                  {product.slug?.trim() && <span dir="ltr">/{product.slug}</span>}
                                </div>
                              </div>
                            </div>
                            <div className="mt-4 flex flex-wrap gap-2 border-t border-border-soft pt-3">
                              <Button
                                disabled={isProductBusy}
                                size="sm"
                                variant="outline"
                                onClick={() => setEditorTarget({ mode: 'edit', product })}
                              >
                                ویرایش
                              </Button>
                              {isStatus(product, 'active') ? (
                                <Button
                                  disabled={isProductBusy}
                                  loading={isPending && pendingAction === 'unpublish'}
                                  size="sm"
                                  variant="outline"
                                  onClick={() => void runProductAction(product, 'unpublish')}
                                >
                                  توقف انتشار
                                </Button>
                              ) : !isStatus(product, 'archived') && !isStatus(product, 'discontinued') && (
                                <Button
                                  disabled={isProductBusy}
                                  loading={isPending && pendingAction === 'publish'}
                                  size="sm"
                                  onClick={() => void runProductAction(product, 'publish')}
                                >
                                  انتشار
                                </Button>
                              )}
                              {!isStatus(product, 'archived') && (
                                <Button
                                  disabled={isProductBusy}
                                  loading={isPending && pendingAction === 'archive'}
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => void runProductAction(product, 'archive')}
                                >
                                  بایگانی
                                </Button>
                              )}
                              <Button
                                disabled={isProductBusy}
                                loading={isPending && pendingAction === 'duplicate'}
                                size="sm"
                                variant="ghost"
                                onClick={() => void runProductAction(product, 'duplicate')}
                              >
                                تکثیر
                              </Button>
                              <Button
                                disabled={isProductBusy}
                                loading={isPending && pendingAction === 'delete'}
                                size="sm"
                                variant="danger"
                                onClick={() => void runProductAction(product, 'delete')}
                              >
                                حذف
                              </Button>
                            </div>
                          </article>
                        )
                      })}
                    </div>
                  )}
                </Surface>

                {productsPage.totalPages > 1 && (
                  <Pagination
                    className="mt-5 justify-center"
                    page={page}
                    pageCount={productsPage.totalPages}
                    onPageChange={setPage}
                  />
                )}
              </section>
            </div>
      </main>
      {editorTarget && (
        <ProductEditorDialog
          key={editorTarget.mode === 'edit' ? editorTarget.product.id : 'create'}
          brands={brands}
          categories={categories}
          target={editorTarget}
          onClose={() => setEditorTarget(null)}
          onSaved={() => {
            setEditorTarget(null)
            setPage(1)
            setRefreshKey((currentKey) => currentKey + 1)
            setFeedback({ variant: 'success', title: 'اطلاعات محصول ذخیره شد.' })
          }}
        />
      )}
    </AdminShell>
  )
}
