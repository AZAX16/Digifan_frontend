import { lazy, Suspense, useEffect, useState } from 'react'

import { AuthProvider } from './components/auth/AuthProvider'
import { useAuth } from './components/auth/authContext'
import { Button } from './components/ui'
import { AdminAuthPage } from './pages/auth/AdminAuthPage'

const AdminDashboardPage = lazy(() =>
  import('./pages/admin').then(({ AdminDashboardPage: Page }) => ({ default: Page })),
)
const AdminAccountPage = lazy(() =>
  import('./pages/admin').then(({ AdminAccountPage: Page }) => ({ default: Page })),
)
const AdminSupportPage = lazy(() =>
  import('./pages/admin').then(({ AdminSupportPage: Page }) => ({ default: Page })),
)
const AdminCategoriesPage = lazy(() =>
  import('./pages/admin').then(({ AdminCategoriesPage: Page }) => ({ default: Page })),
)
const AdminModerationPage = lazy(() =>
  import('./pages/admin').then(({ AdminModerationPage: Page }) => ({ default: Page })),
)
const TestUIKit = lazy(() =>
  import('./pages/TestUIKit').then(({ TestUIKit: Page }) => ({ default: Page })),
)

type AppPage = 'dashboard' | 'products' | 'categories' | 'support' | 'account' | 'ui-kit'
type ProtectedAppPage = Exclude<AppPage, 'ui-kit'>
const authenticatedPageLabels: Record<AppPage, string> = {
  dashboard: 'پیشخوان مدیریت',
  products: 'مدیریت محصولات',
  categories: 'مدیریت دسته‌بندی‌ها',
  account: 'تنظیمات پروفایل',
  'ui-kit': 'راهنمای رابط کاربری',
  support: 'مرکز پشتیبانی',
}


function getPageFromHash(): AppPage {
  const route = window.location.hash.split('?')[0]

  if (route === '#/ui-kit') return 'ui-kit'
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
  const { status } = useAuth()

  if (status === 'checking') return <AuthLoadingPage />
  if (status === 'anonymous') return <AdminAuthPage />
  if (page === 'dashboard') return <AdminDashboardPage />
  if (page === 'products') return <AdminModerationPage />
  if (page === 'account') return <AdminAccountPage />
  if (page === 'support') return <AdminSupportPage />

  return <AdminCategoriesPage />
}
function AppContent() {
  const [page, setPage] = useState<AppPage>(getPageFromHash)
  const { status } = useAuth()
  const isUIKit = page === 'ui-kit'
  const usesAdminShell =
    status === 'authenticated' &&
    (page === 'dashboard' || page === 'products' || page === 'categories' || page === 'support' || page === 'account')

  useEffect(() => {
    const handleHashChange = () => setPage(getPageFromHash())
    window.addEventListener('hashchange', handleHashChange)

    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  const pageLabel = isUIKit
    ? 'راهنمای رابط کاربری'
    : status === 'authenticated'
      ? authenticatedPageLabels[page]
      : 'ورود مدیر'

  return (
    <div className="min-h-screen">
      {!usesAdminShell && (
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
              {page !== 'categories' && status === 'authenticated' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    window.location.hash = '#/categories'
                  }}
                >
                  دسته‌بندی‌ها
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
        {isUIKit ? <TestUIKit /> : <ProtectedPage page={page} />}
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
