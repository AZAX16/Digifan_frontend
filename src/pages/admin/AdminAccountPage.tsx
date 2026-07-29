import { AdminAccountPanel } from '../../components/auth/AdminAccountPanel'
import { AdminShell } from './AdminShell'

export function AdminAccountPage() {
  return (
    <AdminShell activeSection="account">
      <main className="px-4 pb-10 pt-4 sm:px-6 lg:px-10">
        <div className="mb-6">
          <h1 className="m-0 text-2xl font-bold text-[#191c1d]">تنظیمات پروفایل</h1>
          <p className="mb-0 mt-2 text-sm text-[#5d5e61]">مدیریت شماره موبایل، رمز عبور و نشست مدیر سیستم</p>
        </div>
        <div className="[&>section]:max-w-none [&>section]:px-0 [&>section]:pt-0">
          <AdminAccountPanel />
        </div>
      </main>
    </AdminShell>
  )
}
