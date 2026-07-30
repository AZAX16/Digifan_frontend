import { LockKeyhole } from 'lucide-react'

import { Button, Surface } from '../../components/ui'
import { AdminShell, type AdminSection } from './AdminShell'

interface AdminAccessDeniedPageProps {
  activeSection: AdminSection
  sectionTitle: string
  profileUnavailable?: boolean
}

export function AdminAccessDeniedPage({
  activeSection,
  sectionTitle,
  profileUnavailable = false,
}: AdminAccessDeniedPageProps) {
  return (
    <AdminShell activeSection={activeSection}>
      <main className="flex min-h-[calc(100vh-5rem)] items-center justify-center p-4 sm:p-6" dir="rtl">
        <Surface
          className="w-full max-w-xl !rounded-2xl !border-[#293647] !bg-white !p-8 text-center sm:!p-10"
          elevation="flat"
          padding="none"
        >
          <span className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-[#e9ecef] text-[#293647]">
            <LockKeyhole aria-hidden="true" size={30} strokeWidth={2.1} />
          </span>
          <h1 className="mb-0 mt-5 text-2xl font-black text-[#191c1d]">
            {profileUnavailable ? 'سطح دسترسی دریافت نشد' : 'دسترسی به این بخش محدود است'}
          </h1>
          <p className="mx-auto mb-0 mt-3 max-w-md text-sm leading-7 text-[#5d5e61]">
            {profileUnavailable
              ? 'اطلاعات سطح دسترسی حساب از سرور دریافت نشد. دوباره وارد شوید یا کمی بعد تلاش کنید.'
              : `سطح دسترسی حساب شما اجازه استفاده از بخش «${sectionTitle}» را نمی‌دهد.`}
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Button
              onClick={() => {
                window.location.hash = '#/admin'
              }}
            >
              بازگشت به داشبورد
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                window.location.hash = '#/admin/account'
              }}
            >
              مشاهده حساب کاربری
            </Button>
          </div>
        </Surface>
      </main>
    </AdminShell>
  )
}
