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
import { useEffect, useState, type FormEvent, type ReactNode } from 'react'

import { getAdminProfile, logoutAdmin, type AdminProfile } from '../../api/auth'
import { ApiError } from '../../api/client'
import { Alert, Button, Input } from '../../components/ui'
import { cn } from '../../utils/cn'

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
}

const navigationItems: NavigationItem[] = [
  { label: 'داشبورد', icon: LayoutDashboard, section: 'dashboard', href: '#/admin' },
  { label: 'مدیریت موجودی', icon: Archive, section: 'products', href: '#/admin/products' },
  { label: 'کنترل قیمت', icon: CircleDollarSign, href: '#/admin/products?focus=price' },
  { label: 'مدیریت محتوا', icon: PanelsTopLeft, section: 'categories', href: '#/categories' },
  { label: 'پشتیبانی', icon: Headphones, section: 'support', href: '#/admin/support' },
  { label: 'تنظیمات پروفایل', icon: Settings, section: 'account', href: '#/admin/account' },
]

function getErrorMessage(error: unknown) {
  return error instanceof ApiError ? error.message : 'خطای پیش‌بینی‌نشده‌ای رخ داد.'
}

function getProfileEmail(profile: AdminProfile | null) {
  const email = profile?.email?.trim()

  return email?.length ? email : 'سطح دسترسی کامل'
}

export function AdminShell({ activeSection, children, search }: AdminShellProps) {
  const [profile, setProfile] = useState<AdminProfile | null>(null)
  const [localSearch, setLocalSearch] = useState('')
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const searchValue = search?.value ?? localSearch

  useEffect(() => {
    let isActive = true

    void getAdminProfile()
      .then((nextProfile) => {
        if (isActive) setProfile(nextProfile)
      })
      .catch((error: unknown) => {
        if (isActive) setFeedback(getErrorMessage(error))
      })

    return () => {
      isActive = false
    }
  }, [])

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
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
        <aside className="sticky top-0 z-40 h-screen w-20 shrink-0 overflow-y-auto border-l border-[#edeef0] bg-[#f3f4f5] px-2 py-8 lg:w-72">
          <div className="mb-8 flex h-10 items-center justify-center gap-2 lg:px-10">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#293647] text-white shadow-md">
              <Wrench aria-hidden="true" size={21} strokeWidth={2.4} />
            </span>
            <span className="hidden whitespace-nowrap text-2xl font-normal tracking-[-0.6px] text-[#293647] lg:inline">
              سامانه ابزار
            </span>
          </div>

          <nav aria-label="ناوبری مدیریت" className="grid gap-2">
            {navigationItems.map((item) => {
              const Icon = item.icon
              const isActive = item.section === activeSection

              return (
                <button
                  key={item.label}
                  type="button"
                  aria-current={isActive ? 'page' : undefined}
                  disabled={item.disabled}
                  title={item.disabled ? 'API این بخش هنوز ارائه نشده است' : item.label}
                  className={cn(
                    'flex h-10 w-full items-center justify-center gap-2 rounded-lg px-4 text-right text-base font-normal transition-colors lg:justify-start',
                    isActive
                      ? 'bg-[#293647] text-white'
                      : 'cursor-pointer text-[#293647] hover:bg-[#e5e8eb]',
                    item.disabled && 'cursor-not-allowed opacity-45 hover:bg-transparent',
                  )}
                  onClick={() => {
                    if (item.href) window.location.hash = item.href
                  }}
                >
                  <Icon aria-hidden="true" className="shrink-0" size={21} strokeWidth={2.2} />
                  <span className="hidden lg:inline">{item.label}</span>
                </button>
              )
            })}
          </nav>

          <button
            type="button"
            className="mt-8 hidden w-full cursor-pointer rounded-lg px-4 py-2 text-right text-xs font-bold text-[#5d5e61] transition-colors hover:bg-[#e5e8eb] lg:block"
            onClick={() => {
              window.location.hash = '#/ui-kit'
            }}
          >
            مشاهده UI Kit
          </button>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 flex min-h-[79px] items-center justify-between gap-4 border-b border-[#e0e3e5] bg-white/80 px-4 backdrop-blur-md sm:px-6">
            <form className="min-w-0 flex-1 lg:max-w-96" role="search" onSubmit={handleSearch}>
              <Input
                aria-label="جستجوی سراسری"
                className="min-h-[42px] rounded-[20px] border-[#8dabd3] bg-[#f2f4f6] px-4 shadow-none placeholder:text-[#9ca3af] hover:border-[#8dabd3] focus:border-[#8dabd3]"
                containerClassName="w-full"
                disabled={search?.disabled}
                leading={<Search aria-hidden="true" size={19} strokeWidth={2.2} />}
                normalizeDigits={false}
                placeholder={search?.placeholder ?? 'جستجوی سراسری…'}
                type="search"
                value={searchValue}
                onChange={(event) => {
                  if (search) search.onChange(event.target.value)
                  else setLocalSearch(event.target.value)
                }}
              />
            </form>

            <div className="flex shrink-0 items-center gap-3" dir="rtl">
              <Button
                aria-label="اعلان‌ها"
                className="size-9 min-h-0 rounded-lg border-0 px-0 shadow-none"
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
                <p className="m-0 text-sm font-bold text-[#191c1e]">مدیر سیستم</p>
                <p className="mb-0 mt-0.5 max-w-40 truncate text-xs font-medium text-[#293647]" dir="ltr">
                  {getProfileEmail(profile)}
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
