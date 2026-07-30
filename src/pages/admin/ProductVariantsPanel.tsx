import { useEffect, useRef, useState, type FormEvent } from 'react'

import { ApiError } from '../../api/client'
import {
  createProductVariant,
  deleteProductVariant,
  getProductVariants,
  updateProductVariant,
  type ProductVariant,
  type UpsertProductVariantInput,
} from '../../api/productAssets'
import { Alert, Badge, Button, Input, Skeleton, Surface, Switch } from '../../components/ui'
import { formatCurrencyLabel } from '../../utils/currency'
import { parseNonNegativeInt32, parseNonNegativePrice } from '../../utils/numericInput'
import { toPersianDigits } from '../../utils/persianDigits'

interface ProductVariantsPanelProps {
  productId: string
  onBusyChange: (isBusy: boolean) => void
  onProductChanged: () => void
}

interface AttributeRow {
  id: number
  key: string
  value: string
}

interface VariantForm {
  name: string
  sku: string
  price: string
  stockQuantity: string
  reorderPoint: string
  isActive: boolean
  attributes: AttributeRow[]
}

interface Feedback {
  variant: 'success' | 'danger'
  title: string
}

const priceFormatter = new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 2 })
let attributeRowId = 0

function createAttributeRow(key = '', value = ''): AttributeRow {
  attributeRowId += 1
  return { id: attributeRowId, key, value }
}

function createEmptyForm(): VariantForm {
  return {
    name: '',
    sku: '',
    price: '',
    stockQuantity: '۰',
    reorderPoint: '۰',
    isActive: true,
    attributes: [],
  }
}

function variantToForm(variant: ProductVariant): VariantForm {
  return {
    name: variant.name ?? '',
    sku: variant.sku ?? '',
    price: toPersianDigits(String(variant.price)),
    stockQuantity: toPersianDigits(String(variant.stockQuantity)),
    reorderPoint: toPersianDigits(String(variant.reorderPoint)),
    isActive: variant.isActive,
    attributes: Object.entries(variant.attributes ?? {}).map(([key, value]) =>
      createAttributeRow(key, value),
    ),
  }
}

function getActionError(error: unknown) {
  return error instanceof ApiError ? error.message : 'خطای پیش‌بینی‌نشده‌ای رخ داد.'
}

