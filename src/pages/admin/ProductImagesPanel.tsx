import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'

import { ApiError } from '../../api/client'
import {
  addProductImage,
  deleteProductImage,
  getProductImages,
  getProductVariants,
  reorderProductImages,
  setPrimaryProductImage,
  updateProductImage,
  type ProductImage,
  type ProductVariant,
} from '../../api/productAssets'
import { Alert, Badge, Button, Dropdown, Input, Skeleton, Surface, Switch } from '../../components/ui'
import { toPersianDigits } from '../../utils/persianDigits'

interface ProductImagesPanelProps {
  productId: string
  productName: string
  onBusyChange: (isBusy: boolean) => void
  onProductChanged: () => void
}

interface ImageForm {
  url: string
  altText: string
  variantId: string
  isPrimary: boolean
}

interface Feedback {
  variant: 'success' | 'danger' | 'warning'
  title: string
}

function createEmptyForm(isFirstImage: boolean): ImageForm {
  return {
    url: '',
    altText: '',
    variantId: '',
    isPrimary: isFirstImage,
  }
}

function imageToForm(image: ProductImage): ImageForm {
  return {
    url: image.url ?? '',
    altText: image.altText ?? '',
    variantId: image.variantId ?? '',
    isPrimary: image.isPrimary,
  }
}

function getActionError(error: unknown) {
  return error instanceof ApiError ? error.message : 'خطای پیش‌بینی‌نشده‌ای رخ داد.'
}

function isValidImageUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:'
  } catch {
    return false
  }
}

function getVariantName(variant: ProductVariant) {
  const name = variant.name?.trim()
  const sku = variant.sku?.trim()

  return name?.length ? name : sku?.length ? sku : 'تنوع بدون نام'
}

function ImagePreview({ url, altText }: { url: string | null; altText: string | null }) {
  const [failed, setFailed] = useState(false)
  const normalizedAltText = altText?.trim()

  if (!url?.trim() || failed) {
    return (
      <div className="flex h-full min-h-36 items-center justify-center bg-canvas px-4 text-center text-xs text-muted">
        پیش‌نمایش تصویر در دسترس نیست
      </div>
    )
  }

  return (
    <img
      alt={normalizedAltText?.length ? normalizedAltText : 'تصویر محصول'}
      className="h-full min-h-36 w-full bg-white object-contain"
      decoding="async"
      loading="lazy"
      src={url}
      onError={() => setFailed(true)}
    />
  )
}

