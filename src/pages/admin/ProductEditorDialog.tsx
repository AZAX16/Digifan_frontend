import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'

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
import { useDialogLifecycle } from '../../hooks/useDialogLifecycle'
import { parseNonNegativeInt32, parseNonNegativePrice } from '../../utils/numericInput'
import { toPersianDigits } from '../../utils/persianDigits'

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

interface AttributeRow {
  id: number
  key: string
  value: string
}

interface ProductForm {
  name: string
  sku: string
  description: string
  categoryId: string
  brandId: string
  price: string
  stockQuantity: string
  reorderPoint: string
  attributes: AttributeRow[]
}

let attributeRowId = 0

function createAttributeRow(key = '', value = ''): AttributeRow {
  attributeRowId += 1
  return { id: attributeRowId, key, value }
}

function createEmptyForm(): ProductForm {
  return {
    name: '',
    sku: '',
    description: '',
    categoryId: '',
    brandId: '',
    price: '',
    stockQuantity: '۰',
    reorderPoint: '۰',
    attributes: [],
  }
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
    sku: product.sku ?? '',
    description: product.description ?? '',
    categoryId: product.categoryId,
    brandId: product.brandId,
    price: toPersianDigits(String(product.price)),
    stockQuantity: toPersianDigits(String(product.stockQuantity)),
    reorderPoint: toPersianDigits(String(product.reorderPoint)),
    attributes: Object.entries(product.attributes ?? {}).map(([key, value]) =>
      createAttributeRow(key, value),
    ),
  }
}

function createAttributes(rows: AttributeRow[]):
  | { success: true; attributes: Record<string, string> | null }
  | { success: false; error: string } {
  const attributes: Record<string, string> = {}

  for (const row of rows) {
    const key = row.key.trim()
    const value = row.value.trim()

    if (!key && !value) continue
    if (!key || !value) {
      return { success: false, error: 'برای هر ویژگی، نام و مقدار را کامل وارد کنید.' }
    }
    if (Object.hasOwn(attributes, key)) {
      return { success: false, error: `ویژگی «${key}» تکراری است.` }
    }

    attributes[key] = value
  }

  return {
    success: true,
    attributes: Object.keys(attributes).length ? attributes : null,
  }
}

