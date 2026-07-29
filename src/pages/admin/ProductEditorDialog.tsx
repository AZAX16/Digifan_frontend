import { useEffect, useMemo, useState, type FormEvent } from 'react'

import type { Brand } from '../../api/brands'
import type { Category } from '../../api/categories'
import { ApiError } from '../../api/client'
import {
  createProduct,
  getProduct,
  updateProduct,
  type Product,
  type ProductInput,
} from '../../api/products'
import { Alert, Button, Dropdown, Input, Surface, Textarea } from '../../components/ui'
import { toPersianDigits, toWesternDigits } from '../../utils/persianDigits'

export type ProductEditorTarget =
  | { mode: 'create' }
  | { mode: 'edit'; product: Product }

interface ProductEditorDialogProps {
  target: ProductEditorTarget
  categories: Category[]
  brands: Brand[]
  onClose: () => void
  onSaved: () => void
}

interface ProductForm {
  name: string
  description: string
  categoryId: string
  brandId: string
  price: string
  currency: string
}

const EMPTY_FORM: ProductForm = {
  name: '',
  description: '',
  categoryId: '',
  brandId: '',
  price: '',
  currency: 'IRR',
}

function getDisplayValue(value: string | null | undefined, fallback: string) {
  const trimmedValue = value?.trim()

  return trimmedValue?.length ? trimmedValue : fallback
}

function getCategoryLabel(category: Category) {
  return getDisplayValue(category.name, 'دسته‌بندی بدون نام')
}

function getBrandLabel(brand: Brand) {
  return getDisplayValue(brand.name, 'برند بدون نام')
}

function getActionError(error: unknown) {
  return error instanceof ApiError ? error.message : 'خطای پیش‌بینی‌نشده‌ای رخ داد.'
}

function productToForm(product: Product): ProductForm {
  return {
    name: product.name ?? '',
    description: product.description ?? '',
    categoryId: product.categoryId,
    brandId: product.brandId,
    price: toPersianDigits(String(product.price)),
    currency: getDisplayValue(product.currency, 'IRR'),
  }
}

function parsePrice(value: string) {
  const normalizedValue = toWesternDigits(value)
    .replace(/[٬,\s]/g, '')
    .replace('٫', '.')

  return Number(normalizedValue)
}

export function ProductEditorDialog({
  target,
  categories,
  brands,
  onClose,
  onSaved,
}: ProductEditorDialogProps) {
  const [form, setForm] = useState<ProductForm>(() =>
    target.mode === 'edit' ? productToForm(target.product) : EMPTY_FORM,
  )
  const [feedback, setFeedback] = useState<string | null>(null)
  const [isLoadingDetails, setIsLoadingDetails] = useState(target.mode === 'edit')
  const [isSaving, setIsSaving] = useState(false)
  const categoryOptions = useMemo(
    () => categories.map((category) => ({ value: category.id, label: getCategoryLabel(category) })),
    [categories],
  )
  const brandOptions = useMemo(
    () => brands.map((brand) => ({ value: brand.id, label: getBrandLabel(brand) })),
    [brands],
  )

  useEffect(() => {
    if (target.mode !== 'edit') return

    const abortController = new AbortController()
    let isActive = true

    void getProduct(target.product.id, abortController.signal)
      .then((product) => {
        if (isActive) setForm(productToForm(product))
      })
      .catch((error: unknown) => {
        if (!isActive || (error instanceof DOMException && error.name === 'AbortError')) return
        setFeedback(getActionError(error))
      })
      .finally(() => {
        if (isActive) setIsLoadingDetails(false)
      })

    return () => {
      isActive = false
      abortController.abort()
    }
  }, [target])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const name = form.name.trim()
    const description = form.description.trim()
    const price = parsePrice(form.price)

    if (!name || !form.categoryId || !form.brandId) {
      setFeedback('نام، دسته‌بندی و برند محصول الزامی هستند.')
      return
    }

    if (!Number.isFinite(price) || price < 0) {
      setFeedback('قیمت معتبر وارد کنید.')
      return
    }

    const input: ProductInput = {
      name,
      description: description.length ? description : null,
      categoryId: form.categoryId,
      brandId: form.brandId,
      price,
      currency: form.currency,
    }

    setIsSaving(true)
    setFeedback(null)

    try {
      if (target.mode === 'edit') await updateProduct(target.product.id, input)
      else await createProduct(input)

      onSaved()
    } catch (error) {
      setFeedback(getActionError(error))
      setIsSaving(false)
    }
  }

  const isBusy = isLoadingDetails || isSaving

  return (
    <div className="fixed inset-0 z-[80] overflow-y-auto bg-brand-950/45 px-4 py-8 backdrop-blur-sm" dir="rtl">
      <Surface
        aria-labelledby="product-editor-title"
        className="mx-auto max-w-2xl"
        elevation="raised"
        padding="lg"
        role="dialog"
        aria-modal="true"
      >
        <div className="mb-5 flex items-start justify-between gap-4 border-b border-border-soft pb-4">
          <div>
            <p className="m-0 text-xs font-bold text-accent-500">مدیریت محتوای محصول</p>
            <h2 id="product-editor-title" className="mb-0 mt-1 text-xl font-black text-brand-950">
              {target.mode === 'edit' ? 'ویرایش محصول' : 'افزودن محصول'}
            </h2>
          </div>
          <Button disabled={isBusy} size="sm" variant="ghost" onClick={onClose}>
            بستن
          </Button>
        </div>

        {feedback && <Alert className="mb-5" live title={feedback} variant="danger" />}

        <form className="grid gap-4" onSubmit={(event) => void handleSubmit(event)}>
          <Input
            required
            disabled={isBusy}
            label="نام محصول"
            maxLength={160}
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
          />
          <Textarea
            disabled={isBusy}
            label="توضیحات"
            maxLength={2000}
            value={form.description}
            onChange={(event) =>
              setForm((current) => ({ ...current, description: event.target.value }))
            }
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Dropdown
              disabled={isBusy || categoryOptions.length === 0}
              label="دسته‌بندی"
              options={categoryOptions}
              placeholder="انتخاب دسته‌بندی"
              value={form.categoryId}
              onChange={(categoryId) => setForm((current) => ({ ...current, categoryId }))}
            />
            <Dropdown
              disabled={isBusy || brandOptions.length === 0}
              label="برند"
              options={brandOptions}
              placeholder="انتخاب برند"
              value={form.brandId}
              onChange={(brandId) => setForm((current) => ({ ...current, brandId }))}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              required
              disabled={isBusy}
              inputMode="decimal"
              label="قیمت"
              placeholder="۰"
              value={form.price}
              onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))}
            />
            <Dropdown
              disabled={isBusy}
              label="واحد پول"
              options={[
                { value: 'IRR', label: 'ریال (IRR)' },
                { value: 'TOMAN', label: 'تومان' },
                { value: 'USD', label: 'دلار (USD)' },
              ]}
              value={form.currency}
              onChange={(currency) => setForm((current) => ({ ...current, currency }))}
            />
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button loading={isSaving} type="submit">
              {target.mode === 'edit' ? 'ذخیره تغییرات' : 'ساخت محصول'}
            </Button>
            <Button disabled={isBusy} variant="outline" onClick={onClose}>
              انصراف
            </Button>
          </div>
        </form>
      </Surface>
    </div>
  )
}