export function ProductImagesPanel({
  productId,
  productName,
  onBusyChange,
  onProductChanged,
}: ProductImagesPanelProps) {
  const [images, setImages] = useState<ProductImage[]>([])
  const [variants, setVariants] = useState<ProductVariant[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [pendingAction, setPendingAction] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [editingImage, setEditingImage] = useState<ProductImage | null>(null)
  const [form, setForm] = useState<ImageForm | null>(null)
  const editorRef = useRef<HTMLDivElement>(null)
  const isBusy = pendingAction !== null
  const orderedImages = useMemo(
    () => [...images].sort((first, second) => first.displayOrder - second.displayOrder),
    [images],
  )
  const variantById = useMemo(
    () => new Map(variants.map((variant) => [variant.id, variant])),
    [variants],
  )
  const variantOptions = useMemo(
    () => [
      { value: '', label: 'تصویر عمومی محصول' },
      ...variants.map((variant) => ({ value: variant.id, label: getVariantName(variant) })),
    ],
    [variants],
  )

  useEffect(() => {
    const abortController = new AbortController()
    let isActive = true

    void Promise.allSettled([
      getProductImages(productId, abortController.signal),
      getProductVariants(productId, abortController.signal),
    ])
      .then(([imagesResult, variantsResult]) => {
        if (!isActive) return

        if (imagesResult.status === 'fulfilled') setImages(imagesResult.value)
        if (variantsResult.status === 'fulfilled') setVariants(variantsResult.value)

        const rejectedResult = [imagesResult, variantsResult].find(
          (result) => result.status === 'rejected',
        )
        if (rejectedResult?.status === 'rejected') {
          const reason: unknown = rejectedResult.reason
          if (!(reason instanceof DOMException && reason.name === 'AbortError')) {
            setFeedback({ variant: 'danger', title: getActionError(reason) })
          }
        }
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

  const openEditor = (image?: ProductImage) => {
    setEditingImage(image ?? null)
    setForm(image ? imageToForm(image) : createEmptyForm(images.length === 0))
    setFeedback(null)
    requestAnimationFrame(() => editorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }

  const closeEditor = () => {
    setEditingImage(null)
    setForm(null)
  }

  const refreshImages = async () => {
    const response = await getProductImages(productId)
    setImages(response)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!form) return

    const url = form.url.trim()
    const altText = form.altText.trim()

    if (!isValidImageUrl(url)) {
      setFeedback({ variant: 'danger', title: 'نشانی کامل تصویر را با http یا https وارد کنید.' })
      return
    }

    setPendingAction('save')
    setFeedback(null)

    try {
      if (editingImage) {
        await updateProductImage(productId, editingImage.id, {
          url,
          altText: altText.length ? altText : null,
          displayOrder: editingImage.displayOrder,
          variantId: form.variantId.length ? form.variantId : null,
        })
      } else {
        const nextDisplayOrder = orderedImages.reduce(
          (highestOrder, image) => Math.max(highestOrder, image.displayOrder + 1),
          0,
        )
        await addProductImage(productId, {
          url,
          altText: altText.length ? altText : null,
          displayOrder: nextDisplayOrder,
          isPrimary: images.length === 0 ? true : form.isPrimary,
          variantId: form.variantId.length ? form.variantId : null,
        })
      }

      await refreshImages()
      closeEditor()
      onProductChanged()
      setFeedback({
        variant: 'success',
        title: editingImage ? 'اطلاعات تصویر ویرایش شد.' : 'تصویر تازه به محصول اضافه شد.',
      })
    } catch (error) {
      setFeedback({ variant: 'danger', title: getActionError(error) })
    } finally {
      setPendingAction(null)
    }
  }

  const handleDelete = async (image: ProductImage) => {
    const primaryWarning = image.isPrimary ? ' این تصویر، تصویر اصلی محصول است.' : ''
    if (!window.confirm(`تصویر انتخاب‌شده حذف شود؟${primaryWarning}`)) return

    setPendingAction(`delete:${image.id}`)
    setFeedback(null)

    try {
      await deleteProductImage(productId, image.id)
      await refreshImages()
      if (editingImage?.id === image.id) closeEditor()
      onProductChanged()
      setFeedback({ variant: 'success', title: 'تصویر محصول حذف شد.' })
    } catch (error) {
      setFeedback({ variant: 'danger', title: getActionError(error) })
    } finally {
      setPendingAction(null)
    }
  }

  const handleSetPrimary = async (image: ProductImage) => {
    setPendingAction(`primary:${image.id}`)
    setFeedback(null)

    try {
      await setPrimaryProductImage(productId, image.id)
      await refreshImages()
      onProductChanged()
      setFeedback({ variant: 'success', title: 'تصویر اصلی محصول تغییر کرد.' })
    } catch (error) {
      setFeedback({ variant: 'danger', title: getActionError(error) })
    } finally {
      setPendingAction(null)
    }
  }

  const handleMove = async (imageIndex: number, direction: -1 | 1) => {
    const targetIndex = imageIndex + direction
    if (targetIndex < 0 || targetIndex >= orderedImages.length) return

    const previousImages = images
    const reorderedImages = [...orderedImages]
    const currentImage = reorderedImages[imageIndex]
    const targetImage = reorderedImages[targetIndex]
    if (!currentImage || !targetImage) return

    reorderedImages[imageIndex] = targetImage
    reorderedImages[targetIndex] = currentImage
    setImages(reorderedImages.map((image, index) => ({ ...image, displayOrder: index })))
    setPendingAction(`order:${currentImage.id}`)
    setFeedback(null)

    try {
      await reorderProductImages(productId, reorderedImages.map((image) => image.id))
      await refreshImages()
      onProductChanged()
      setFeedback({ variant: 'success', title: 'ترتیب تصاویر ذخیره شد.' })
    } catch (error) {
      setImages(previousImages)
      setFeedback({ variant: 'danger', title: getActionError(error) })
    } finally {
      setPendingAction(null)
    }
  }

  return (
    <section aria-labelledby="images-heading" className="grid gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 id="images-heading" className="m-0 text-lg font-black text-brand-950">
            تصاویر محصول
          </h3>
          <p className="mb-0 mt-1 text-sm leading-6 text-muted">
            تصویر اصلی، ترتیب نمایش و اتصال تصویر به یک تنوع را مدیریت کنید.
          </p>
        </div>
        <Button disabled={isBusy} variant="secondary" onClick={() => openEditor()}>
          افزودن تصویر
        </Button>
      </div>

      <Alert title="تصاویر فعلاً با نشانی اینترنتی ثبت می‌شوند." variant="info">
        API فعلی فایل تصویر دریافت نمی‌کند؛ یک URL مستقیم و عمومی برای تصویر وارد کنید.
      </Alert>

      {feedback && <Alert live title={feedback.title} variant={feedback.variant} />}

      {form && (
        <Surface ref={editorRef} className="scroll-mt-4 border border-accent-500/35" padding="lg">
          <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="m-0 text-xs font-bold text-accent-500">ویرایشگر تصویر</p>
              <h4 className="mb-0 mt-1 text-base font-black text-brand-950">
                {editingImage ? 'ویرایش تصویر' : 'افزودن تصویر جدید'}
              </h4>
            </div>
            <Button disabled={isBusy} size="sm" variant="ghost" onClick={closeEditor}>
              بستن فرم
            </Button>
          </div>

          <form className="grid gap-4" onSubmit={(event) => void handleSubmit(event)}>
            <Input
              required
              dir="ltr"
              disabled={isBusy}
              label="نشانی تصویر"
              maxLength={2000}
              normalizeDigits={false}
              placeholder="https://example.com/product.webp"
              value={form.url}
              onChange={(event) => setForm({ ...form, url: event.target.value })}
            />
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                disabled={isBusy}
                label="متن جایگزین تصویر"
                maxLength={300}
                placeholder={productName}
                value={form.altText}
                onChange={(event) => setForm({ ...form, altText: event.target.value })}
              />
              <Dropdown
                disabled={isBusy}
                label="اتصال به تنوع"
                options={variantOptions}
                value={form.variantId}
                onChange={(variantId) => setForm({ ...form, variantId })}
              />
            </div>
            {!editingImage && (
              <Switch
                checked={form.isPrimary}
                className="rounded-df-md border border-border-soft bg-white px-4 py-3"
                disabled={isBusy || images.length === 0}
                label="به‌عنوان تصویر اصلی ثبت شود"
                description={images.length === 0 ? 'اولین تصویر به‌صورت خودکار اصلی است.' : undefined}
                onChange={(event) => setForm({ ...form, isPrimary: event.target.checked })}
              />
            )}
            <div className="flex flex-wrap gap-2">
              <Button loading={pendingAction === 'save'} type="submit">
                {editingImage ? 'ذخیره تغییرات' : 'ثبت تصویر'}
              </Button>
              <Button disabled={isBusy} variant="outline" onClick={closeEditor}>
                انصراف
              </Button>
            </div>
          </form>
        </Surface>
      )}

      {isLoading ? (
        <div className="grid gap-3" role="status" aria-label="در حال دریافت تصاویر">
          <Skeleton className="h-44 rounded-df-md" />
          <Skeleton className="h-44 rounded-df-md" />
        </div>
      ) : orderedImages.length === 0 ? (
        <div className="rounded-df-md border border-dashed border-border p-8 text-center">
          <p className="m-0 font-black text-brand-950">تصویری برای این محصول ثبت نشده است</p>
          <p className="mb-0 mt-2 text-sm text-muted">اولین تصویر به‌صورت خودکار تصویر اصلی خواهد بود.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {orderedImages.map((image, index) => {
            const attachedVariant = image.variantId ? variantById.get(image.variantId) : undefined

            return (
              <article
                key={image.id}
                className="grid overflow-hidden rounded-df-md border border-border-soft bg-white shadow-sm sm:grid-cols-[180px_minmax(0,1fr)]"
              >
                <div className="min-h-40 border-b border-border-soft sm:border-b-0 sm:border-l">
                  <ImagePreview key={image.url ?? image.id} altText={image.altText} url={image.url} />
                </div>
                <div className="min-w-0 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {image.isPrimary && <Badge variant="accent">تصویر اصلی</Badge>}
                      <Badge variant="neutral">ترتیب {toPersianDigits(String(index + 1))}</Badge>
                      <span className="text-xs text-muted">
                        {attachedVariant ? `تنوع: ${getVariantName(attachedVariant)}` : 'تصویر عمومی'}
                      </span>
                    </div>
                  </div>
                  <p className="mb-0 mt-3 break-words text-sm font-bold text-brand-950">
                    {image.altText?.trim().length ? image.altText.trim() : 'متن جایگزین ثبت نشده است'}
                  </p>
                  <p className="mb-0 mt-2 truncate text-xs text-muted" dir="ltr" title={image.url ?? undefined}>
                    {image.url?.length ? image.url : 'بدون نشانی'}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2 border-t border-border-soft pt-3">
                    <Button disabled={isBusy} size="sm" variant="outline" onClick={() => openEditor(image)}>
                      ویرایش
                    </Button>
                    {!image.isPrimary && (
                      <Button
                        disabled={isBusy}
                        loading={pendingAction === `primary:${image.id}`}
                        size="sm"
                        variant="ghost"
                        onClick={() => void handleSetPrimary(image)}
                      >
                        انتخاب به‌عنوان اصلی
                      </Button>
                    )}
                    <Button
                      disabled={isBusy || index === 0}
                      loading={pendingAction === `order:${image.id}`}
                      size="sm"
                      variant="ghost"
                      onClick={() => void handleMove(index, -1)}
                    >
                      بالاتر
                    </Button>
                    <Button
                      disabled={isBusy || index === orderedImages.length - 1}
                      loading={pendingAction === `order:${image.id}`}
                      size="sm"
                      variant="ghost"
                      onClick={() => void handleMove(index, 1)}
                    >
                      پایین‌تر
                    </Button>
                    <Button
                      disabled={isBusy}
                      loading={pendingAction === `delete:${image.id}`}
                      size="sm"
                      variant="danger"
                      onClick={() => void handleDelete(image)}
                    >
                      حذف
                    </Button>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}
