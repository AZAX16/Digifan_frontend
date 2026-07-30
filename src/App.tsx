import { lazy, Suspense, useEffect, useState } from 'react'

import { AuthProvider } from './components/auth/AuthProvider'
import { useAuth } from './components/auth/authContext'
import {
  ADMIN_PERMISSIONS,
  hasAnyAdminPermission,
  type AdminPermission,
} from './components/auth/adminPermissions'
import { Button } from './components/ui/Button'
import { AdminAuthPage } from './pages/auth/AdminAuthPage'

const loadAdminDashboardPage = () =>
  import('./pages/admin/AdminDashboardPage').then(({ AdminDashboardPage: Page }) => ({ default: Page }))
const loadAdminAccountPage = () =>
  import('./pages/admin/AdminAccountPage').then(({ AdminAccountPage: Page }) => ({ default: Page }))
const loadAdminSupportPage = () =>
  import('./pages/admin/AdminSupportPage').then(({ AdminSupportPage: Page }) => ({ default: Page }))
const loadAdminCategoriesPage = () =>
  import('./pages/admin/AdminCategoriesPage').then(({ AdminCategoriesPage: Page }) => ({ default: Page }))
const loadAdminModerationPage = () =>
  import('./pages/admin/AdminModerationPage').then(({ AdminModerationPage: Page }) => ({ default: Page }))
const loadAdminAccessDeniedPage = () =>
  import('./pages/admin/AdminAccessDeniedPage').then(({ AdminAccessDeniedPage: Page }) => ({ default: Page }))
const AdminDashboardPage = lazy(loadAdminDashboardPage)
const AdminAccountPage = lazy(loadAdminAccountPage)
const AdminSupportPage = lazy(loadAdminSupportPage)
const AdminCategoriesPage = lazy(loadAdminCategoriesPage)
const AdminModerationPage = lazy(loadAdminModerationPage)
const AdminAccessDeniedPage = lazy(loadAdminAccessDeniedPage)
const TestUIKit = lazy(() =>
  import('./pages/TestUIKit').then(({ TestUIKit: Page }) => ({ default: Page })),
)
const CategoryProductsPage = lazy(() =>
  import('./pages/storefront/CategoryProductsPage').then(({ CategoryProductsPage: Page }) => ({
    default: Page,
  })),
)
const LandingPage = lazy(() =>
  import('./pages/storefront/LandingPage').then(({ LandingPage: Page }) => ({ default: Page })),
)

type AppPage =
  | 'dashboard'
  | 'products'
  | 'categories'
  | 'support'
  | 'account'
  | 'ui-kit'
  | 'landing'
  | 'storefront-water-pumps'
  | 'storefront-accessories'
type PublicAppPage = 'ui-kit' | 'landing' | 'storefront-water-pumps' | 'storefront-accessories'
type ProtectedAppPage = Exclude<AppPage, PublicAppPage>
const authenticatedPageLabels: Record<ProtectedAppPage, string> = {
  dashboard: 'پیشخوان مدیریت',
  products: 'مدیریت محصولات',
  categories: 'مدیریت محتوا',
  account: 'تنظیمات پروفایل',
  support: 'مرکز پشتیبانی',
}
const protectedPagePermissions: Partial<Record<ProtectedAppPage, readonly AdminPermission[]>> = {
  products: [ADMIN_PERMISSIONS.manageProducts],
  categories: [ADMIN_PERMISSIONS.manageCategories, ADMIN_PERMISSIONS.manageBrands],
}

function preloadProtectedPage(page: ProtectedAppPage) {
  if (page === 'dashboard') return loadAdminDashboardPage()
  if (page === 'products') return loadAdminModerationPage()
  if (page === 'categories') return loadAdminCategoriesPage()
  if (page === 'support') return loadAdminSupportPage()

  return loadAdminAccountPage()
}


function getPageFromHash(): AppPage {
  const route = window.location.hash.split('?')[0]

  if (route === '#/ui-kit') return 'ui-kit'
  if (route === '#/landing') return 'landing'
  if (route === '#/category/water-pumps') return 'storefront-water-pumps'
  if (route === '#/category/accessories') return 'storefront-accessories'
  if (route === '#/categories') return 'categories'
  if (route === '#/admin/products') return 'products'
  if (route === '#/admin/account') return 'account'
  if (route === '#/admin/support') return 'support'

  return 'dashboard'
}

function AuthLoadingPage() {
  return (
    <main className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4" dir="rtl">
      <div className="text-center" role="status">
        <span
          aria-hidden="true"
          className="mx-auto block size-8 animate-spin rounded-full border-4 border-brand-950/20 border-l-brand-950"
        />
        <p className="mb-0 mt-3 text-sm font-bold text-muted">در حال بررسی نشست مدیر…</p>
      </div>
    </main>
  )
}

