import { useEffect, useMemo, useState, type FormEvent } from 'react'

import {
  createBrand,
  deleteBrand,
  getBrands,
  invalidateBrandQueries,
  updateBrand,
  type Brand,
} from '../../api/brands'
import { ApiError } from '../../api/client'
import { Alert, Button, Input, Pagination, Surface } from '../../components/ui'
import { toPersianDigits } from '../../utils/persianDigits'

interface Feedback {
  variant: 'success' | 'danger'
  title: string
}

type PendingAction = 'save' | 'delete' | 'refresh' | null

const BRANDS_PER_PAGE = 12

function getBrandName(brand: Brand) {
  const name = brand.name?.trim()

  return name?.length ? name : 'برند بدون نام'
}

function getActionError(error: unknown) {
  return error instanceof ApiError ? error.message : 'خطای پیش‌بینی‌نشده‌ای رخ داد.'
}

export function BrandsManager() {
  const [brands, setBrands] = useState<Brand[]>([])
  const [name, setName] = useState('')
  const [query, setQuery] = useState('')
  const [editingBrandId, setEditingBrandId] = useState<string | null>(null)
  const [pendingBrandId, setPendingBrandId] = useState<string | null>(null)
  const [pendingAction, setPendingAction] = useState<PendingAction>(null)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)

  const filteredBrands = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('fa')
    if (!normalizedQuery) return brands

    return brands.filter((brand) =>
      getBrandName(brand).toLocaleLowerCase('fa').includes(normalizedQuery),
    )
  }, [brands, query])
  const pageCount = Math.max(1, Math.ceil(filteredBrands.length / BRANDS_PER_PAGE))
  const currentPage = Math.min(page, pageCount)
  const visibleBrands = useMemo(() => {
    const startIndex = (currentPage - 1) * BRANDS_PER_PAGE

    return filteredBrands.slice(startIndex, startIndex + BRANDS_PER_PAGE)
  }, [currentPage, filteredBrands])

  useEffect(() => {
    let isActive = true

    void getBrands()
      .then((nextBrands) => {
        if (isActive) setBrands(nextBrands)
      })
      .catch((error: unknown) => {
        if (isActive) setFeedback({ variant: 'danger', title: getActionError(error) })
      })
      .finally(() => {
        if (isActive) setIsLoading(false)
      })

    return () => {
      isActive = false
    }
  }, [])

  const resetEditor = () => {
    setEditingBrandId(null)
    setName('')
  }

  const handleRefresh = async () => {
    setPendingAction('refresh')
    setIsLoading(true)
    setFeedback(null)

    try {
      invalidateBrandQueries()
      setBrands(await getBrands())
      setFeedback({ variant: 'success', title: 'فهرست برندها به‌روز شد.' })
    } catch (error) {
      setFeedback({ variant: 'danger', title: getActionError(error) })
    } finally {
      setIsLoading(false)
      setPendingAction(null)
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const normalizedName = name.trim()

    if (!normalizedName) {
      setFeedback({ variant: 'danger', title: 'نام برند را وارد کنید.' })
      return
    }

    setPendingAction('save')
    setFeedback(null)

    try {
      if (editingBrandId) {
        await updateBrand(editingBrandId, normalizedName)
        setBrands((currentBrands) =>
          currentBrands.map((brand) =>
            brand.id === editingBrandId ? { ...brand, name: normalizedName } : brand,
          ),
        )
        setFeedback({ variant: 'success', title: 'برند ویرایش شد.' })
      } else {
        const id = await createBrand(normalizedName)
        setBrands((currentBrands) => [...currentBrands, { id, name: normalizedName }])
        setFeedback({ variant: 'success', title: 'برند جدید اضافه شد.' })
      }

      resetEditor()
      setPage(1)
    } catch (error) {
      setFeedback({ variant: 'danger', title: getActionError(error) })
    } finally {
      setPendingAction(null)
    }
  }

  const handleDelete = async (brand: Brand) => {
    if (!window.confirm(`برند «${getBrandName(brand)}» حذف شود؟`)) return

    setPendingAction('delete')
    setPendingBrandId(brand.id)
    setFeedback(null)

    try {
      await deleteBrand(brand.id)
      setBrands((currentBrands) => currentBrands.filter((item) => item.id !== brand.id))
      if (editingBrandId === brand.id) resetEditor()
      setFeedback({ variant: 'success', title: 'برند حذف شد.' })
    } catch (error) {
      setFeedback({ variant: 'danger', title: getActionError(error) })
    } finally {
      setPendingAction(null)
      setPendingBrandId(null)
    }
  }

  const isBusy = pendingAction !== null

  return (
    <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-12" dir="rtl">
      <header className="mb-7">
        <p className="mb-1 text-sm font-bold text-accent-500">مدیریت کاتالوگ</p>
        <h1 className="m-0 text-2xl font-black text-brand-950 sm:text-3xl">مدیریت برندها</h1>
        <p className="mb-0 mt-2 max-w-2xl text-sm leading-7 text-muted">
          برندهای قابل انتخاب در محصولات را اضافه، ویرایش یا حذف کنید.
        </p>
      </header>

      {feedback && (
        <Alert className="mb-5" live title={feedback.title} variant={feedback.variant} />
      )}

      <div className="grid gap-5">
        <Surface elevation="raised" padding="lg">
          <h2 className="m-0 text-lg font-black text-brand-950">
            {editingBrandId ? 'ویرایش برند' : 'افزودن برند'}
          </h2>
          <p className="mb-5 mt-1 text-xs leading-6 text-muted">
            نام برند در فرم‌های ثبت و ویرایش محصول نمایش داده می‌شود.
          </p>
          <form className="grid gap-4" onSubmit={(event) => void handleSubmit(event)}>
            <Input
              required
              disabled={isBusy}
              label="نام برند"
              maxLength={120}
              placeholder="برای مثال: پمپیران"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
            <div className="flex flex-wrap gap-2">
              <Button loading={pendingAction === 'save'} type="submit">
                {editingBrandId ? 'ذخیره تغییرات' : 'افزودن برند'}
              </Button>
              {editingBrandId && (
                <Button disabled={isBusy} variant="ghost" onClick={resetEditor}>
                  انصراف
                </Button>
              )}
            </div>
          </form>
        </Surface>

        <Surface elevation="raised" padding="lg">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="m-0 text-lg font-black text-brand-950">فهرست برندها</h2>
              <p className="mb-0 mt-1 text-xs text-muted">
                {isLoading
                  ? 'در حال دریافت اطلاعات…'
                  : `${toPersianDigits(String(filteredBrands.length))} برند`}
              </p>
            </div>
            <Button
              disabled={isBusy}
              loading={pendingAction === 'refresh'}
              size="sm"
              variant="outline"
              onClick={() => void handleRefresh()}
            >
              به‌روزرسانی
            </Button>
          </div>

          <Input
            disabled={isLoading || isBusy}
            label="جستجو در برندها"
            placeholder="نام برند"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setPage(1)
            }}
          />

          {isLoading || visibleBrands.length === 0 ? (
            <div className="mt-4 rounded-df-md border border-dashed border-border p-5 text-center text-sm text-muted">
              {isLoading
                ? 'برندها در حال دریافت هستند.'
                : brands.length === 0
                  ? 'هنوز برندی ثبت نشده است.'
                  : 'برندی با این عبارت پیدا نشد.'}
            </div>
          ) : (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {visibleBrands.map((brand) => (
                <article
                  key={brand.id}
                  className="rounded-df-md border border-border-soft bg-canvas/60 p-4"
                >
                  <h3 className="m-0 text-base font-black text-brand-950">
                    {getBrandName(brand)}
                  </h3>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      disabled={isBusy}
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingBrandId(brand.id)
                        setName(brand.name ?? '')
                        setFeedback(null)
                      }}
                    >
                      ویرایش
                    </Button>
                    <Button
                      disabled={isBusy}
                      loading={pendingAction === 'delete' && pendingBrandId === brand.id}
                      size="sm"
                      variant="danger"
                      onClick={() => void handleDelete(brand)}
                    >
                      حذف
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          )}

          {pageCount > 1 && (
            <Pagination
              className="mt-5"
              page={currentPage}
              pageCount={pageCount}
              onPageChange={setPage}
            />
          )}
        </Surface>
      </div>
    </section>
  )
}