export function ProductEditorDialog({
  target,
  categories,
  brands,
  onClose,
  onSaved,
}: ProductEditorDialogProps) {
  const [form, setForm] = useState<ProductForm>(() =>
    target.mode === 'create' ? createEmptyForm() : productToForm(target.product),
  )
  const [feedback, setFeedback] = useState<string | null>(null)
  const [isLoadingDetails, setIsLoadingDetails] = useState(target.mode !== 'create')
  const [isSaving, setIsSaving] = useState(false)
  const dialogRef = useRef<HTMLDivElement>(null)
  const categoryOptions = useMemo(
    () => categories.map((category) => ({ value: category.id, label: getCategoryLabel(category) })),
    [categories],
  )
  const brandOptions = useMemo(
    () => brands.map((brand) => ({ value: brand.id, label: getBrandLabel(brand) })),
    [brands],
  )

  useEffect(() => {
    if (target.mode === 'create') return

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
    const sku = form.sku.trim()
    const description = form.description.trim()
    const price = parseNonNegativePrice(form.price)
    const stockQuantity = parseNonNegativeInt32(form.stockQuantity)
    const reorderPoint = parseNonNegativeInt32(form.reorderPoint)
    const attributesResult = createAttributes(form.attributes)

    if (!name || !form.categoryId || !form.brandId) {
      setFeedback('نام، دسته‌بندی و برند محصول الزامی هستند.')
      return
    }
    if (price === null) {
      setFeedback('قیمت معتبر و نامنفی وارد کنید.')
      return
    }
    if (stockQuantity === null || reorderPoint === null) {
      setFeedback('موجودی و نقطه سفارش باید عدد صحیح و نامنفی باشند.')
      return
    }
    if (!attributesResult.success) {
      setFeedback(attributesResult.error)
      return
    }

    const input: ProductInput = {
      name,
      sku: sku.length ? sku : null,
      description: description.length ? description : null,
      categoryId: form.categoryId,
      brandId: form.brandId,
      price,
      stockQuantity,
      reorderPoint,
      attributes: attributesResult.attributes,
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
  useDialogLifecycle(dialogRef, onClose, { closeDisabled: isBusy })

  useEffect(() => {
    if (!isBusy && document.activeElement === dialogRef.current) {
      dialogRef.current?.querySelector<HTMLInputElement>('input:not([disabled])')?.focus()
    }
  }, [isBusy])

  return (
    <div className="fixed inset-0 z-[80] overflow-y-auto bg-brand-950/45 px-4 py-8 backdrop-blur-sm" dir="rtl">
      <Surface
        ref={dialogRef}
        tabIndex={-1}
        aria-labelledby="product-editor-title"
        className="mx-auto max-w-3xl"
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

        {target.mode === 'edit' && (
          <Alert className="mb-5" title="ویرایش کامل مطابق API جدید" variant="info">
            شناسه کالا، قیمت، موجودی، نقطه سفارش و ویژگی‌های پایه اکنون همراه اطلاعات محصول قابل ویرایش هستند.
          </Alert>
        )}

        <form className="grid gap-4" onSubmit={(event) => void handleSubmit(event)}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              required
              disabled={isBusy}
              label="نام محصول"
              maxLength={160}
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            />
            <Input
              disabled={isBusy}
              label="شناسه کالا (SKU)"
              maxLength={120}
              normalizeDigits={false}
              placeholder="PMP-100"
              value={form.sku}
              onChange={(event) => setForm((current) => ({ ...current, sku: event.target.value }))}
            />
          </div>
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
          <div className="grid gap-4 sm:grid-cols-3">
            <Input
              required
              disabled={isBusy}
              inputMode="decimal"
              label="قیمت (تومان)"
              placeholder="۰"
              value={form.price}
              onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))}
            />
            <Input
              required
              disabled={isBusy}
              inputMode="numeric"
              label="تعداد موجودی"
              placeholder="۰"
              value={form.stockQuantity}
              onChange={(event) =>
                setForm((current) => ({ ...current, stockQuantity: event.target.value }))
              }
            />
            <Input
              required
              disabled={isBusy}
              inputMode="numeric"
              label="نقطه سفارش مجدد"
              placeholder="۰"
              value={form.reorderPoint}
              onChange={(event) =>
                setForm((current) => ({ ...current, reorderPoint: event.target.value }))
              }
            />
          </div>

          <div className="rounded-df-md border border-border-soft bg-canvas/55 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="m-0 text-sm font-black text-brand-950">ویژگی‌های محصول</h3>
                <p className="mb-0 mt-1 text-xs text-muted">مثل توان: یک اسب یا ولتاژ: ۲۲۰ ولت</p>
              </div>
              <Button
                disabled={isBusy || form.attributes.length >= 20}
                size="sm"
                variant="outline"
                onClick={() =>
                  setForm((current) => ({
                    ...current,
                    attributes: [...current.attributes, createAttributeRow()],
                  }))
                }
              >
                افزودن ویژگی
              </Button>
            </div>

            {form.attributes.length === 0 ? (
              <p className="mb-0 mt-4 text-sm text-muted">ویژگی اختصاصی ثبت نشده است.</p>
            ) : (
              <div className="mt-4 grid gap-3">
                {form.attributes.map((attribute, index) => (
                  <div key={attribute.id} className="grid gap-2 md:grid-cols-[1fr_1fr_auto]">
                    <Input
                      aria-label={`نام ویژگی ${index + 1}`}
                      disabled={isBusy}
                      maxLength={80}
                      placeholder="نام ویژگی"
                      value={attribute.key}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          attributes: current.attributes.map((item) =>
                            item.id === attribute.id ? { ...item, key: event.target.value } : item,
                          ),
                        }))
                      }
                    />
                    <Input
                      aria-label={`مقدار ویژگی ${index + 1}`}
                      disabled={isBusy}
                      maxLength={160}
                      placeholder="مقدار"
                      value={attribute.value}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          attributes: current.attributes.map((item) =>
                            item.id === attribute.id ? { ...item, value: event.target.value } : item,
                          ),
                        }))
                      }
                    />
                    <Button
                      className="md:self-center"
                      disabled={isBusy}
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        setForm((current) => ({
                          ...current,
                          attributes: current.attributes.filter((item) => item.id !== attribute.id),
                        }))
                      }
                    >
                      حذف ردیف
                    </Button>
                  </div>
                ))}
              </div>
            )}
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
