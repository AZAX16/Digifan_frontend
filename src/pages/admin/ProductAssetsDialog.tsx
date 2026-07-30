import { useCallback, useEffect, useRef, useState } from 'react'

import type { Product } from '../../api/products'
import { Button, Surface } from '../../components/ui'
import { cn } from '../../utils/cn'
import { ProductImagesPanel } from './ProductImagesPanel'
import { ProductVariantsPanel } from './ProductVariantsPanel'

interface ProductAssetsDialogProps {
  product: Product
  onClose: () => void
  onProductChanged: () => void
}

type AssetsTab = 'variants' | 'images'

function getProductName(product: Product) {
  const name = product.name?.trim()

  return name?.length ? name : 'محصول بدون نام'
}

export function ProductAssetsDialog({
  product,
  onClose,
  onProductChanged,
}: ProductAssetsDialogProps) {
  const [activeTab, setActiveTab] = useState<AssetsTab>('variants')
  const [isBusy, setIsBusy] = useState(false)
  const dialogRef = useRef<HTMLDivElement>(null)
  const isBusyRef = useRef(isBusy)
  const handleBusyChange = useCallback((nextIsBusy: boolean) => setIsBusy(nextIsBusy), [])

  useEffect(() => {
    isBusyRef.current = isBusy
  }, [isBusy])

  useEffect(() => {
    const dialog = dialogRef.current
    const previouslyFocused = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null
    const previousBodyOverflow = document.body.style.overflow
    const focusableSelector = [
      'button:not([disabled])',
      'input:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(',')

    document.body.style.overflow = 'hidden'
    const focusFrame = requestAnimationFrame(() => {
      dialog?.querySelector<HTMLElement>(focusableSelector)?.focus()
      if (!dialog?.contains(document.activeElement)) dialog?.focus()
    })

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (!isBusyRef.current) onClose()
        return
      }
      if (event.key !== 'Tab' || !dialog) return

      const focusableElements = [...dialog.querySelectorAll<HTMLElement>(focusableSelector)]
      if (focusableElements.length === 0) {
        event.preventDefault()
        dialog.focus()
        return
      }

      const firstElement = focusableElements[0]
      const lastElement = focusableElements.at(-1)
      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault()
        lastElement?.focus()
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault()
        firstElement?.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      cancelAnimationFrame(focusFrame)
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousBodyOverflow
      previouslyFocused?.focus()
    }
  }, [onClose])

  const tabClassName = (tab: AssetsTab) => cn(
    'min-h-11 flex-1 border-b-2 px-4 text-sm font-black transition-colors',
    activeTab === tab
      ? 'border-accent-500 bg-accent-500/10 text-brand-950'
      : 'border-transparent bg-white text-muted hover:bg-canvas hover:text-brand-950',
  )

  return (
    <div className="fixed inset-0 z-[90] overflow-y-auto bg-brand-950/50 px-2 py-3 backdrop-blur-sm sm:px-4 sm:py-8" dir="rtl">
      <Surface
        ref={dialogRef}
        tabIndex={-1}
        aria-labelledby="product-assets-title"
        aria-modal="true"
        className="mx-auto flex max-h-[calc(100vh-1.5rem)] max-w-6xl flex-col overflow-hidden sm:max-h-[calc(100vh-4rem)]"
        elevation="raised"
        padding="none"
        role="dialog"
      >
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-border-soft bg-white p-4 sm:p-6">
          <div className="min-w-0">
            <p className="m-0 text-xs font-bold text-accent-500">مدیریت کاتالوگ محصول</p>
            <h2 id="product-assets-title" className="mb-0 mt-1 break-words text-xl font-black text-brand-950 sm:text-2xl">
              تنوع‌ها و تصاویر
            </h2>
            <p className="mb-0 mt-2 break-words text-sm text-muted">{getProductName(product)}</p>
          </div>
          <Button disabled={isBusy} variant="outline" onClick={onClose}>
            بستن
          </Button>
        </header>

        <div className="flex border-b border-border-soft" role="tablist" aria-label="بخش مدیریت محصول">
          <button
            id="product-variants-tab"
            type="button"
            role="tab"
            aria-controls="product-assets-panel"
            aria-selected={activeTab === 'variants'}
            className={tabClassName('variants')}
            disabled={isBusy}
            onClick={() => setActiveTab('variants')}
          >
            تنوع‌های محصول
          </button>
          <button
            id="product-images-tab"
            type="button"
            role="tab"
            aria-controls="product-assets-panel"
            aria-selected={activeTab === 'images'}
            className={tabClassName('images')}
            disabled={isBusy}
            onClick={() => setActiveTab('images')}
          >
            تصاویر محصول
          </button>
        </div>

        <div
          id="product-assets-panel"
          role="tabpanel"
          aria-labelledby={activeTab === 'variants' ? 'product-variants-tab' : 'product-images-tab'}
          className="min-h-0 flex-1 overflow-y-auto bg-canvas/55 p-4 sm:p-6"
        >
          {activeTab === 'variants' ? (
            <ProductVariantsPanel
              productId={product.id}
              onBusyChange={handleBusyChange}
              onProductChanged={onProductChanged}
            />
          ) : (
            <ProductImagesPanel
              productId={product.id}
              productName={getProductName(product)}
              onBusyChange={handleBusyChange}
              onProductChanged={onProductChanged}
            />
          )}
        </div>
      </Surface>
    </div>
  )
}
