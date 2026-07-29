import { CategoriesPage } from '../categories'
import { AdminShell } from './AdminShell'

export function AdminCategoriesPage() {
  return (
    <AdminShell activeSection="categories">
      <div className="[&>main]:min-h-0 [&>main]:max-w-none [&>main]:px-4 [&>main]:py-6 sm:[&>main]:px-6 lg:[&>main]:px-10 lg:[&>main]:py-10">
        <CategoriesPage />
      </div>
    </AdminShell>
  )
}
