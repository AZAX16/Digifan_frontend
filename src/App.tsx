import { useEffect, useState } from 'react'

import { Button } from './components/ui'
import { CategoriesPage } from './pages/categories'
import { TestUIKit } from './pages/TestUIKit'

type AppPage = 'categories' | 'ui-kit'

function getPageFromHash(): AppPage {
  return window.location.hash === '#/ui-kit' ? 'ui-kit' : 'categories'
}

export function App() {
  const [page, setPage] = useState<AppPage>(getPageFromHash)
  const isUIKit = page === 'ui-kit'

  useEffect(() => {
    const handleHashChange = () => setPage(getPageFromHash())
    window.addEventListener('hashchange', handleHashChange)

    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  const navigateTo: AppPage = isUIKit ? 'categories' : 'ui-kit'

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
            <span className="text-xs text-muted">
              {isUIKit ? 'راهنمای رابط کاربری' : 'مدیریت دسته‌بندی‌ها'}
            </span>
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

      {isUIKit ? <TestUIKit /> : <CategoriesPage />}
    </div>
  )
}
