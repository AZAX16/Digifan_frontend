import type { FormEvent } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  CircleUserRound,
  Factory,
  Gift,
  Headphones,
  ImageIcon,
  LogOut,
  Mail,
  MapPin,
  Medal,
  Menu,
  Phone,
  Search,
  Share2,
  ShieldCheck,
  ShoppingCart,
  Truck,
  X,
} from 'lucide-react'

import {
  loginCustomer,
  logoutCustomer,
  registerCustomer,
  restoreCustomerSession,
  type CustomerProfile,
} from '../../api/customerAuth'
import {
  getStorefrontProducts,
  type StorefrontProductListItem,
} from '../../api/storefrontProducts'
import categoryAccessoriesImage from '../../assets/storefront/category-accessories.svg'
import categoryFanImage from '../../assets/storefront/category-fan.svg'
import categoryMotorImage from '../../assets/storefront/category-motor.svg'
import categoryPumpImage from '../../assets/storefront/category-pump.svg'
import faninoHeroImage from '../../assets/storefront/fanino-industrial-hero.webp'
import waterPumpImage from '../../assets/storefront/water-pump.webp'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { DiscountProductCard } from '../../components/ui/DiscountProductCard'
import { Input } from '../../components/ui/Field'
import { ProductCard } from '../../components/ui/ProductCard'
import { cn } from '../../utils/cn'
import { toPersianDigits } from '../../utils/persianDigits'
import { isValidPhoneNumber, normalizePhoneNumber } from '../../utils/phoneNumber'

type AuthMode = 'login' | 'register'
type ProductLoadStatus = 'loading' | 'ready' | 'error'

interface LandingProduct {
  id: string
  name: string
  description: string
  price: number
  currency: string
  imageSrc?: string
}

interface LocalCartItem extends LandingProduct {
  quantity: number
}

const demoProducts: LandingProduct[] = [
  {
    id: 'demo-industrial-pump',
    name: 'پمپ صنعتی فشار قوی',
    description: 'مناسب خطوط انتقال و تأسیسات',
    price: 48_600_000,
    currency: 'تومان',
    imageSrc: waterPumpImage,
  },
  {
    id: 'demo-electric-motor',
    name: 'الکتروموتور سه فاز',
    description: 'راندمان بالا و کارکرد پیوسته',
    price: 34_500_000,
    currency: 'تومان',
  },
  {
    id: 'demo-ventilation',
    name: 'هواکش صنعتی',
    description: 'تهویه مطبوع محیط‌های صنعتی',
    price: 16_900_000,
    currency: 'تومان',
  },
  {
    id: 'demo-accessories',
    name: 'تجهیزات جانبی پمپ',
    description: 'قطعات نصب و نگهداری',
    price: 8_750_000,
    currency: 'تومان',
  },
]

const categoryCards = [
  {
    title: 'پمپ‌های صنعتی',
    description: 'انواع پمپ‌های سانتریفیوژ و صنعتی',
    imageSrc: categoryPumpImage,
    imageAlt: 'نماد پمپ صنعتی',
  },
  {
    title: 'الکتروموتورها',
    description: 'AC، DC، سروو و گیربکس‌دار',
    imageSrc: categoryMotorImage,
    imageAlt: 'نماد الکتروموتور',
  },
  {
    title: 'فن و تهویه',
    description: 'فن‌های صنعتی و تهویه مطبوع',
    imageSrc: categoryFanImage,
    imageAlt: 'نماد فن صنعتی',
  },
  {
    title: 'تجهیزات جانبی',
    description: 'قطعات یدکی و ملزومات',
    imageSrc: categoryAccessoriesImage,
    imageAlt: 'نماد چرخ‌دنده تجهیزات جانبی',
  },
]

const mockBrands = ['EBARA', 'VORTICE', 'پمپیران', 'Wilo', 'Volt', 'LEO', 'WAT', 'Calmo']

const services = [
  { title: 'ارسال سریع', text: 'به سراسر کشور', icon: Truck },
  { title: 'ضمانت اصالت کالا', text: 'کلیه محصولات', icon: ShieldCheck },
  { title: 'گارانتی بازگشت وجه', text: 'تا ۳۰ روز', icon: Medal },
  { title: 'مشاوره تخصصی', text: 'پیشنهاد بهترین راهکار', icon: Headphones },
]

function DataSourcePill({ source }: { source: 'api' | 'mock' }) {
  return (
    <span
      className={cn(
        'inline-flex min-h-6 items-center rounded-full px-2.5 text-[11px] font-black ring-1',
        source === 'api'
          ? 'bg-success-600/10 text-success-600 ring-success-600/20'
          : 'bg-accent-500/10 text-[#b75b08] ring-accent-500/25',
      )}
    >
      {source === 'api' ? 'داده زنده API' : 'بخش نمایشی'}
    </span>
  )
}

