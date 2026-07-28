import { useEffect, useState } from 'react'

import { AdminAccountPanel } from './components/auth/AdminAccountPanel'
import { AuthProvider } from './components/auth/AuthProvider'
import { useAuth } from './components/auth/authContext'
import { Button } from './components/ui'
import { AdminAuthPage } from './pages/auth/AdminAuthPage'
import { CategoriesPage } from './pages/categories'
import { TestUIKit } from './pages/TestUIKit'

type AppPage = 'categories' | 'ui-kit'

function getPageFromHash(): AppPage {
  return window.location.hash === '#/ui-kit' ? 'ui-kit' : 'categories'
}

function ProtectedCategories() {
  const { status } = useAuth()

  if (status === 'checking') {
    return (
      <main
        className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4"
        dir="rtl"
      >
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

  if (status === 'anonymous') return <AdminAuthPage />

  return (
    <>
      <AdminAccountPanel />
      <CategoriesPage />
    </>
  )
}

function AppContent() {
  const [page, setPage] = useState<AppPage>(getPageFromHash)
  const { status } = useAuth()
  const isUIKit = page === 'ui-kit'

  useEffect(() => {
    const handleHashChange = () => setPage(getPageFromHash())
    window.addEventListener('hashchange', handleHashChange)

    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  const navigateTo: AppPage = isUIKit ? 'categories' : 'ui-kit'
  const pageLabel = isUIKit
    ? 'راهنمای رابط کاربری'
    : status === 'authenticated'
      ? 'مدیریت دسته‌بندی‌ها'
      : 'ورود مدیر'

  return (
    <div className="min-h-screen">
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
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              window.location.hash = `#/${navigateTo}`
            }}
          >
            {isUIKit ? 'رفتن به دسته‌بندی‌ها' : 'مشاهده UI Kit'}
          </Button>
        </nav>
      </header>

      {isUIKit ? <TestUIKit /> : <ProtectedCategories />}
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
