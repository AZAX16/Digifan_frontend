import {
  Archive,
  Bell,
  Boxes,
  CircleDollarSign,
  Headphones,
  LayoutDashboard,
  LogOut,
  PanelsTopLeft,
  Search,
  Settings,
  UserRound,
  Wrench,
  type LucideIcon,
} from 'lucide-react'
import { useState, type FormEvent, type ReactNode } from 'react'

import { logoutAdmin } from '../../api/auth'
import { ApiError } from '../../api/client'
import { useAuth } from '../../components/auth/authContext'
import {
  ADMIN_PERMISSIONS,
  getAdminRoleLabel,
  hasAdminPermission,
  type AdminPermission,
} from '../../components/auth/adminPermissions'
import { Alert, Button, Input } from '../../components/ui'
import { cn } from '../../utils/cn'
import { formatPhoneNumber } from '../../utils/phoneNumber'

export type AdminSection = 'dashboard' | 'products' | 'categories' | 'support' | 'account'

interface AdminSearchProps {
  value: string
  disabled?: boolean
  placeholder?: string
  onChange: (value: string) => void
  onSubmit: (value: string) => void
}

interface AdminShellProps {
  activeSection: AdminSection
  children: ReactNode
  search?: AdminSearchProps
}

interface NavigationItem {
  label: string
  icon: LucideIcon
  section?: AdminSection
  href?: string
  disabled?: boolean
  permission?: AdminPermission
}

const navigationItems: NavigationItem[] = [
  { label: 'داشبورد', icon: LayoutDashboard, section: 'dashboard', href: '#/admin' },
  {
    label: 'مدیریت موجودی',
    icon: Archive,
    section: 'products',
    href: '#/admin/products',
    permission: ADMIN_PERMISSIONS.manageProducts,
  },
  {
    label: 'کنترل قیمت',
    icon: CircleDollarSign,
    href: '#/admin/products',
    permission: ADMIN_PERMISSIONS.manageProducts,
  },
  {
    label: 'مدیریت محتوا',
    icon: PanelsTopLeft,
    section: 'categories',
    href: '#/categories',
    permission: ADMIN_PERMISSIONS.manageCategories,
  },
  { label: 'پشتیبانی', icon: Headphones, section: 'support', href: '#/admin/support' },
  { label: 'تنظیمات پروفایل', icon: Settings, section: 'account', href: '#/admin/account' },
]
const mobileNavigationItems: NavigationItem[] = [
  ...navigationItems.filter((item) => item.section !== undefined),
  { label: 'UI Kit', icon: Wrench, href: '#/ui-kit' },
]

function getErrorMessage(error: unknown) {
  return error instanceof ApiError ? error.message : 'خطای پیش‌بینی‌نشده‌ای رخ داد.'
}

function getProfilePhoneNumber(phoneNumber: string | null | undefined) {
  const formattedPhoneNumber = formatPhoneNumber(phoneNumber)

  return formattedPhoneNumber ?? 'شماره ثبت نشده'
}