function formatCurrency(currency: string | null | undefined) {
  const normalized = currency?.trim().toLowerCase()
  if (!normalized || normalized === 'toman' || normalized === 'tomans' || normalized === 'irt') {
    return 'تومان'
  }
  if (normalized === 'rial' || normalized === 'rials' || normalized === 'irr') return 'ریال'
  return currency ?? 'تومان'
}

function formatPrice(value: number, currency = 'تومان') {
  return `${new Intl.NumberFormat('fa-IR').format(value)} ${formatCurrency(currency)}`
}

function mapApiProduct(product: StorefrontProductListItem): LandingProduct {
  const name = product.name?.trim()
  const description = product.summary?.trim()
  const imageSrc = product.primaryImageUrl?.trim()

  return {
    id: product.id,
    name: name?.length ? name : 'محصول بدون نام',
    description: description?.length ? description : 'اطلاعات تکمیلی ثبت نشده است',
    price: product.price,
    currency: formatCurrency(product.currency),
    imageSrc: imageSrc?.length ? imageSrc : undefined,
  }
}

function CustomerAuthDialog({
  open,
  onClose,
  onAuthenticated,
}: {
  open: boolean
  onClose: () => void
  onAuthenticated: (profile: CustomerProfile) => void
}) {
  const [mode, setMode] = useState<AuthMode>('login')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose, open])

  if (!open) return null

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    const normalizedPhone = normalizePhoneNumber(phoneNumber)

    if (!isValidPhoneNumber(normalizedPhone)) {
      setError('شماره موبایل معتبر وارد کنید.')
      return
    }
    if (!password.trim()) {
      setError('رمز عبور را وارد کنید.')
      return
    }
    if (mode === 'register' && password !== confirmPassword) {
      setError('تکرار رمز عبور با رمز عبور یکسان نیست.')
      return
    }

    setSubmitting(true)
    try {
      const profile = await (mode === 'login'
        ? loginCustomer(normalizedPhone, password)
        : registerCustomer(normalizedPhone, password))
      onAuthenticated(profile)
      onClose()
      setPassword('')
      setConfirmPassword('')
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'ورود انجام نشد. دوباره تلاش کنید.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-brand-950/55 p-4 backdrop-blur-sm"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <section
        aria-labelledby="customer-auth-title"
        aria-modal="true"
        className="relative w-full max-w-md rounded-[26px] bg-white p-5 shadow-2xl sm:p-7"
        dir="rtl"
        role="dialog"
      >
        <button
          type="button"
          aria-label="بستن پنجره ورود"
          className="absolute left-4 top-4 flex size-9 items-center justify-center rounded-full border border-border-soft bg-surface text-brand-950"
          onClick={onClose}
        >
          <X size={19} />
        </button>
        <div className="flex items-center gap-3">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-brand-950 text-white">
            <CircleUserRound size={26} />
          </span>
          <div>
            <h2 id="customer-auth-title" className="m-0 text-xl font-black text-brand-950">
              {mode === 'login' ? 'ورود به حساب فنینو' : 'ساخت حساب فنینو'}
            </h2>
            <DataSourcePill source="api" />
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 rounded-xl bg-canvas p-1">
          {(['login', 'register'] as const).map((item) => (
            <button
              key={item}
              type="button"
              className={cn(
                'min-h-10 rounded-lg text-sm font-black transition-colors',
                mode === item ? 'bg-white text-brand-950 shadow-sm' : 'text-muted',
              )}
              onClick={() => {
                setMode(item)
                setError('')
              }}
            >
              {item === 'login' ? 'ورود' : 'ثبت‌نام'}
            </button>
          ))}
        </div>

        <form className="mt-5 grid gap-4" onSubmit={(event) => void submit(event)}>
          <Input
            autoComplete="tel"
            inputMode="tel"
            label="شماره موبایل"
            placeholder="۰۹۱۲۱۲۳۴۵۶۷"
            value={phoneNumber}
            onChange={(event) => setPhoneNumber(event.target.value)}
          />
          <Input
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            label="رمز عبور"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          {mode === 'register' && (
            <Input
              autoComplete="new-password"
              label="تکرار رمز عبور"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
          )}
          {error && (
            <p className="m-0 rounded-xl bg-danger-600/10 px-3 py-2 text-sm font-bold text-danger-600" role="alert">
              {error}
            </p>
          )}
          <Button type="submit" fullWidth loading={submitting}>
            {mode === 'login' ? 'ورود به حساب' : 'ثبت‌نام'}
          </Button>
        </form>
      </section>
    </div>
  )
}

