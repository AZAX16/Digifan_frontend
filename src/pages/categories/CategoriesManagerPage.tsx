import { useEffect, useMemo, useState, type FormEvent } from 'react'

import {
  ApiError,
  createCategory,
  deleteCategory,
  getCategories,
  invalidateCategoryQueries,
  updateCategory,
  type Category,
  type CategoryInput,
} from '../../api/categories'
import { Alert, Button, Dropdown, Input, Pagination, Surface, Textarea } from '../../components/ui'
import { toPersianDigits } from '../../utils/persianDigits'

interface CategoryForm {
  name: string
  description: string
  parentCategoryId: string
}

interface Feedback {
  variant: 'success' | 'danger'
  title: string
}

type PendingAction = 'save' | 'delete' | 'refresh' | null

const EMPTY_FORM: CategoryForm = {
  name: '',
  description: '',
  parentCategoryId: '',
}

const ALL_PARENT_FILTER = 'all'
const NO_PARENT_FILTER = 'no-parent'
const CATEGORIES_PER_PAGE = 20

function getCategoryLabel(category: Category) {
  const name = category.name?.trim()

  return name?.length ? name : 'دسته‌بندی بدون نام'
}

function getActionError(error: unknown) {
  return error instanceof ApiError ? error.message : 'خطای پیش‌بینی‌نشده‌ای رخ داد.'
}

function getUnavailableParentIds(categories: Category[], editingCategoryId: string | null) {
  const unavailableIds = new Set<string>()
  if (!editingCategoryId) return unavailableIds

  const childrenByParentId = new Map<string, string[]>()
  categories.forEach((category) => {
    if (!category.parentCategoryId) return

    const childIds = childrenByParentId.get(category.parentCategoryId) ?? []
    childIds.push(category.id)
    childrenByParentId.set(category.parentCategoryId, childIds)
  })

  const pendingIds = [editingCategoryId]
  while (pendingIds.length > 0) {
    const currentId = pendingIds.pop()
    if (!currentId || unavailableIds.has(currentId)) continue

    unavailableIds.add(currentId)
    pendingIds.push(...(childrenByParentId.get(currentId) ?? []))
  }

  return unavailableIds
}