function getVariantName(variant: ProductVariant) {
  const name = variant.name?.trim()

  return name?.length ? name : 'تنوع بدون نام'
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

export function ProductVariantsPanel({
  productId,
  onBusyChange,
  onProductChanged,
}: ProductVariantsPanelProps) {
  const [variants, setVariants] = useState<ProductVariant[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [pendingAction, setPendingAction] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [editingVariantId, setEditingVariantId] = useState<string | null>(null)
  const [form, setForm] = useState<VariantForm | null>(null)
  const editorRef = useRef<HTMLDivElement>(null)
  const isBusy = pendingAction !== null

  useEffect(() => {
    const abortController = new AbortController()
    let isActive = true

    void getProductVariants(productId, abortController.signal)
      .then((response) => {
        if (isActive) setVariants(response)
      })
      .catch((error: unknown) => {
        if (!isActive || (error instanceof DOMException && error.name === 'AbortError')) return
        setFeedback({ variant: 'danger', title: getActionError(error) })
      })
      .finally(() => {
        if (isActive) setIsLoading(false)
      })

    return () => {
      isActive = false
      abortController.abort()
    }
  }, [productId])

  useEffect(() => {
    onBusyChange(isBusy)
    return () => onBusyChange(false)
  }, [isBusy, onBusyChange])

  const openEditor = (variant?: ProductVariant) => {
    setEditingVariantId(variant?.id ?? null)
    setForm(variant ? variantToForm(variant) : createEmptyForm())
    setFeedback(null)
    requestAnimationFrame(() => editorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }

  const closeEditor = () => {
    setEditingVariantId(null)
    setForm(null)
  }

  const refreshVariants = async () => {
    const response = await getProductVariants(productId)
    setVariants(response)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!form) return

    const name = form.name.trim()
    const sku = form.sku.trim()
    const price = parseNonNegativePrice(form.price)
    const stockQuantity = parseNonNegativeInt32(form.stockQuantity)
    const reorderPoint = parseNonNegativeInt32(form.reorderPoint)
    const attributesResult = createAttributes(form.attributes)

    if (!name || !sku) {
      setFeedback({ variant: 'danger', title: 'نام تنوع و کد SKU الزامی هستند.' })
      return
    }
    if (price === null) {
      setFeedback({ variant: 'danger', title: 'قیمت معتبر و نامنفی وارد کنید.' })
      return
    }
    if (stockQuantity === null || reorderPoint === null) {
      setFeedback({
        variant: 'danger',
        title: 'موجودی و نقطه سفارش باید عدد صحیح و نامنفی باشند.',
      })
      return
    }
    if (!attributesResult.success) {
      setFeedback({ variant: 'danger', title: attributesResult.error })
      return
    }

    const input: UpsertProductVariantInput = {
      name,
      sku,
      price,
      stockQuantity,
      reorderPoint,
      isActive: form.isActive,
      attributes: attributesResult.attributes,
    }

    setPendingAction('save')
    setFeedback(null)

    try {
      if (editingVariantId) {
        await updateProductVariant(productId, editingVariantId, input)
      } else {
        await createProductVariant(productId, input)
      }
      await refreshVariants()
      closeEditor()
      onProductChanged()
      setFeedback({
        variant: 'success',
        title: editingVariantId ? 'تنوع محصول ویرایش شد.' : 'تنوع تازه به محصول اضافه شد.',
      })
    } catch (error) {
      setFeedback({ variant: 'danger', title: getActionError(error) })
    } finally {
      setPendingAction(null)
    }
  }

  const handleDelete = async (variant: ProductVariant) => {
    if (!window.confirm(`تنوع «${getVariantName(variant)}» حذف شود؟`)) return

    setPendingAction(`delete:${variant.id}`)
    setFeedback(null)

    try {
      await deleteProductVariant(productId, variant.id)
      await refreshVariants()
      if (editingVariantId === variant.id) closeEditor()
      onProductChanged()
      setFeedback({ variant: 'success', title: 'تنوع محصول حذف شد.' })
    } catch (error) {
      setFeedback({ variant: 'danger', title: getActionError(error) })
    } finally {
      setPendingAction(null)
    }
  }

  return (
    <section aria-labelledby="variants-heading" className="grid gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 id="variants-heading" className="m-0 text-lg font-black text-brand-950">
            تنوع‌های محصول
          </h3>
          <p className="mb-0 mt-1 text-sm leading-6 text-muted">
            مدل‌ها، SKU، قیمت، موجودی و ویژگی‌های قابل انتخاب را مدیریت کنید.
          </p>
        </div>
        <Button disabled={isBusy} variant="secondary" onClick={() => openEditor()}>
          افزودن تنوع
        </Button>
      </div>

      {feedback && <Alert live title={feedback.title} variant={feedback.variant} />}

      {form && (
        <Surface ref={editorRef} className="scroll-mt-4 border border-accent-500/35" padding="lg">
          <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="m-0 text-xs font-bold text-accent-500">ویرایشگر تنوع</p>
              <h4 className="mb-0 mt-1 text-base font-black text-brand-950">
                {editingVariantId ? 'ویرایش تنوع' : 'افزودن تنوع جدید'}
              </h4>
            </div>
            <Button disabled={isBusy} size="sm" variant="ghost" onClick={closeEditor}>
              بستن فرم
            </Button>
          </div>

          <form className="grid gap-4" onSubmit={(event) => void handleSubmit(event)}>
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                required
                disabled={isBusy}
                label="نام تنوع"
                maxLength={160}
                placeholder="برای مثال: مدل یک اسب"
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
              />
              <Input
                required
                disabled={isBusy}
                label="کد SKU"
                maxLength={120}
                normalizeDigits={false}
                placeholder="PMP-1HP"
                value={form.sku}
                onChange={(event) => setForm({ ...form, sku: event.target.value })}
              />
              <Input
                required
                disabled={isBusy}
                inputMode="decimal"
                label="قیمت (تومان)"
                placeholder="۰"
                value={form.price}
                onChange={(event) => setForm({ ...form, price: event.target.value })}
              />
              <Input
                required
                disabled={isBusy}
                inputMode="numeric"
                label="تعداد موجودی"
                placeholder="۰"
                value={form.stockQuantity}
                onChange={(event) => setForm({ ...form, stockQuantity: event.target.value })}
              />
              <Input
                required
                disabled={isBusy}
                inputMode="numeric"
                label="نقطه سفارش مجدد"
                placeholder="۰"
                value={form.reorderPoint}
                onChange={(event) => setForm({ ...form, reorderPoint: event.target.value })}
              />
              <Switch
                checked={form.isActive}
                className="self-end rounded-df-md border border-border-soft bg-white px-4 py-3"
                disabled={isBusy}
                label="تنوع فعال باشد"
                description="تنوع غیرفعال برای مشتری قابل انتخاب نیست."
                onChange={(event) => setForm({ ...form, isActive: event.target.checked })}
              />
            </div>

            <div className="rounded-df-md border border-border-soft bg-canvas/55 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h5 className="m-0 text-sm font-black text-brand-950">ویژگی‌ها</h5>
                  <p className="mb-0 mt-1 text-xs text-muted">مثل توان: یک اسب یا ولتاژ: ۲۲۰ ولت</p>
                </div>
                <Button
                  disabled={isBusy || form.attributes.length >= 12}
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setForm({ ...form, attributes: [...form.attributes, createAttributeRow()] })
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
                          setForm({
                            ...form,
                            attributes: form.attributes.map((item) =>
                              item.id === attribute.id ? { ...item, key: event.target.value } : item,
                            ),
                          })
                        }
                      />
                      <Input
                        aria-label={`مقدار ویژگی ${index + 1}`}
                        disabled={isBusy}
                        maxLength={160}
                        placeholder="مقدار"
                        value={attribute.value}
                        onChange={(event) =>
                          setForm({
                            ...form,
                            attributes: form.attributes.map((item) =>
                              item.id === attribute.id ? { ...item, value: event.target.value } : item,
                            ),
                          })
                        }
                      />
                      <Button
                        className="md:self-center"
                        disabled={isBusy}
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          setForm({
                            ...form,
                            attributes: form.attributes.filter((item) => item.id !== attribute.id),
                          })
                        }
                      >
                        حذف ردیف
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button loading={pendingAction === 'save'} type="submit">
                {editingVariantId ? 'ذخیره تغییرات' : 'ثبت تنوع'}
              </Button>
              <Button disabled={isBusy} variant="outline" onClick={closeEditor}>
                انصراف
              </Button>
            </div>
          </form>
        </Surface>
      )}

      {isLoading ? (
        <div className="grid gap-3 md:grid-cols-2" role="status" aria-label="در حال دریافت تنوع‌ها">
          <Skeleton className="h-44 rounded-df-md" />
          <Skeleton className="h-44 rounded-df-md" />
        </div>
      ) : variants.length === 0 ? (
        <div className="rounded-df-md border border-dashed border-border p-8 text-center">
          <p className="m-0 font-black text-brand-950">این محصول هنوز تنوعی ندارد</p>
          <p className="mb-0 mt-2 text-sm text-muted">برای مدیریت قیمت و موجودی مدل‌ها، اولین تنوع را اضافه کنید.</p>
        </div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {variants.map((variant) => {
            const lowStock = variant.stockQuantity <= variant.reorderPoint
            const attributes = Object.entries(variant.attributes ?? {})

            return (
              <article key={variant.id} className="rounded-df-md border border-border-soft bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={variant.isActive ? 'success' : 'neutral'}>
                        {variant.isActive ? 'فعال' : 'غیرفعال'}
                      </Badge>
                      <span className="text-xs font-bold text-muted" dir="ltr">
                        {variant.sku?.trim().length ? variant.sku.trim() : 'بدون SKU'}
                      </span>
                    </div>
                    <h4 className="mb-0 mt-3 text-base font-black text-brand-950">{getVariantName(variant)}</h4>
                  </div>
                  <strong className="text-sm text-brand-950">
                    {priceFormatter.format(variant.price)} {formatCurrencyLabel(variant.currency)}
                  </strong>
                </div>

                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted">
                  <span>
                    موجودی:{' '}
                    <strong className={lowStock ? 'text-danger-600' : 'text-ink'}>
                      {toPersianDigits(String(variant.stockQuantity))}
                    </strong>
                  </span>
                  <span>نقطه سفارش: <strong className="text-ink">{toPersianDigits(String(variant.reorderPoint))}</strong></span>
                </div>

                {attributes.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {attributes.map(([key, value]) => (
                      <span key={key} className="rounded-full bg-canvas px-3 py-1 text-xs text-ink">
                        {key}: <strong>{value}</strong>
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-4 flex flex-wrap gap-2 border-t border-border-soft pt-3">
                  <Button disabled={isBusy} size="sm" variant="outline" onClick={() => openEditor(variant)}>
                    ویرایش
                  </Button>
                  <Button
                    disabled={isBusy}
                    loading={pendingAction === `delete:${variant.id}`}
                    size="sm"
                    variant="danger"
                    onClick={() => void handleDelete(variant)}
                  >
                    حذف
                  </Button>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}