function CartDrawer({
  open,
  items,
  onClose,
  onQuantityChange,
  onCheckout,
}: {
  open: boolean
  items: LocalCartItem[]
  onClose: () => void
  onQuantityChange: (id: string, quantity: number) => void
  onCheckout: () => void
}) {
  if (!open) return null

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

  return (
    <div
      className="fixed inset-0 z-[100] bg-brand-950/45"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <aside
        aria-label="سبد خرید نمایشی"
        aria-modal="true"
        className="mr-auto flex h-full w-full max-w-md flex-col bg-white shadow-2xl"
        dir="rtl"
        role="dialog"
      >
        <div className="flex items-center justify-between border-b border-border-soft p-5">
          <div>
            <h2 className="m-0 text-xl font-black text-brand-950">سبد خرید</h2>
            <DataSourcePill source="mock" />
          </div>
          <button
            type="button"
            aria-label="بستن سبد خرید"
            className="flex size-10 items-center justify-center rounded-full border border-border-soft"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {items.length === 0 ? (
            <div className="flex h-full min-h-64 flex-col items-center justify-center text-center text-muted">
              <ShoppingCart size={48} strokeWidth={1.5} />
              <p className="mb-0 mt-4 font-bold">سبد خرید شما خالی است.</p>
            </div>
          ) : (
            <ul className="m-0 grid list-none gap-3 p-0">
              {items.map((item) => (
                <li key={item.id} className="flex gap-3 rounded-2xl border border-border-soft p-3">
                  <span className="flex size-16 shrink-0 items-center justify-center rounded-xl bg-canvas text-muted">
                    {item.imageSrc ? (
                      <img src={item.imageSrc} alt="" className="max-h-14 max-w-14 object-contain" />
                    ) : (
                      <ImageIcon size={26} />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <strong className="block truncate text-sm text-brand-950">{item.name}</strong>
                    <span className="mt-1 block text-xs text-muted">
                      {formatPrice(item.price, item.currency)}
                    </span>
                    <div className="mt-3 flex items-center gap-2" dir="ltr">
                      <button
                        type="button"
                        aria-label={`افزایش تعداد ${item.name}`}
                        className="size-7 rounded-lg border border-border-soft font-black"
                        onClick={() => onQuantityChange(item.id, item.quantity + 1)}
                      >
                        +
                      </button>
                      <span className="min-w-6 text-center text-sm font-black">
                        {toPersianDigits(String(item.quantity))}
                      </span>
                      <button
                        type="button"
                        aria-label={`کاهش تعداد ${item.name}`}
                        className="size-7 rounded-lg border border-border-soft font-black"
                        onClick={() => onQuantityChange(item.id, item.quantity - 1)}
                      >
                        −
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t border-border-soft p-5">
          <div className="mb-4 flex items-center justify-between font-black">
            <span>جمع سبد</span>
            <span>{formatPrice(total)}</span>
          </div>
          <Button fullWidth disabled={!items.length} onClick={onCheckout}>
            ادامه فرایند خرید
          </Button>
          <p className="mb-0 mt-3 text-center text-xs text-muted">
            سبد و پرداخت فعلاً نمایشی هستند.
          </p>
        </div>
      </aside>
    </div>
  )
}

function LandingHeader({
  search,
  onSearchChange,
  onSearchSubmit,
  profile,
  restoringProfile,
  cartCount,
  onAuthOpen,
  onLogout,
  onCartOpen,
}: {
  search: string
  onSearchChange: (value: string) => void
  onSearchSubmit: () => void
  profile: CustomerProfile | null
  restoringProfile: boolean
  cartCount: number
  onAuthOpen: () => void
  onLogout: () => void
  onCartOpen: () => void
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const navigation = [
    ['صفحه اصلی', '#top'],
    ['محصولات', '#new-products'],
    ['برندها', '#brands'],
    ['خدمات', '#services'],
    ['پروژه‌ها', '#promotions'],
    ['دانلودها', '#footer'],
    ['اخبار و مقالات', '#footer'],
    ['درباره ما', '#footer'],
    ['تماس با ما', '#contact'],
  ]

  return (
    <header className="border-b border-border-soft bg-white" dir="rtl">
      <div className="mx-auto grid max-w-[1360px] grid-cols-[1fr_auto] items-center gap-3 px-4 py-3 sm:px-6 lg:grid-cols-[250px_minmax(360px,680px)_250px] lg:gap-10 lg:py-5">
        <a href="#/landing" className="flex items-center gap-3 text-brand-950 no-underline">
          <span className="flex size-11 items-center justify-center rounded-xl bg-brand-950 text-white">
            <Factory size={24} />
          </span>
          <span className="leading-tight">
            <strong className="block text-xl font-black">فنینو</strong>
            <small className="text-xs font-bold tracking-[0.16em] text-accent-500">FANINO</small>
          </span>
        </a>

        <form
          className="order-3 col-span-2 lg:order-none lg:col-span-1"
          role="search"
          onSubmit={(event) => {
            event.preventDefault()
            onSearchSubmit()
          }}
        >
          <label className="relative block">
            <span className="sr-only">جستجو در محصولات</span>
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-950" size={21} />
            <input
              type="search"
              value={search}
              placeholder="جستجو در محصولات…"
              className="h-12 w-full rounded-xl border border-transparent bg-[#eeeeee] pr-12 pl-24 text-sm text-ink transition-colors focus:border-focus focus:bg-white"
              onChange={(event) => onSearchChange(event.target.value)}
            />
            <button
              type="submit"
              className="absolute left-1.5 top-1.5 min-h-9 rounded-lg bg-brand-950 px-4 text-xs font-black text-white"
            >
              جستجو
            </button>
          </label>
        </form>

        <div className="flex items-center justify-end gap-2" dir="ltr">
          <button
            type="button"
            aria-label="باز کردن سبد خرید"
            className="relative flex size-11 items-center justify-center rounded-xl bg-[#eeeeee] text-ink"
            onClick={onCartOpen}
          >
            <ShoppingCart size={24} />
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-accent-500 text-[10px] font-black text-white">
                {toPersianDigits(String(cartCount))}
              </span>
            )}
          </button>
          {profile ? (
            <div className="flex items-center gap-1" dir="rtl">
              <span
                className="flex min-h-11 items-center gap-2 rounded-xl bg-brand-950 px-3 text-xs font-black text-white"
                title={profile.phoneNumber ?? undefined}
              >
                <CircleUserRound size={20} />
                <span className="hidden sm:inline">حساب من</span>
              </span>
              <button
                type="button"
                aria-label="خروج از حساب مشتری"
                className="flex size-11 items-center justify-center rounded-xl border border-border-soft text-brand-950"
                onClick={onLogout}
              >
                <LogOut size={19} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="flex min-h-11 items-center gap-2 rounded-xl bg-brand-950 px-3 text-xs font-black text-white sm:px-4"
              disabled={restoringProfile}
              onClick={onAuthOpen}
            >
              <CircleUserRound size={20} />
              <span className="hidden sm:inline">
                {restoringProfile ? 'در حال بررسی…' : 'ورود / ثبت‌نام'}
              </span>
            </button>
          )}
          <button
            type="button"
            aria-label="باز کردن منوی اصلی"
            aria-expanded={mobileMenuOpen}
            className="flex size-11 items-center justify-center rounded-xl border border-border-soft text-brand-950 lg:hidden"
            onClick={() => setMobileMenuOpen((current) => !current)}
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      <nav
        aria-label="منوی اصلی"
        className={cn(
          'border-t border-border-soft px-4 sm:px-6 lg:block',
          mobileMenuOpen ? 'block' : 'hidden',
        )}
      >
        <div className="mx-auto flex max-w-[1280px] flex-col py-2 lg:flex-row lg:items-center lg:justify-center lg:gap-10 lg:py-0">
          {navigation.map(([label, target], index) => (
            <a
              key={label}
              href={target}
              className={cn(
                'border-b border-border-soft px-2 py-3 text-sm font-black text-brand-950 no-underline last:border-0 lg:border-0 lg:py-5',
                index === 0 && 'text-accent-500',
              )}
              onClick={() => setMobileMenuOpen(false)}
            >
              {label}
            </a>
          ))}
        </div>
      </nav>
    </header>
  )
}

function SectionHeading({
  title,
  source,
  action,
  onAction,
}: {
  title: string
  source?: 'api' | 'mock'
  action?: string
  onAction?: () => void
}) {
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <h2 className="m-0 text-xl font-black text-brand-950 sm:text-2xl">{title}</h2>
        {source && <DataSourcePill source={source} />}
      </div>
      {action && (
        <button
          type="button"
          className="flex items-center gap-1.5 border-0 bg-transparent text-sm font-black text-brand-950"
          onClick={onAction}
        >
          {action}
          <ChevronLeft size={18} />
        </button>
      )}
    </div>
  )
}

function ServicesStrip({ className, id }: { className?: string; id?: string }) {
  return (
    <section
      id={id}
      className={cn(
        'relative grid gap-4 rounded-[20px] border border-border-soft bg-white px-4 py-6 shadow-sm sm:grid-cols-2 lg:grid-cols-4 lg:px-7',
        className,
      )}
    >
      <span className="absolute left-4 top-3">
        <DataSourcePill source="mock" />
      </span>
      {services.map((service, index) => {
        const ServiceIcon = service.icon
        return (
          <div
            key={service.title}
            className={cn(
              'flex items-center justify-center gap-4 py-2',
              index > 0 && 'lg:border-r lg:border-border-soft',
            )}
          >
            <ServiceIcon className="shrink-0 text-brand-950" size={38} strokeWidth={1.8} />
            <div>
              <h3 className="m-0 text-sm font-black text-brand-950">{service.title}</h3>
              <p className="mb-0 mt-1 text-xs font-bold text-muted">{service.text}</p>
            </div>
          </div>
        )
      })}
    </section>
  )
}

function StorefrontFooter() {
  return (
    <footer id="footer" className="mt-10 bg-brand-800 text-white" dir="rtl">
      <div className="border-b border-white/10 bg-[#1e2b35] px-5 py-4">
        <div className="mx-auto flex max-w-[1360px] items-center justify-between gap-4">
          <strong className="text-lg text-accent-500">
            فنینو <span className="text-xs tracking-widest">FANINO</span>
          </strong>
          <DataSourcePill source="mock" />
        </div>
      </div>
      <div className="mx-auto grid max-w-[1360px] gap-10 px-5 py-12 sm:grid-cols-2 lg:grid-cols-4 lg:px-6">
        <section id="contact">
          <h2 className="m-0 text-base font-black text-accent-500">تماس با ما</h2>
          <span className="mt-2 block h-0.5 w-8 bg-accent-500" />
          <div className="mt-6 grid gap-3 text-sm leading-7 text-white/70">
            <p className="m-0 flex gap-2">
              <MapPin size={18} className="mt-1 shrink-0 text-accent-500" />
              تهران، خیابان سمیعی، پلاک ۲۳، فروشگاه فنی
            </p>
            <a
              href="mailto:faniran.sadra.shop@gmail.com"
              className="flex gap-2 text-inherit no-underline"
              dir="ltr"
            >
              <Mail size={18} className="shrink-0 text-accent-500" />
              faniran.sadra.shop@gmail.com
            </a>
            <a
              href="tel:+989358584883"
              className="flex gap-2 text-inherit no-underline"
              dir="ltr"
            >
              <Phone size={18} className="shrink-0 text-accent-500" />
              0935-858-4883
            </a>
            <a
              href="tel:+982177608783"
              className="flex gap-2 text-inherit no-underline"
              dir="ltr"
            >
              <Phone size={18} className="shrink-0 text-accent-500" />
              021-77608783
            </a>
          </div>
        </section>

        {[
          {
            title: 'اطلاعات',
            links: ['نحوه سفارش', 'انتقادات و پیشنهادات', 'قوانین و مقررات', 'روش‌های پرداخت', 'روش‌های ارسال'],
          },
          {
            title: 'محصولات ما',
            links: ['محصولات جدید', 'محصولات پرفروش', 'محصولات پربازدید', 'محصولات موجود', 'محصولات تخفیف‌دار'],
          },
        ].map((column) => (
          <section key={column.title}>
            <h2 className="m-0 text-base font-black text-accent-500">{column.title}</h2>
            <span className="mt-2 block h-0.5 w-8 bg-accent-500" />
            <ul className="m-0 mt-6 grid list-none gap-3 p-0 text-sm text-white/65">
              {column.links.map((link) => (
                <li key={link}>
                  <a
                    href="#new-products"
                    className="text-inherit no-underline transition-colors hover:text-white"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ))}

        <section>
          <h2 className="m-0 text-base font-black text-accent-500">نماد اعتماد</h2>
          <span className="mt-2 block h-0.5 w-8 bg-accent-500" />
          <div className="mt-7 flex h-28 w-32 items-center justify-center rounded-xl bg-white/10 text-white/45">
            <ShieldCheck size={42} />
          </div>
          <div className="mt-7 flex gap-3">
            {[Share2, Mail].map((SocialIcon, index) => (
              <span
                key={index}
                aria-hidden="true"
                className="flex size-9 items-center justify-center rounded-full bg-white/10 text-white"
              >
                <SocialIcon size={17} />
              </span>
            ))}
          </div>
        </section>
      </div>
      <div className="bg-[#1f2a33] px-5 py-5 text-xs text-white/45">
        <div className="mx-auto flex max-w-[1360px] flex-wrap items-center justify-between gap-3">
          <span>تمامی حقوق متعلق به فنینو می‌باشد.</span>
          <span dir="ltr">Terms of Service · Privacy Policy</span>
        </div>
      </div>
    </footer>
  )
}

export function LandingPage() {
  const [searchDraft, setSearchDraft] = useState('')
  const [search, setSearch] = useState('')
  const [apiProducts, setApiProducts] = useState<LandingProduct[]>([])
  const [productStatus, setProductStatus] = useState<ProductLoadStatus>('loading')
  const [profile, setProfile] = useState<CustomerProfile | null>(null)
  const [restoringProfile, setRestoringProfile] = useState(true)
  const [authOpen, setAuthOpen] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const [cartItems, setCartItems] = useState<LocalCartItem[]>([])
  const [notice, setNotice] = useState('')
  const productsSectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    let active = true
    void restoreCustomerSession().then((restoredProfile) => {
      if (!active) return
      setProfile(restoredProfile)
      setRestoringProfile(false)
    })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()

    void getStorefrontProducts(
      { page: 1, pageSize: 4, search: search ? search : undefined, sort: 'Newest' },
      controller.signal,
    )
      .then((response) => {
        setApiProducts(response.items.map(mapApiProduct))
        setProductStatus('ready')
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        setApiProducts([])
        setProductStatus('error')
        setNotice(error instanceof Error ? error.message : 'دریافت محصولات انجام نشد.')
      })

    return () => controller.abort()
  }, [search])

  useEffect(() => {
    if (!notice) return
    const timeoutId = window.setTimeout(() => setNotice(''), 4_500)
    return () => window.clearTimeout(timeoutId)
  }, [notice])

  const products = useMemo(() => {
    if (apiProducts.length || search) return apiProducts
    return productStatus === 'loading' ? [] : demoProducts
  }, [apiProducts, productStatus, search])
  const productSource: 'api' | 'mock' = apiProducts.length ? 'api' : 'mock'
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0)

  const submitSearch = () => {
    setProductStatus('loading')
    setSearch(searchDraft.trim())
    window.requestAnimationFrame(() => {
      productsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  const showMockNotice = (message: string) => setNotice(`${message} فعلاً نمایشی است.`)

  const addToCart = (product: LandingProduct) => {
    setCartItems((current) => {
      const existing = current.find((item) => item.id === product.id)
      if (existing) {
        return current.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item,
        )
      }
      return [...current, { ...product, quantity: 1 }]
    })
    setNotice(`${product.name} به سبد نمایشی اضافه شد.`)
  }

  const changeCartQuantity = (id: string, quantity: number) => {
    setCartItems((current) =>
      quantity <= 0
        ? current.filter((item) => item.id !== id)
        : current.map((item) => (item.id === id ? { ...item, quantity } : item)),
    )
  }

  const handleLogout = async () => {
    setProfile(null)
    await logoutCustomer()
    setNotice('از حساب مشتری خارج شدید.')
  }

  return (
    <div id="top" className="min-h-screen overflow-x-hidden bg-[#fafafa] text-ink" dir="rtl">
      <LandingHeader
        search={searchDraft}
        onSearchChange={setSearchDraft}
        onSearchSubmit={submitSearch}
        profile={profile}
        restoringProfile={restoringProfile}
        cartCount={cartCount}
        onAuthOpen={() => setAuthOpen(true)}
        onLogout={() => void handleLogout()}
        onCartOpen={() => setCartOpen(true)}
      />

      <main className="mx-auto max-w-[1360px] px-3 py-4 sm:px-5 lg:px-6">
        <section
          className="relative isolate grid min-h-[390px] grid-cols-[minmax(0,1fr)] overflow-hidden rounded-[26px] bg-[#061b30] px-6 text-white sm:px-10 lg:grid-cols-[0.95fr_1.05fr] lg:px-16"
          style={{
            backgroundImage:
              'radial-gradient(circle at 25% 45%, #245273 0, #0b2943 36%, #061b30 72%)',
          }}
        >
          <div className="relative z-10 flex min-w-0 flex-col items-start justify-center py-10 text-right lg:order-1">
            <DataSourcePill source="mock" />
            <h1 className="mb-0 mt-5 max-w-xl text-4xl font-black leading-[1.35] sm:text-5xl">
              راهکارهای مطمئن
              <br />
              برای صنایع پیشرو
            </h1>
            <p className="mb-0 mt-4 max-w-xl text-sm font-medium leading-8 text-white/75 sm:text-base">
              تأمین و عرضه انواع پمپ، الکتروموتور و تجهیزات صنعتی با کیفیت بالا و خدمات تخصصی
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button
                size="lg"
                onClick={() =>
                  productsSectionRef.current?.scrollIntoView({ behavior: 'smooth' })
                }
              >
                مشاهده محصولات
              </Button>
              <button
                type="button"
                className="min-h-12 rounded-df-sm border border-white/60 bg-transparent px-6 text-base font-black text-white shadow-sm transition-colors hover:bg-white/10"
                onClick={() =>
                  document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })
                }
              >
                دریافت مشاوره
              </button>
            </div>
          </div>
          <div className="relative flex min-h-64 min-w-0 items-center justify-center overflow-hidden lg:order-2 lg:min-h-0">
            <img
              src={faninoHeroImage}
              alt="مجموعه پمپ صنعتی فنینو"
              width={1536}
              height={1024}
              loading="eager"
              decoding="async"
              fetchPriority="high"
              className="relative z-10 max-h-[360px] min-w-0 max-w-full object-contain"
            />
          </div>
          <button
            type="button"
            aria-label="اسلاید قبلی"
            className="absolute left-3 top-1/2 z-20 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white sm:flex"
            onClick={() => showMockNotice('اسلایدر تبلیغاتی')}
          >
            <ChevronLeft />
          </button>
          <button
            type="button"
            aria-label="اسلاید بعدی"
            className="absolute right-3 top-1/2 z-20 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white sm:flex"
            onClick={() => showMockNotice('اسلایدر تبلیغاتی')}
          >
            <ChevronRight />
          </button>
        </section>

        <section className="mt-8">
          <SectionHeading
            title="دسته‌بندی محصولات"
            source="mock"
            action="مشاهده همه دسته‌بندی‌ها"
            onAction={() => showMockNotice('فهرست عمومی دسته‌بندی‌ها')}
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {categoryCards.map((category) => (
              <a
                key={category.title}
                href="#new-products"
                className="group grid min-h-52 place-items-center rounded-[22px] border border-border-soft bg-white p-5 text-center text-ink no-underline shadow-card transition-transform duration-300 hover:-translate-y-1"
              >
                <img
                  src={category.imageSrc}
                  alt={category.imageAlt}
                  width={96}
                  height={88}
                  loading="lazy"
                  decoding="async"
                  className="h-[88px] w-24 object-contain transition-transform duration-300 group-hover:scale-105"
                />
                <div>
                  <h3 className="m-0 text-base font-black text-brand-950">{category.title}</h3>
                  <p className="mb-0 mt-2 text-xs font-bold text-muted">
                    {category.description}
                  </p>
                </div>
              </a>
            ))}
          </div>
        </section>

        <ServicesStrip id="services" className="mt-10" />

        <section id="new-products" ref={productsSectionRef} className="scroll-mt-5 pt-12">
          <SectionHeading
            title={search ? `نتیجه جستجو برای «${search}»` : 'محصولات جدید'}
            source={productSource}
            action={search ? 'پاک کردن جستجو' : 'مشاهده همه محصولات'}
            onAction={() => {
              if (search) {
                setProductStatus('loading')
                setSearch('')
                setSearchDraft('')
              } else {
                window.location.hash = '#/category/water-pumps'
              }
            }}
          />

          {productStatus === 'error' && (
            <p className="mb-4 mt-0 rounded-xl bg-accent-500/10 px-4 py-3 text-sm font-bold text-[#96500f]">
              دریافت داده زنده ممکن نشد؛ محصولات نمونه برای بررسی طراحی نمایش داده شده‌اند.
            </p>
          )}

          {productStatus === 'loading' ? (
            <div className="grid grid-flow-col auto-cols-[minmax(270px,290px)] gap-5 overflow-hidden lg:grid-flow-row lg:grid-cols-4">
              {Array.from({ length: 4 }, (_, index) => (
                <div
                  key={index}
                  className="h-[355px] animate-pulse rounded-df-lg bg-white shadow-sm"
                />
              ))}
            </div>
          ) : products.length ? (
            <div className="grid snap-x grid-flow-col auto-cols-[minmax(270px,290px)] gap-5 overflow-x-auto px-1 pb-4 lg:grid-flow-row lg:grid-cols-4 lg:justify-items-center lg:overflow-visible">
              {products.map((product, index) => (
                <ProductCard
                  key={product.id}
                  name={product.name}
                  description={product.description}
                  price={formatPrice(product.price, product.currency)}
                  imageSrc={product.imageSrc}
                  imageAlt={product.name}
                  rating={2 + (index % 3)}
                  isNew
                  className="snap-start"
                  onAddToCart={() => addToCart(product)}
                  onOpenCart={() => setCartOpen(true)}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-[22px] border border-border-soft bg-white p-12 text-center shadow-sm">
              <Search className="mx-auto text-muted" size={42} />
              <h3 className="mb-0 mt-4 text-lg font-black text-brand-950">محصولی پیدا نشد</h3>
              <p className="mb-0 mt-2 text-sm text-muted">عبارت دیگری را جستجو کنید.</p>
            </div>
          )}
        </section>

        <section id="promotions" className="grid scroll-mt-5 gap-5 pt-12 lg:grid-cols-2">
          <article className="relative min-h-52 overflow-hidden rounded-[24px] bg-[#eeeeee] p-7 sm:p-10">
            <DataSourcePill source="mock" />
            <Badge variant="accent" className="mt-5">
              تخفیف ویژه
            </Badge>
            <h2 className="mb-0 mt-3 text-3xl font-black text-ink">تا ۲۰٪ تخفیف</h2>
            <p className="mb-0 mt-2 text-sm font-bold text-muted">بر روی منتخب محصولات</p>
            <Gift
              className="absolute bottom-6 left-8 text-brand-950/20"
              size={110}
              strokeWidth={1.4}
            />
            <Button
              variant="outline"
              className="mt-6"
              onClick={() => showMockNotice('صفحه تخفیف‌ها')}
            >
              بیشتر بدانید
            </Button>
          </article>
          <article className="relative min-h-52 overflow-hidden rounded-[24px] bg-brand-800 p-7 text-white sm:p-10">
            <DataSourcePill source="mock" />
            <h2 className="mb-0 mt-5 max-w-sm text-2xl font-black leading-10">
              تجهیزات صنعتی با کیفیت
              <br />
              برای عملکردی بهتر
            </h2>
            <Factory
              className="absolute bottom-4 left-7 text-white/15"
              size={130}
              strokeWidth={1.2}
            />
            <Button
              variant="outline"
              className="mt-6 border-white/50 bg-white text-brand-950"
              onClick={() => showMockNotice('بنر تجهیزات صنعتی')}
            >
              محصولات بیشتر
            </Button>
          </article>
        </section>

        <section className="pt-12">
          <SectionHeading
            title="پیشنهادهای ویژه"
            source="mock"
            action="مشاهده همه پیشنهادها"
            onAction={() => showMockNotice('فهرست پیشنهادهای ویژه')}
          />
          <div className="grid snap-x grid-flow-col auto-cols-[minmax(290px,308px)] gap-5 overflow-x-auto px-1 pb-4 lg:grid-cols-4 lg:justify-items-center lg:overflow-visible">
            {Array.from({ length: 4 }, (_, index) => (
              <DiscountProductCard
                key={index}
                name="پمپ لجن‌کش WQ"
                description="توان ۲۲ وات"
                currentPrice={formatPrice(28_600_000 + index * 300_000)}
                previousPrice={formatPrice(33_180_000 + index * 300_000)}
                discount="۱۶٪"
                days="۰۳"
                hours="۱۶"
                minutes="۲۳"
                seconds={String(47 - index * 5).padStart(2, '0')}
                className="snap-start"
                onView={() => showMockNotice('جزئیات پیشنهاد ویژه')}
              />
            ))}
          </div>
        </section>

        <section id="brands" className="scroll-mt-5 pt-12">
          <SectionHeading
            title="برندهای معتبر"
            source="mock"
            action="مشاهده همه برندها"
            onAction={() => showMockNotice('صفحه عمومی برندها')}
          />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
            {mockBrands.map((brand, index) => (
              <div
                key={brand}
                className="flex h-20 items-center justify-center rounded-[0_0_18px_18px] bg-white px-2 text-center text-lg font-black shadow-card"
                style={{ color: ['#213e7b', '#069d50', '#2973a7', '#009f83'][index % 4] }}
              >
                {brand}
              </div>
            ))}
          </div>
        </section>

        <ServicesStrip className="mt-12" />
      </main>

      <StorefrontFooter />

      <button
        type="button"
        aria-label="بازگشت به بالای صفحه"
        className="fixed bottom-5 left-5 z-40 flex size-12 items-center justify-center rounded-full bg-accent-500 text-white shadow-lg"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      >
        <ArrowUp size={22} />
      </button>

      <CustomerAuthDialog
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        onAuthenticated={(customerProfile) => {
          setProfile(customerProfile)
          setNotice('ورود به حساب مشتری با موفقیت انجام شد.')
        }}
      />
      <CartDrawer
        open={cartOpen}
        items={cartItems}
        onClose={() => setCartOpen(false)}
        onQuantityChange={changeCartQuantity}
        onCheckout={() => showMockNotice('پرداخت و ثبت سفارش')}
      />

      {notice && (
        <div
          aria-live="polite"
          className="fixed bottom-5 right-4 z-[120] max-w-[calc(100vw-2rem)] rounded-xl bg-brand-950 px-4 py-3 text-sm font-bold text-white shadow-2xl sm:right-6"
        >
          {notice}
        </div>
      )}
    </div>
  )
}
