import { lazy, Suspense, useState } from 'react'

import { useAuth } from '../../components/auth/authContext'
import { ADMIN_PERMISSIONS, hasAdminPermission } from '../../components/auth/adminPermissions'
import { Surface } from '../../components/ui'
import { cn } from '../../utils/cn'
import { CategoriesPage } from '../categories'
import { AdminShell } from './AdminShell'
import { BrandsManager } from './BrandsManager'

const ProductImportPanel = lazy(() =>
  import('./ProductImportPanel').then((module) => ({ default: module.ProductImportPanel })),
)

type ContentView = 'categories' | 'brands' | 'product-import'

function getInitialContentView(): ContentView {
  const queryString = window.location.hash.split('?')[1] ?? ''
  const requestedView = new URLSearchParams(queryString).get('view')

  if (requestedView === 'brands' || requestedView === 'product-import') return requestedView

  return 'categories'
}

function updateContentViewHash(view: ContentView) {
  const nextHash = view === 'product-import'
    ? '#/categories?view=product-import&mode=excel'
    : `#/categories?view=${view}`

  window.history.replaceState(null, '', nextHash)
}

export function AdminCategoriesPage() {
  const { profile } = useAuth()
  const [requestedView, setRequestedView] = useState<ContentView>(getInitialContentView)
  const canManageCategories = hasAdminPermission(profile, ADMIN_PERMISSIONS.manageCategories)
  const canManageBrands = hasAdminPermission(profile, ADMIN_PERMISSIONS.manageBrands)
  const canManageProducts = hasAdminPermission(profile, ADMIN_PERMISSIONS.manageProducts)
  const availableViews = [
    ...(canManageCategories ? ['categories' as const] : []),
    ...(canManageBrands ? ['brands' as const] : []),
    ...(canManageProducts ? ['product-import' as const] : []),
  ]
  const activeView = availableViews.includes(requestedView)
    ? requestedView
    : availableViews[0] ?? 'categories'
  const tabs: { view: ContentView; label: string; visible: boolean }[] = [
    { view: 'categories', label: 'دسته‌بندی‌ها', visible: canManageCategories },
    { view: 'brands', label: 'برندها', visible: canManageBrands },
    { view: 'product-import', label: 'افزودن محصول', visible: canManageProducts },
  ]

  return (
    <AdminShell activeSection="categories">
      <div className="px-4 pt-5 sm:px-6 lg:px-10">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border-2 border-[#dfe2e5] bg-white p-4">
          <div>
            <h1 className="m-0 text-xl font-black text-brand-950">مدیریت محتوا</h1>
            <p className="mb-0 mt-1 text-xs text-muted">دسته‌بندی‌ها، برندها و ورود اطلاعات محصولات</p>
          </div>
          <div className="flex flex-wrap gap-2 pt-1" role="tablist" aria-label="بخش مدیریت محتوا">
            {tabs.filter((tab) => tab.visible).map((tab) => (
              <button
                key={tab.view}
                type="button"
                role="tab"
                aria-selected={activeView === tab.view}
                className={cn(
                  'cursor-pointer rounded-lg border-2 px-4 py-2 text-sm font-bold transition-colors',
                  activeView === tab.view
                    ? 'border-accent-500 bg-accent-500 text-white'
                    : 'border-border bg-white text-brand-950 hover:bg-orange-50',
                )}
                onClick={() => {
                  setRequestedView(tab.view)
                  updateContentViewHash(tab.view)
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {activeView === 'product-import' ? (
        <Suspense
          fallback={(
            <main className="px-4 py-6 sm:px-6 lg:px-10 lg:py-10" dir="rtl">
              <Surface elevation="flat" padding="lg">
                <div className="flex items-center gap-3" role="status">
                  <span className="size-6 animate-spin rounded-full border-3 border-brand-950/20 border-l-brand-950" />
                  <p className="m-0 text-sm font-bold text-muted">در حال آماده‌سازی افزودن محصول…</p>
                </div>
              </Surface>
            </main>
          )}
        >
          <ProductImportPanel />
        </Suspense>
      ) : (
        <div className="[&>main]:min-h-0 [&>main]:max-w-none [&>main]:px-4 [&>main]:py-6 sm:[&>main]:px-6 lg:[&>main]:px-10 lg:[&>main]:py-10">
          {activeView === 'categories' ? <CategoriesPage /> : <BrandsManager />}
        </div>
      )}
    </AdminShell>
  )
}