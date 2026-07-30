import { useState } from 'react'

import { useAuth } from '../../components/auth/authContext'
import { ADMIN_PERMISSIONS, hasAdminPermission } from '../../components/auth/adminPermissions'
import { cn } from '../../utils/cn'
import { CategoriesPage } from '../categories'
import { AdminShell } from './AdminShell'
import { BrandsManager } from './BrandsManager'

export function AdminCategoriesPage() {
  const { profile } = useAuth()
  const [requestedView, setRequestedView] = useState<'categories' | 'brands'>('categories')
  const canManageCategories = hasAdminPermission(profile, ADMIN_PERMISSIONS.manageCategories)
  const canManageBrands = hasAdminPermission(profile, ADMIN_PERMISSIONS.manageBrands)
  const activeView = requestedView === 'categories' && canManageCategories
    ? 'categories'
    : requestedView === 'brands' && canManageBrands
      ? 'brands'
      : canManageCategories
        ? 'categories'
        : 'brands'

  return (
    <AdminShell activeSection="categories">
      <div className="px-4 pt-5 sm:px-6 lg:px-10">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[#dfe2e5] bg-white p-3">
          <div>
            <h1 className="m-0 text-xl font-black text-brand-950">مدیریت محتوا</h1>
            <p className="mb-0 mt-1 text-xs text-muted">دسته‌بندی‌ها و برندهای کاتالوگ</p>
          </div>
          <div className="flex gap-2" role="tablist" aria-label="بخش مدیریت محتوا">
            {canManageCategories && (
              <button
                type="button"
                role="tab"
                aria-selected={activeView === 'categories'}
                className={cn(
                  'cursor-pointer rounded-lg border px-4 py-2 text-sm font-bold transition-colors',
                  activeView === 'categories'
                    ? 'border-accent-500 bg-accent-500 text-white'
                    : 'border-border bg-white text-brand-950 hover:bg-orange-50',
                )}
                onClick={() => setRequestedView('categories')}
              >
                دسته‌بندی‌ها
              </button>
            )}
            {canManageBrands && (
              <button
                type="button"
                role="tab"
                aria-selected={activeView === 'brands'}
                className={cn(
                  'cursor-pointer rounded-lg border px-4 py-2 text-sm font-bold transition-colors',
                  activeView === 'brands'
                    ? 'border-accent-500 bg-accent-500 text-white'
                    : 'border-border bg-white text-brand-950 hover:bg-orange-50',
                )}
                onClick={() => setRequestedView('brands')}
              >
                برندها
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="[&>main]:min-h-0 [&>main]:max-w-none [&>main]:px-4 [&>main]:py-6 sm:[&>main]:px-6 lg:[&>main]:px-10 lg:[&>main]:py-10">
        {activeView === 'categories' ? <CategoriesPage /> : <BrandsManager />}
      </div>
    </AdminShell>
  )
}