export function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [parentFilter, setParentFilter] = useState(ALL_PARENT_FILTER)
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null)
  const [pendingCategoryId, setPendingCategoryId] = useState<string | null>(null)
  const [form, setForm] = useState<CategoryForm>(EMPTY_FORM)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [pendingAction, setPendingAction] = useState<PendingAction>(null)
  const [listPage, setListPage] = useState(1)

  const categoryById = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories],
  )

  const filteredCategories = useMemo(() => {
    if (parentFilter === ALL_PARENT_FILTER) return categories

    return categories.filter((category) =>
      parentFilter === NO_PARENT_FILTER
        ? category.parentCategoryId === null
        : category.parentCategoryId === parentFilter,
    )
  }, [categories, parentFilter])
  const listPageCount = Math.max(1, Math.ceil(filteredCategories.length / CATEGORIES_PER_PAGE))
  const currentListPage = Math.min(listPage, listPageCount)
  const visibleCategories = useMemo(() => {
    const startIndex = (currentListPage - 1) * CATEGORIES_PER_PAGE

    return filteredCategories.slice(startIndex, startIndex + CATEGORIES_PER_PAGE)
  }, [currentListPage, filteredCategories])

  const parentFilterOptions = useMemo(
    () => {
      const usedParentIds = new Set(
        categories.flatMap((category) =>
          category.parentCategoryId ? [category.parentCategoryId] : [],
        ),
      )

      return [
        { value: ALL_PARENT_FILTER, label: 'همه دسته‌بندی‌ها' },
        { value: NO_PARENT_FILTER, label: 'دسته‌بندی‌های اصلی' },
        ...categories
          .filter((category) => usedParentIds.has(category.id))
          .map((category) => ({ value: category.id, label: getCategoryLabel(category) })),
      ]
    },
    [categories],
  )

  const parentOptions = useMemo(
    () => {
      const unavailableParentIds = getUnavailableParentIds(categories, editingCategoryId)

      return [
        { value: '', label: 'ثبت به‌عنوان دسته‌بندی اصلی' },
        ...categories
          .filter((category) => !unavailableParentIds.has(category.id))
          .map((category) => ({
            value: category.id,
            label: getCategoryLabel(category),
          })),
      ]
    },
    [categories, editingCategoryId],
  )

  useEffect(() => {
    let isActive = true

    void getCategories()
      .then((nextCategories) => {
        if (!isActive) return

        setCategories(nextCategories)
      })
      .catch((error: unknown) => {
        if (!isActive) return

        setFeedback({ variant: 'danger', title: getActionError(error) })
      })
      .finally(() => {
        if (isActive) setIsLoading(false)
      })

    return () => {
      isActive = false
    }
  }, [])

  const resetEditor = () => {
    setEditingCategoryId(null)
    setForm(EMPTY_FORM)
  }

  const handleRefresh = async () => {
    setPendingAction('refresh')
    setIsLoading(true)
    setFeedback(null)

    try {
      invalidateCategoryQueries()
      const nextCategories = await getCategories()
      setCategories(nextCategories)
      setFeedback({ variant: 'success', title: 'فهرست دسته‌بندی‌ها به‌روز شد.' })
    } catch (error) {
      setFeedback({ variant: 'danger', title: getActionError(error) })
    } finally {
      setIsLoading(false)
      setPendingAction(null)
    }
  }

  const handleEdit = (category: Category) => {
    setEditingCategoryId(category.id)
    setForm({
      name: category.name ?? '',
      description: category.description ?? '',
      parentCategoryId: category.parentCategoryId ?? '',
    })
    setFeedback(null)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const name = form.name.trim()
    const description = form.description.trim()

    if (!name) {
      setFeedback({ variant: 'danger', title: 'نام دسته‌بندی را وارد کنید.' })
      return
    }

    const input: CategoryInput = {
      name,
      description: description.length ? description : null,
      parentCategoryId: form.parentCategoryId.length ? form.parentCategoryId : null,
    }

    setPendingAction('save')
    setFeedback(null)

    try {
      if (editingCategoryId) {
        await updateCategory(editingCategoryId, input)
        setCategories((currentCategories) =>
          currentCategories.map((category) =>
            category.id === editingCategoryId ? { id: category.id, ...input } : category,
          ),
        )
        setParentFilter(input.parentCategoryId ?? NO_PARENT_FILTER)
        setFeedback({ variant: 'success', title: 'دسته‌بندی ویرایش شد.' })
      } else {
        const id = await createCategory(input)
        setCategories((currentCategories) => [...currentCategories, { id, ...input }])
        setParentFilter(input.parentCategoryId ?? NO_PARENT_FILTER)
        setFeedback({ variant: 'success', title: 'دسته‌بندی جدید اضافه شد.' })
      }

      resetEditor()
      setListPage(1)
    } catch (error) {
      setFeedback({ variant: 'danger', title: getActionError(error) })
    } finally {
      setPendingAction(null)
    }
  }

  const handleDelete = async (category: Category) => {
    const categoryLabel = getCategoryLabel(category)
    const confirmed = window.confirm(`دسته‌بندی «${categoryLabel}» حذف شود؟`)

    if (!confirmed) return

    setPendingAction('delete')
    setPendingCategoryId(category.id)
    setFeedback(null)

    try {
      await deleteCategory(category.id)
      setCategories((currentCategories) =>
        currentCategories.filter((currentCategory) => currentCategory.id !== category.id),
      )

      if (editingCategoryId === category.id) resetEditor()

      setFeedback({ variant: 'success', title: 'دسته‌بندی حذف شد.' })
    } catch (error) {
      setFeedback({ variant: 'danger', title: getActionError(error) })
    } finally {
      setPendingAction(null)
      setPendingCategoryId(null)
    }
  }

  const isBusy = pendingAction !== null

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-8 sm:px-6 lg:py-12" dir="rtl">
      <header className="mb-7">
        <p className="mb-1 text-sm font-bold text-accent-500">نسخه آزمایشی اتصال به API</p>
        <h1 className="m-0 text-2xl font-black text-brand-950 sm:text-3xl">
          مدیریت دسته‌بندی‌ها
        </h1>
        <p className="mb-0 mt-2 max-w-2xl text-sm leading-7 text-muted">
          در این صفحه می‌توانید دسته‌بندی‌ها را مشاهده، اضافه، ویرایش یا حذف کنید.
        </p>
      </header>

      {feedback && (
        <Alert
          className="mb-5"
          live
          title={feedback.title}
          variant={feedback.variant}
        />
      )}

      <div className="grid gap-5">
        <Surface elevation="raised" padding="lg">
          <h2 className="m-0 text-lg font-black text-brand-950">
            {editingCategoryId ? 'ویرایش دسته‌بندی' : 'افزودن دسته‌بندی'}
          </h2>
          <p className="mb-5 mt-1 text-xs leading-6 text-muted">
            نام الزامی است؛ برای ساخت دسته‌بندی فرعی، انتخاب دسته‌بندی اصلی اختیاری است.
          </p>

          <form className="grid gap-4" onSubmit={(event) => void handleSubmit(event)}>
            <Input
              required
              disabled={isBusy}
              label="نام دسته‌بندی"
              maxLength={120}
              placeholder="برای مثال: پمپ آب"
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            />
            <Textarea
              disabled={isBusy}
              label="توضیحات"
              maxLength={500}
              placeholder="توضیح کوتاهی درباره این دسته‌بندی"
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({ ...current, description: event.target.value }))
              }
            />
            <Dropdown
              disabled={isBusy}
              label="دسته‌بندی اصلی"
              options={parentOptions}
              value={form.parentCategoryId}
              onChange={(parentCategoryId) =>
                setForm((current) => ({ ...current, parentCategoryId }))
              }
            />

            <div className="mt-1 flex flex-wrap gap-2">
              <Button loading={pendingAction === 'save'} type="submit">
                {editingCategoryId ? 'ذخیره تغییرات' : 'افزودن دسته‌بندی'}
              </Button>
              {editingCategoryId && (
                <Button disabled={isBusy} variant="ghost" onClick={resetEditor}>
                  انصراف
                </Button>
              )}
            </div>
          </form>
        </Surface>

        <Surface elevation="raised" padding="lg">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="m-0 text-lg font-black text-brand-950">فهرست دسته‌بندی‌ها</h2>
              <p className="mb-0 mt-1 text-xs text-muted">
                {isLoading ? 'در حال دریافت اطلاعات…' : (
                  `${toPersianDigits(String(filteredCategories.length))} از ${toPersianDigits(
                    String(categories.length),
                  )} دسته‌بندی`
                )}
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

          <Dropdown
            disabled={isLoading || categories.length === 0 || isBusy}
            label="فیلتر بر اساس دسته‌بندی اصلی"
            options={parentFilterOptions}
            value={parentFilter}
            onChange={(nextParentFilter) => {
              setParentFilter(nextParentFilter)
              setListPage(1)
            }}
          />

          {isLoading || filteredCategories.length === 0 ? (
            <div className="mt-4 rounded-df-md border border-dashed border-border p-5 text-center text-sm text-muted">
              {isLoading
                ? 'دسته‌بندی‌ها در حال دریافت هستند.'
                : categories.length === 0
                  ? 'هنوز دسته‌بندی‌ای ثبت نشده است.'
                  : 'دسته‌بندی‌ای با این فیلتر پیدا نشد.'}
            </div>
          ) : (
            <div className="mt-4 grid gap-3">
              {visibleCategories.map((category) => {
                const parentCategory = category.parentCategoryId
                  ? categoryById.get(category.parentCategoryId)
                  : undefined
                const description = category.description?.trim()

                return (
                  <article
                    key={category.id}
                    className="rounded-df-md border border-border-soft bg-canvas/60 p-4"
                  >
                    <h3 className="m-0 text-base font-black text-brand-950">
                      {getCategoryLabel(category)}
                    </h3>
                    <p className="mb-0 mt-2 text-sm leading-6 text-muted">
                      {description?.length
                        ? description
                        : 'توضیحی برای این دسته‌بندی ثبت نشده است.'}
                    </p>
                    <p className="mb-0 mt-3 text-xs text-muted">
                      دسته‌بندی اصلی:{' '}
                      <span className="font-bold text-ink">
                        {parentCategory ? getCategoryLabel(parentCategory) : 'این دسته‌بندی اصلی است'}
                      </span>
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button
                        disabled={isBusy}
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(category)}
                      >
                        ویرایش
                      </Button>
                      <Button
                        disabled={isBusy}
                        loading={pendingAction === 'delete' && pendingCategoryId === category.id}
                        size="sm"
                        variant="danger"
                        onClick={() => void handleDelete(category)}
                      >
                        حذف
                      </Button>
                    </div>
                  </article>
                )
              })}
              {listPageCount > 1 && (
                <Pagination
                  className="mt-2"
                  page={currentListPage}
                  pageCount={listPageCount}
                  onPageChange={setListPage}
                />
              )}
            </div>
          )}
        </Surface>
      </div>
    </main>
  )
}