function ProtectedPage({ page }: { page: ProtectedAppPage }) {
  const { status, profile, profileStatus } = useAuth()
  const requiredPermission = protectedPagePermissions[page]

  if (status === 'checking') return <AuthLoadingPage />
  if (status === 'anonymous') return <AdminAuthPage />
  if (requiredPermission && (profileStatus === 'idle' || profileStatus === 'loading')) {
    return <AuthLoadingPage />
  }
  if (requiredPermission && profileStatus === 'error') {
    return (
      <AdminAccessDeniedPage
        activeSection={page}
        profileUnavailable
        sectionTitle={authenticatedPageLabels[page]}
      />
    )
  }
  if (requiredPermission && !hasAnyAdminPermission(profile, requiredPermission)) {
    return (
      <AdminAccessDeniedPage
        activeSection={page}
        sectionTitle={authenticatedPageLabels[page]}
      />
    )
  }
  if (page === 'dashboard') return <AdminDashboardPage />
  if (page === 'products') return <AdminModerationPage />
  if (page === 'account') return <AdminAccountPage />
  if (page === 'support') return <AdminSupportPage />

  return <AdminCategoriesPage />
}
function AppContent() {
  const [page, setPage] = useState<AppPage>(getPageFromHash)
  const { status, profile } = useAuth()
  const isUIKit = page === 'ui-kit'
  const isLanding = page === 'landing'
  const isStorefront =
    page === 'storefront-water-pumps' || page === 'storefront-accessories'
  const isStandalonePublicPage = isLanding || isStorefront
  const isProtectedPage = !isUIKit && !isStandalonePublicPage
  const usesAdminShell =
    status === 'authenticated' &&
    (page === 'dashboard' || page === 'products' || page === 'categories' || page === 'support' || page === 'account')

  useEffect(() => {
    const handleHashChange = () => setPage(getPageFromHash())
    window.addEventListener('hashchange', handleHashChange)

    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  const pageLabel =
    isLanding
      ? 'صفحه اصلی فنینو'
      : page === 'storefront-water-pumps'
      ? 'پمپ آب'
      : page === 'storefront-accessories'
        ? 'تجهیزات جانبی'
        : isUIKit
          ? 'راهنمای رابط کاربری'
          : status === 'authenticated'
            ? authenticatedPageLabels[page]
            : 'ورود مدیر'

  useEffect(() => {
    document.title = `${pageLabel} | ${isLanding ? 'Fanino' : 'DigiFan'}`
  }, [isLanding, pageLabel])

  useEffect(() => {
    if (!isProtectedPage) return

    const requiredPermission = protectedPagePermissions[page]
    const canPreload = requiredPermission
      ? status === 'authenticated' && hasAnyAdminPermission(profile, requiredPermission)
      : status !== 'anonymous'

    if (canPreload) void preloadProtectedPage(page)
  }, [isProtectedPage, page, profile, status])

  return (
    <div className="min-h-screen">
      {!usesAdminShell && !isStandalonePublicPage && (
        <header
          className="sticky top-0 z-[60] border-b border-border-soft bg-white/95 shadow-sm backdrop-blur"
          dir="rtl"
        >
          <nav
            aria-label="جابجایی بین صفحات"
            className="mx-auto flex min-h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6"
          >
            <div className="flex items-center gap-2">
              <span className="font-black text-brand-950">DigiFan</span>
              <span className="text-xs text-muted">{pageLabel}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {page !== 'dashboard' && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    window.location.hash = '#/admin'
                  }}
                >
                  پنل مدیریت
                </Button>
              )}
              {page !== 'categories' &&
                status === 'authenticated' &&
                hasAnyAdminPermission(profile, [
                  ADMIN_PERMISSIONS.manageCategories,
                  ADMIN_PERMISSIONS.manageBrands,
                ]) && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    window.location.hash = '#/categories'
                  }}
                >
                  مدیریت محتوا
                </Button>
                )}
              {!isUIKit && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    window.location.hash = '#/ui-kit'
                  }}
                >
                  UI Kit
                </Button>
              )}
            </div>
          </nav>
        </header>
      )}

      <Suspense fallback={<AuthLoadingPage />}>
        {isUIKit ? (
          <TestUIKit />
        ) : isLanding ? (
          <LandingPage />
        ) : page === 'storefront-water-pumps' ? (
          <CategoryProductsPage variant="water-pumps" />
        ) : page === 'storefront-accessories' ? (
          <CategoryProductsPage variant="accessories" />
        ) : (
          <ProtectedPage page={page} />
        )}
      </Suspense>
    </div>
  )
}

export function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
