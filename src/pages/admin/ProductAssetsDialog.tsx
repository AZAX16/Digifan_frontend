import { useCallback, useRef, useState } from 'react'

import type { Product } from '../../api/products'
import { Button, Surface } from '../../components/ui'
import { useDialogLifecycle } from '../../hooks/useDialogLifecycle'
import { ProductImagesPanel } from './ProductImagesPanel'

interface ProductAssetsDialogProps {
  product: Product
  onClose: () => void
  onProductChanged: () => void
}

function getProductName(product: Product) {
  const name = product.name?.trim()

  return name?.length ? name : 'محصول بدون نام'
}

export function ProductAssetsDialog({
  product,
  onClose,
  onProductChanged,
}: ProductAssetsDialogProps) {
  const [isBusy, setIsBusy] = useState(false)
  const dialogRef = useRef<HTMLDivElement>(null)
  const handleBusyChange = useCallback((nextIsBusy: boolean) => setIsBusy(nextIsBusy), [])
  useDialogLifecycle(dialogRef, onClose, { closeDisabled: isBusy })

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
              تصاویر محصول
            </h2>
            <p className="mb-0 mt-2 break-words text-sm text-muted">{getProductName(product)}</p>
          </div>
          <Button disabled={isBusy} variant="outline" onClick={onClose}>
            بستن
          </Button>
        </header>

        <div
          id="product-assets-panel"
          className="min-h-0 flex-1 overflow-y-auto bg-canvas/55 p-4 sm:p-6"
        >
          <ProductImagesPanel
            productId={product.id}
            productName={getProductName(product)}
            onBusyChange={handleBusyChange}
            onProductChanged={onProductChanged}
          />
        </div>
      </Surface>
    </div>
  )
}