export function AdminShell({ activeSection, children, search }: AdminShellProps) {
  const { profile } = useAuth()
  const [localSearch, setLocalSearch] = useState('')
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const searchValue = search?.value ?? localSearch
  const canManageProducts = hasAdminPermission(profile, ADMIN_PERMISSIONS.manageProducts)

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!canManageProducts) return

    const normalizedSearch = searchValue.trim()

    if (search) {
      search.onSubmit(normalizedSearch)
      return
    }

    window.location.hash = normalizedSearch
      ? `#/admin/products?search=${encodeURIComponent(normalizedSearch)}`
      : '#/admin/products'
  }

  const handleLogout = async () => {
    setIsLoggingOut(true)
    setFeedback(null)

    try {
      await logoutAdmin()
    } catch (error) {
      setFeedback(getErrorMessage(error))
      setIsLoggingOut(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa]" dir="rtl">
      <div className="mx-auto flex min-h-screen max-w-[1280px] bg-[#f8f9fa] shadow-[0_0_38px_rgba(41,54,71,0.08)]">
        <aside className="sticky top-0 z-40 hidden h-screen w-20 shrink-0 overflow-y-auto border-l border-[#edeef0] bg-[#f3f4f5] px-2 py-8 sm:block xl:w-72">
          <div className="mb-8 flex h-10 items-center justify-center gap-2 xl:px-10">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#293647] text-white shadow-md">
              <Wrench aria-hidden="true" size={21} strokeWidth={2.4} />
            </span>
            <span className="hidden whitespace-nowrap text-2xl font-normal tracking-[-0.6px] text-[#293647] xl:inline">
              سامانه ابزار
            </span>
          </div>

          <nav aria-label="ناوبری مدیریت" className="grid gap-2">
            {navigationItems.map((item) => {
              const Icon = item.icon
              const isActive = item.section === activeSection
              const isDisabled = item.disabled === true || (
                item.permission !== undefined && !hasAdminPermission(profile, item.permission)
              )

              return (
                <button
                  key={item.label}
                  type="button"
                  aria-current={isActive ? 'page' : undefined}
                  aria-label={item.label}
                  disabled={isDisabled}
                  title={isDisabled ? 'سطح دسترسی حساب شما برای این بخش کافی نیست' : item.label}
                  className={cn(
                    'flex h-10 w-full items-center justify-center gap-2 rounded-lg px-4 text-right text-base font-normal transition-colors xl:justify-start',
                    isActive
                      ? 'bg-[#293647] text-white'
                      : 'cursor-pointer text-[#293647] hover:bg-[#e5e8eb]',
                    isDisabled && 'cursor-not-allowed opacity-45 hover:bg-transparent',
                  )}
                  onClick={() => {
                    if (!isDisabled && item.href) window.location.hash = item.href
                  }}
                >
                  <Icon aria-hidden="true" className="shrink-0" size={21} strokeWidth={2.2} />
                  <span className="hidden xl:inline">{item.label}</span>
                </button>
              )
            })}
          </nav>

          <button
            type="button"
            aria-label="مشاهده UI Kit"
            className="mt-8 flex w-full cursor-pointer items-center justify-center rounded-lg px-2 py-2 text-xs font-bold text-[#5d5e61] transition-colors hover:bg-[#e5e8eb] xl:justify-start xl:px-4"
            onClick={() => {
              window.location.hash = '#/ui-kit'
            }}
          >
            <span aria-hidden="true" className="xl:hidden">UI</span>
            <span className="hidden xl:inline">مشاهده UI Kit</span>
          </button>
        </aside>

        <div className="min-w-0 flex-1 pb-20 sm:pb-0">
          <header className="sticky top-0 z-30 flex min-h-[68px] items-center justify-between gap-2 border-b border-[#e0e3e5] bg-white/80 px-3 backdrop-blur-md sm:min-h-[79px] sm:gap-4 sm:px-6">
            <form className="min-w-0 flex-1 lg:max-w-96" role="search" onSubmit={handleSearch}>
              <Input
                aria-label="جستجوی سراسری"
                className="min-h-[42px] rounded-[20px] border-[#8dabd3] bg-[#f2f4f6] px-4 shadow-none placeholder:text-[#667085] hover:border-[#8dabd3] focus:border-[#8dabd3] focus-visible:ring-2 focus-visible:ring-[#8dabd3]/45"
                containerClassName="w-full"
                disabled={search?.disabled === true || !canManageProducts}
                leading={<Search aria-hidden="true" size={19} strokeWidth={2.2} />}
                normalizeDigits={false}
                placeholder={
                  canManageProducts
                    ? search?.placeholder ?? 'جستجوی سراسری…'
                    : 'جستجوی محصولات برای این سطح دسترسی غیرفعال است'
                }
                type="search"
                value={searchValue}
                onChange={(event) => {
                  if (search) search.onChange(event.target.value)
                  else setLocalSearch(event.target.value)
                }}
              />
            </form>

            <div className="flex shrink-0 items-center gap-1.5 sm:gap-3" dir="rtl">
              <Button
                aria-label="اعلان‌ها"
                className="hidden size-9 min-h-0 rounded-lg border-0 px-0 shadow-none sm:inline-flex"
                disabled
                size="sm"
                title="API اعلان‌ها هنوز ارائه نشده است"
                variant="ghost"
              >
                <Bell aria-hidden="true" size={21} strokeWidth={2.2} />
              </Button>
              <span aria-hidden="true" className="hidden h-10 w-px bg-[#e0e3e5] sm:block" />
              <span className="flex size-10 items-center justify-center rounded-xl bg-[#293647] text-white">
                <UserRound aria-hidden="true" size={19} strokeWidth={2.2} />
              </span>
              <div className="hidden min-w-0 text-right sm:block">
                <p className="m-0 text-sm font-bold text-[#191c1e]">
                  {getAdminRoleLabel(profile?.role)}
                </p>
                <p className="mb-0 mt-0.5 max-w-40 truncate text-xs font-medium text-[#293647]" dir="ltr">
                  {getProfilePhoneNumber(profile?.phoneNumber)}
                </p>
              </div>
              <Button
                aria-label="خروج از حساب"
                className="size-8 min-h-0 rounded-lg px-0 shadow-none"
                loading={isLoggingOut}
                size="sm"
                title="خروج"
                variant="ghost"
                onClick={() => void handleLogout()}
              >
                <LogOut aria-hidden="true" size={17} strokeWidth={2.2} />
              </Button>
            </div>
          </header>

          {feedback && (
            <Alert className="mx-4 mt-4 sm:mx-6" live title={feedback} variant="danger" />
          )}
          {children}
        </div>

        <nav
          aria-label="ناوبری مدیریت موبایل"
          className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-6 border-t border-[#dfe2e5] bg-white/95 px-1 pb-2 pt-1 shadow-[0_-6px_20px_rgba(41,54,71,0.1)] backdrop-blur-md sm:hidden"
        >
          {mobileNavigationItems.map((item) => {
            const Icon = item.icon
            const isActive = item.section === activeSection
            const isDisabled = item.disabled === true || (
              item.permission !== undefined && !hasAdminPermission(profile, item.permission)
            )

            return (
              <button
                key={item.label}
                type="button"
                aria-current={isActive ? 'page' : undefined}
                aria-label={item.label}
                disabled={isDisabled}
                title={isDisabled ? 'سطح دسترسی حساب شما برای این بخش کافی نیست' : item.label}
                className={cn(
                  'flex min-w-0 cursor-pointer flex-col items-center gap-1 rounded-lg px-1 py-1.5 text-[10px] font-bold transition-colors',
                  isActive ? 'bg-[#293647] text-white' : 'text-[#293647] hover:bg-[#e5e8eb]',
                  isDisabled && 'cursor-not-allowed opacity-40 hover:bg-transparent',
                )}
                onClick={() => {
                  if (!isDisabled && item.href) window.location.hash = item.href
                }}
              >
                <Icon aria-hidden="true" size={19} strokeWidth={2.2} />
                <span className="w-full truncate text-center">{item.label}</span>
              </button>
            )
          })}
        </nav>
      </div>
    </div>
  )
}

export function AdminContentPlaceholder({ title }: { title: string }) {
  return (
    <main className="p-4 sm:p-6 lg:p-10">
      <div className="rounded-xl border border-dashed border-[#8b9198] bg-white p-10 text-center">
        <Boxes aria-hidden="true" className="mx-auto text-[#293647]" size={32} />
        <h1 className="mb-0 mt-4 text-xl font-bold text-[#191c1d]">{title}</h1>
        <p className="mb-0 mt-2 text-sm text-[#5d5e61]">API این بخش هنوز در قرارداد backend موجود نیست.</p>
      </div>
    </main>
  )
}
