import {
  ArrowUp,
  Camera,
  ChevronDown,
  ChevronLeft,
  Grid2X2,
  Headphones,
  Image as ImageIcon,
  List,
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
  UserRound,
  X,
} from 'lucide-react'
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react'

import photoPlaceholder from '../../assets/figma-photo.svg'
import {
  getStorefrontProducts,
  type StorefrontProductListItem,
  type StorefrontProductPage,
  type StorefrontProductSort,
} from '../../api/storefrontProducts'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Checkbox } from '../../components/ui/Checkbox'
import { FilterAccordion } from '../../components/ui/FilterAccordion'
import { Pagination } from '../../components/ui/Pagination'
import { PriceRange } from '../../components/ui/PriceRange'
import { Rating } from '../../components/ui/Rating'
import { SortBar, type SortOption } from '../../components/ui/SortBar'
import { cn } from '../../utils/cn'
import {
  categoryProductsConfigs,
  mockBrands,
  mockProductNames,
  technicalFilters,
  type CategoryProductsVariant,
} from './categoryProductsData'

const priceFormatter = new Intl.NumberFormat('fa-IR')
const PAGE_SIZE = 12
const MIN_PRICE = 0
const MAX_PRICE = 100_000_000

type SortValue = StorefrontProductSort | 'Popular'
type ViewMode = 'grid' | 'list'

const sortOptions: SortOption[] = [
  { value: 'Popular', label: 'محبوب‌ترین' },
  { value: 'Newest', label: 'جدیدترین' },
  { value: 'PriceAscending', label: 'ارزان‌ترین' },
  { value: 'PriceDescending', label: 'گران‌ترین' },
  { value: 'Oldest', label: 'قدیمی‌ترین' },
  { value: 'NameAscending', label: 'نام محصول' },
]

interface DisplayProduct {
  id: string
  name: string
  summary: string
  price: number
  currency: string
  brandName: string
  brandSlug: string
  isMock: boolean
}

function DataPill({
  kind,
  className,
}: {
  kind: 'api' | 'mock'
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex h-5 items-center rounded-full px-2 text-[10px] font-extrabold leading-none',
        kind === 'api'
          ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20'
          : 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20',
        className,
      )}
    >
      {kind === 'api' ? 'API زنده' : 'نمایشی'}
    </span>
  )
}

function StorefrontHeader({
  search,
  onSearchChange,
  onSearchSubmit,
}: {
  search: string
  onSearchChange: (value: string) => void
  onSearchSubmit: () => void
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const navLinks = [
    { label: 'صفحه اصلی', href: '#/category/water-pumps' },
    { label: 'محصولات', href: '#/category/water-pumps', active: true },
    { label: 'برندها', href: '#brands' },
    { label: 'خدمات', href: '#services' },
    { label: 'پروژه‌ها', href: '#projects' },
    { label: 'دانلودها', href: '#downloads' },
    { label: 'اخبار و مقالات', href: '#articles' },
    { label: 'درباره ما', href: '#about' },
    { label: 'تماس با ما', href: '#contact' },
  ]

  const submitSearch = (event: FormEvent) => {
    event.preventDefault()
    onSearchSubmit()
  }

  return (
    <header className="border-b border-[#d7d7d7] bg-white" dir="rtl">
      <div className="mx-auto grid min-h-[84px] max-w-[1360px] grid-cols-[auto_1fr_auto] items-center gap-4 px-4 sm:px-6 lg:grid-cols-[250px_minmax(320px,680px)_250px] lg:gap-10">
        <a
          href="#/category/water-pumps"
          className="col-start-1 row-start-1 flex min-w-0 items-center justify-self-start text-brand-950 no-underline lg:col-start-1 lg:justify-self-start"
          aria-label="صفحه اصلی دیجی‌فن"
        >
          <span className="flex size-10 items-center justify-center rounded-df-sm border-2 border-brand-950">
            <ImageIcon size={23} strokeWidth={2.4} />
          </span>
          <span className="mr-3 text-xl font-black">نام برند</span>
        </a>

        <form
          role="search"
          className="relative col-span-3 col-start-1 row-start-2 mb-3 w-full min-w-0 lg:col-span-1 lg:col-start-2 lg:row-start-1 lg:mb-0"
          onSubmit={submitSearch}
        >
          <input
            type="search"
            aria-label="جستجو در محصولات"
            placeholder="جستجو در محصولات..."
            value={search}
            className="h-12 w-full rounded-df-md border-0 bg-[#ededed] px-12 text-sm text-ink shadow-none placeholder:text-[#969ca2] focus:bg-[#e9eaeb] focus:outline-none"
            onChange={(event) => onSearchChange(event.currentTarget.value)}
          />
          <Search
            aria-hidden="true"
            size={24}
            className="absolute inset-y-0 right-4 my-auto text-brand-950"
          />
        </form>

        <div className="col-start-3 row-start-1 flex items-center justify-self-end gap-3 lg:col-start-3 lg:justify-self-end" dir="ltr">
          <a
            href="#cart"
            aria-label="سبد خرید"
            className="flex size-11 items-center justify-center rounded-df-sm bg-[#eeeeee] text-ink"
            onClick={(event) => event.preventDefault()}
          >
            <ShoppingCart size={27} />
          </a>
          <a
            href="#/admin"
            className="hidden h-11 items-center gap-2 rounded-df-sm bg-brand-950 px-4 text-sm font-extrabold text-white no-underline sm:flex"
          >
            <UserRound size={20} />
            ورود / ثبت‌نام
          </a>
          <button
            type="button"
            className="flex size-11 items-center justify-center rounded-df-sm border-0 bg-[#eeeeee] text-brand-950 lg:hidden"
            aria-label={mobileMenuOpen ? 'بستن فهرست' : 'باز کردن فهرست'}
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((current) => !current)}
          >
            {mobileMenuOpen ? <X size={25} /> : <Menu size={25} />}
          </button>
        </div>
      </div>

      <nav
        aria-label="فهرست اصلی"
        className={cn(
          'mx-auto max-w-[1360px] border-t border-[#ececec] px-4 sm:px-6 lg:block lg:border-t-0',
          mobileMenuOpen ? 'block' : 'hidden',
        )}
      >
        <ul className="m-0 flex list-none flex-col items-stretch justify-center gap-1 p-2 lg:min-h-[66px] lg:flex-row lg:items-center lg:gap-8 lg:p-0">
          {navLinks.map((link) => (
            <li key={link.label} className={cn(link.active && 'group relative')}>
              <a
                href={link.href}
                className={cn(
                  'flex min-h-10 items-center justify-between rounded-md px-3 text-sm font-bold no-underline transition-colors hover:bg-orange-50 hover:text-accent-500 lg:min-h-0 lg:rounded-none lg:px-0',
                  link.active ? 'text-accent-500' : 'text-brand-950',
                )}
                onClick={(event) => {
                  if (link.href.startsWith('#/')) return
                  event.preventDefault()
                  document.getElementById(link.href.slice(1))?.scrollIntoView({ behavior: 'smooth' })
                }}
              >
                {link.label}
                {link.active && <ChevronDown size={17} className="mr-1" />}
              </a>
              {link.active && (
                <div className="right-0 z-50 hidden min-w-52 rounded-df-md border border-border-soft bg-white p-2 shadow-raised group-hover:block group-focus-within:block lg:absolute lg:top-7">
                  <a
                    href="#/category/water-pumps"
                    className="block rounded-md px-4 py-3 text-sm font-bold text-brand-950 no-underline hover:bg-orange-50 hover:text-accent-500"
                  >
                    پمپ آب
                  </a>
                  <a
                    href="#/category/accessories"
                    className="block rounded-md px-4 py-3 text-sm font-bold text-brand-950 no-underline hover:bg-orange-50 hover:text-accent-500"
                  >
                    تجهیزات جانبی
                  </a>
                </div>
              )}
            </li>
          ))}
        </ul>
      </nav>
    </header>
  )
}

function CategoryHero({
  variant,
  onCtaClick,
}: {
  variant: CategoryProductsVariant
  onCtaClick: () => void
}) {
  const config = categoryProductsConfigs[variant]

  return (
    <section className="relative grid min-h-[275px] overflow-hidden rounded-[32px] bg-[#001b35] px-6 text-white sm:px-10 lg:grid-cols-[1fr_1.05fr] lg:px-16">
      <div className="relative z-10 flex min-w-0 flex-col items-start justify-center py-10 text-right lg:items-start">
        <DataPill kind="mock" className="mb-4 bg-white/10 text-white ring-white/25" />
        <h1 className="m-0 text-4xl font-black sm:text-5xl">{config.title}</h1>
        <p className="mb-0 mt-4 max-w-xl text-sm font-medium leading-7 text-[#d7e1ea] sm:text-base">
          {config.description}
          <br />
          {config.supportingText}
        </p>
        <Button
          variant="secondary"
          size="lg"
          className="mt-7 min-w-[250px] rounded-df-md text-white"
          leadingIcon={<Search size={22} />}
          onClick={onCtaClick}
        >
          مشاهده محصولات جدید
        </Button>
      </div>

      <div className="relative order-first flex min-h-[220px] min-w-0 items-center justify-center lg:order-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(46,132,210,0.34),transparent_63%)]" />
        <img
          src={config.heroImage}
          alt={config.heroImageAlt}
          width={660}
          height={420}
          loading="eager"
          decoding="async"
          fetchPriority="high"
          className={cn(
            'relative z-10 max-h-[260px] w-full object-contain drop-shadow-[0_24px_22px_rgba(0,0,0,0.32)] lg:max-h-[330px]',
            variant === 'accessories' && 'scale-[0.92]',
          )}
        />
      </div>
    </section>
  )
}

function SubcategoryStrip({
  variant,
  onSelect,
}: {
  variant: CategoryProductsVariant
  onSelect: (value: string) => void
}) {
  const config = categoryProductsConfigs[variant]

  return (
    <section className="mt-3 rounded-[24px] border border-[#e4e4e4] bg-white px-5 py-5 shadow-[0_3px_5px_rgba(0,0,0,0.16)]">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="m-0 text-base font-black">دسته‌بندی‌ها</h2>
          <DataPill kind="mock" />
        </div>
        <button
          type="button"
          className="border-0 bg-transparent text-xs font-bold text-ink"
          onClick={() => document.getElementById('products-grid')?.scrollIntoView({ behavior: 'smooth' })}
        >
          مشاهده همه
        </button>
      </div>
      <div className="flex snap-x gap-4 overflow-x-auto pb-2 lg:justify-center">
        {config.subcategories.map((subcategory) => (
          <button
            key={subcategory}
            type="button"
            className="group flex h-[138px] w-[128px] shrink-0 snap-start flex-col items-center justify-center rounded-[26px] border border-[#eeeeee] bg-[#fbfbfb] px-3 text-center transition-[border-color,transform,box-shadow] duration-200 hover:-translate-y-1 hover:border-accent-500 hover:shadow-md"
            onClick={() => onSelect(subcategory)}
          >
            <span className="flex size-12 items-center justify-center rounded-xl text-ink group-hover:text-accent-500">
              <ImageIcon size={33} strokeWidth={2.1} />
            </span>
            <span className="mt-4 text-xs font-extrabold">{subcategory}</span>
          </button>
        ))}
      </div>
    </section>
  )
}

function ProductCard({
  product,
  view,
  onMockAction,
}: {
  product: DisplayProduct
  view: ViewMode
  onMockAction: () => void
}) {
  const rating = 2 + (product.id.charCodeAt(0) % 3)

  return (
    <article
      className={cn(
        'relative overflow-hidden rounded-[22px] border border-[#e3e3e3] bg-white p-4 shadow-[0_3px_5px_rgba(0,0,0,0.14)] transition-transform duration-200 hover:-translate-y-1',
        view === 'list'
          ? 'grid min-h-[210px] grid-cols-[140px_1fr] items-center gap-5 sm:grid-cols-[220px_1fr]'
          : 'flex min-h-[382px] flex-col',
      )}
    >
      <Badge className="absolute right-4 top-4 z-10 min-h-6 rounded-md px-3 text-[11px]">
        جدید
      </Badge>
      <DataPill kind={product.isMock ? 'mock' : 'api'} className="absolute left-4 top-4 z-10" />

      <div
        className={cn(
          'flex items-center justify-center',
          view === 'list' ? 'h-[170px]' : 'h-[190px] pt-7',
        )}
      >
        <img
          src={photoPlaceholder}
          alt=""
          width={90}
          height={90}
          loading="lazy"
          decoding="async"
          className="size-[78px] object-contain"
        />
      </div>

      <div className={cn('min-w-0', view === 'grid' && 'flex flex-1 flex-col text-center')}>
        <h3 className="m-0 truncate text-[15px] font-black">{product.name}</h3>
        <p className="mb-0 mt-2 line-clamp-1 text-xs font-medium text-muted">
          {product.summary}
        </p>
        {product.brandName && (
          <p className="mb-0 mt-1 truncate text-[11px] text-muted">{product.brandName}</p>
        )}
        <Rating
          value={rating}
          size={19}
          className={cn('mt-3', view === 'grid' ? 'justify-center' : 'justify-start')}
        />
        <p className="mb-0 mt-3 text-[12px] font-extrabold">
          قیمت {priceFormatter.format(product.price)} {product.currency}
        </p>
        <div
          className={cn(
            'mt-4 flex items-center gap-3',
            view === 'grid' ? 'mt-auto pt-4' : 'max-w-[310px]',
          )}
          dir="ltr"
        >
          <button
            type="button"
            aria-label="سبد خرید نمایشی"
            className="flex size-10 shrink-0 items-center justify-center rounded-df-sm border border-[#d3d3d3] bg-white text-brand-950"
            onClick={onMockAction}
          >
            <ShoppingCart size={21} />
          </button>
          <Button
            fullWidth
            size="sm"
            className="h-10"
            onClick={onMockAction}
          >
            افزودن به سبد خرید
          </Button>
        </div>
      </div>
    </article>
  )
}

function FiltersPanel({
  search,
  onSearchChange,
  onSearchSubmit,
  priceRange,
  onPriceRangeChange,
  onPriceRangeCommit,
  brands,
  selectedBrand,
  onBrandChange,
  onMockAction,
  className,
}: {
  search: string
  onSearchChange: (value: string) => void
  onSearchSubmit: () => void
  priceRange: [number, number]
  onPriceRangeChange: (range: [number, number]) => void
  onPriceRangeCommit: (range: [number, number]) => void
  brands: { name: string; slug: string; isMock: boolean }[]
  selectedBrand: string
  onBrandChange: (slug: string) => void
  onMockAction: () => void
  className?: string
}) {
  return (
    <aside
      className={cn(
        'overflow-hidden rounded-[22px] border border-[#dadada] bg-white shadow-[0_3px_5px_rgba(0,0,0,0.16)]',
        className,
      )}
      aria-label="فیلتر محصولات"
    >
      <div className="flex items-center justify-between px-5 pt-5">
        <h2 className="m-0 text-base font-black">فیلتر محصولات</h2>
        <DataPill kind="api" />
      </div>

      <FilterAccordion title="جستجو" defaultOpen className="mt-3 px-3">
        <form
          className="relative"
          onSubmit={(event) => {
            event.preventDefault()
            onSearchSubmit()
          }}
        >
          <input
            type="search"
            aria-label="جستجو بین محصولات"
            placeholder="جستجو در محصولات..."
            value={search}
            className="h-11 w-full rounded-df-md border-0 bg-[#f0f0f0] px-10 text-xs outline-none"
            onChange={(event) => onSearchChange(event.currentTarget.value)}
          />
          <Search
            aria-hidden="true"
            size={21}
            className="absolute inset-y-0 right-3 my-auto text-brand-950"
          />
        </form>
      </FilterAccordion>

      <FilterAccordion title="برند" defaultOpen className="px-3">
        <div className="grid gap-3">
          <Checkbox
            type="radio"
            name="brand-filter"
            label="همه برندها"
            checked={!selectedBrand}
            onChange={() => onBrandChange('')}
          />
          {brands.slice(0, 5).map((brand) => (
            <div key={brand.slug} className="flex items-center justify-between gap-2">
              <Checkbox
                type="radio"
                name="brand-filter"
                label={brand.name}
                checked={selectedBrand === brand.slug}
                onChange={() => onBrandChange(brand.slug)}
              />
              <span className="flex items-center gap-1 text-[10px] text-muted">
                {brand.isMock && <DataPill kind="mock" />}
              </span>
            </div>
          ))}
        </div>
      </FilterAccordion>

      <div className="border-b border-border-soft px-5 py-4">
        <PriceRange
          min={MIN_PRICE}
          max={MAX_PRICE}
          step={500_000}
          value={priceRange}
          className="border-0 p-0 shadow-none"
          onChange={onPriceRangeChange}
          onChangeEnd={onPriceRangeCommit}
        />
      </div>

      {technicalFilters.map((filter) => (
        <FilterAccordion key={filter} title={filter} className="px-3">
          <div className="grid gap-3">
            <DataPill kind="mock" className="w-fit" />
            {['گزینه اول', 'گزینه دوم', 'گزینه سوم'].map((option) => (
              <Checkbox
                key={option}
                label={option}
                onChange={onMockAction}
              />
            ))}
          </div>
        </FilterAccordion>
      ))}
    </aside>
  )
}

function PromoCard({
  variant,
  onClick,
}: {
  variant: CategoryProductsVariant
  onClick: () => void
}) {
  const config = categoryProductsConfigs[variant]

  return (
    <section className="relative mt-7 min-h-[310px] overflow-hidden rounded-[22px] bg-[#032039] p-6 text-white shadow-card">
      <DataPill kind="mock" className="absolute left-4 top-4 bg-white/10 text-white ring-white/25" />
      <h2 className="m-0 mt-10 text-2xl font-black">تجهیزات صنعتی</h2>
      <p className="mb-0 mt-2 text-xl font-black text-[#1ca4e9]">با کیفیت بالا</p>
      <p className="mb-0 mt-1 text-lg font-bold">برای عملکرد بهتر</p>
      <Button
        variant="outline"
        size="sm"
        className="relative z-10 mt-5 border-0 bg-white text-brand-950"
        onClick={onClick}
      >
        مشاهده محصولات
      </Button>
      <img
        src={categoryProductsConfigs['water-pumps'].heroImage}
        alt=""
        width={250}
        height={180}
        loading="lazy"
        decoding="async"
        className="absolute -bottom-2 -left-6 h-[160px] w-[230px] object-contain"
      />
      <span className="absolute -bottom-20 -right-12 size-[310px] rounded-full border-[7px] border-accent-500" />
      <span className="sr-only">{config.title}</span>
    </section>
  )
}

function BrandStrip() {
  return (
    <section id="brands" className="mt-12">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="m-0 text-xl font-black">برندهای معتبر</h2>
          <DataPill kind="mock" />
        </div>
        <button
          type="button"
          className="flex items-center gap-2 border-0 bg-transparent text-sm font-bold text-ink"
          onClick={() => document.getElementById('brands')?.scrollIntoView({ behavior: 'smooth' })}
        >
          مشاهده همه برندها
          <ChevronLeft size={19} />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        {mockBrands.map((brand, index) => (
          <div
            key={brand.slug}
            className="flex h-[82px] items-center justify-center rounded-[0_0_18px_18px] bg-white text-center text-xl font-black shadow-[0_4px_4px_rgba(0,0,0,0.2)]"
            style={{ color: ['#213e7b', '#069d50', '#2973a7', '#009f83'][index % 4] }}
          >
            {brand.name}
          </div>
        ))}
      </div>
    </section>
  )
}

function ServicesStrip() {
  const services: { title: string; text: string; icon: ReactNode }[] = [
    {
      title: 'ارسال سریع',
      text: 'به سراسر کشور',
      icon: <Truck size={42} />,
    },
    {
      title: 'ضمانت اصالت کالا',
      text: 'کلیه محصولات',
      icon: <ShieldCheck size={42} />,
    },
    {
      title: 'گارانتی بازگشت وجه',
      text: 'تا ۳۰ روز',
      icon: <Medal size={42} />,
    },
    {
      title: 'مشاوره تخصصی',
      text: 'پیشنهاد بهترین راهکار',
      icon: <Headphones size={42} />,
    },
  ]

  return (
    <section
      id="services"
      className="relative mt-10 grid gap-5 rounded-[18px] bg-white px-6 py-7 sm:grid-cols-2 lg:grid-cols-4"
    >
      <DataPill kind="mock" className="absolute left-4 top-3" />
      {services.map((service, index) => (
        <div
          key={service.title}
          className={cn(
            'flex items-center justify-center gap-5 py-2',
            index > 0 && 'lg:border-r lg:border-[#d5d5d5]',
          )}
        >
          <span className="text-ink">{service.icon}</span>
          <div>
            <h3 className="m-0 text-sm font-black">{service.title}</h3>
            <p className="mb-0 mt-2 text-xs font-bold">{service.text}</p>
          </div>
        </div>
      ))}
    </section>
  )
}

function StorefrontFooter() {
  return (
    <footer id="contact" className="mt-3 bg-brand-800 text-white" dir="rtl">
      <div className="border-b border-white/10 bg-[#1e2b35] px-6 py-4">
        <div className="mx-auto flex max-w-[1360px] items-center justify-between">
          <strong className="text-accent-500">نام برند</strong>
          <DataPill kind="mock" className="bg-white/10 text-white ring-white/20" />
        </div>
      </div>
      <div className="mx-auto grid max-w-[1360px] gap-10 px-6 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <section>
          <h2 className="m-0 text-base font-black text-accent-500">تماس با ما</h2>
          <span className="mt-2 block h-0.5 w-8 bg-accent-500" />
          <div className="mt-6 grid gap-3 text-sm leading-7 text-white/65">
            <p className="m-0 flex gap-2">
              <MapPin size={18} className="mt-1 shrink-0 text-accent-500" />
              تهران، خیابان سمیعی، پلاک ۲۳، فروشگاه فنی
            </p>
            <p className="m-0 flex gap-2" dir="ltr">
              <Mail size={18} className="text-accent-500" />
              faniran.sadra.shop@gmail.com
            </p>
            <p className="m-0 flex gap-2" dir="ltr">
              <Phone size={18} className="text-accent-500" />
              021-77608783
            </p>
          </div>
        </section>

        {[
          {
            title: 'اطلاعات',
            links: ['نحوه سفارش', 'انتقادات و پیشنهادات', 'قوانین و مقررات', 'روش‌های پرداخت'],
          },
          {
            title: 'محصولات ما',
            links: ['محصولات جدید', 'محصولات پرفروش', 'محصولات موجود', 'محصولات تخفیف‌دار'],
          },
        ].map((column) => (
          <section key={column.title}>
            <h2 className="m-0 text-base font-black text-accent-500">{column.title}</h2>
            <span className="mt-2 block h-0.5 w-8 bg-accent-500" />
            <ul className="m-0 mt-6 grid list-none gap-3 p-0 text-sm text-white/60">
              {column.links.map((link) => (
                <li key={link}>
                  <a
                    href="#footer"
                    className="text-inherit no-underline hover:text-white"
                    onClick={(event) => event.preventDefault()}
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
          <div className="mt-7 h-28 w-32 rounded-xl bg-white/10" />
          <div className="mt-7 flex gap-3">
            {[Camera, Share2].map((SocialIcon, index) => (
              <a
                key={index}
                href="#social"
                aria-label="شبکه اجتماعی نمایشی"
                className="flex size-9 items-center justify-center rounded-full bg-white/10 text-white"
                onClick={(event) => event.preventDefault()}
              >
                <SocialIcon size={18} />
              </a>
            ))}
          </div>
        </section>
      </div>
      <div className="bg-[#1f2a33] px-6 py-5 text-xs text-white/45">
        <div className="mx-auto flex max-w-[1360px] flex-wrap items-center justify-between gap-3">
          <span>تمامی حقوق متعلق به نام برند می‌باشد.</span>
          <span dir="ltr">Terms of Service · Privacy Policy</span>
        </div>
      </div>
      <button
        type="button"
        aria-label="بازگشت به بالای صفحه"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="fixed bottom-5 left-5 z-40 flex size-12 items-center justify-center rounded-full bg-accent-500 text-white shadow-lg"
      >
        <ArrowUp size={23} />
      </button>
    </footer>
  )
}

function makeMockProducts(variant: CategoryProductsVariant): DisplayProduct[] {
  const offset = variant === 'accessories' ? 4 : 0

  return Array.from({ length: PAGE_SIZE }, (_, index) => {
    const name = mockProductNames[(index + offset) % mockProductNames.length] ?? 'محصول صنعتی'
    const brand = mockBrands[index % mockBrands.length] ?? mockBrands[0]

    return {
      id: `mock-${variant}-${index}`,
      name,
      summary: 'اطلاعات کامل محصول',
      price: 34_500_000 + index * 1_250_000,
      currency: 'تومان',
      brandName: brand.name,
      brandSlug: brand.slug,
      isMock: true,
    }
  })
}

function mapApiProducts(items: StorefrontProductListItem[]): DisplayProduct[] {
  return items.map((item) => ({
    id: item.id,
    name: getTextOrFallback(item.name, 'محصول بدون نام'),
    summary: getTextOrFallback(item.summary, 'اطلاعات تکمیلی ثبت نشده است'),
    price: item.price,
    currency: getTextOrFallback(item.currency, 'تومان'),
    brandName: getTextOrFallback(item.brandName, ''),
    brandSlug: getTextOrFallback(item.brandSlug, ''),
    isMock: false,
  }))
}

function getTextOrFallback(value: string | null, fallback: string) {
  const trimmedValue = value?.trim()
  return trimmedValue?.length ? trimmedValue : fallback
}

function getCategorySlug(defaultSlug: string) {
  const queryString = window.location.hash.split('?')[1] ?? ''
  const configuredSlug = new URLSearchParams(queryString).get('categorySlug')?.trim()
  return configuredSlug?.length ? configuredSlug : defaultSlug
}

export interface CategoryProductsPageProps {
  variant: CategoryProductsVariant
}

export function CategoryProductsPage({ variant }: CategoryProductsPageProps) {
  const config = categoryProductsConfigs[variant]
  const productsSectionRef = useRef<HTMLElement>(null)
  const [searchDraft, setSearchDraft] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState<SortValue>('Popular')
  const [view, setView] = useState<ViewMode>('grid')
  const [selectedBrand, setSelectedBrand] = useState('')
  const [priceRange, setPriceRange] = useState<[number, number]>([MIN_PRICE, MAX_PRICE])
  const [committedPriceRange, setCommittedPriceRange] = useState<[number, number]>([
    MIN_PRICE,
    MAX_PRICE,
  ])
  const [result, setResult] = useState<StorefrontProductPage | null>(null)
  const [error, setError] = useState('')
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const [mockNotice, setMockNotice] = useState('')

  const categorySlug = getCategorySlug(config.categorySlug)
  const requestKey = [
    page,
    search,
    categorySlug,
    selectedBrand,
    committedPriceRange[0],
    committedPriceRange[1],
    sort,
  ].join('|')
  const [resolvedRequestKey, setResolvedRequestKey] = useState('')
  const isLoading = resolvedRequestKey !== requestKey

  useEffect(() => {
    const controller = new AbortController()

    void getStorefrontProducts(
      {
        page,
        pageSize: PAGE_SIZE,
        search,
        categorySlug,
        brandSlug: selectedBrand,
        minPrice: committedPriceRange[0] > MIN_PRICE ? committedPriceRange[0] : undefined,
        maxPrice: committedPriceRange[1] < MAX_PRICE ? committedPriceRange[1] : undefined,
        sort: sort === 'Popular' ? undefined : sort,
      },
      controller.signal,
    )
      .then((response) => {
        setResult(response)
        setError('')
        setResolvedRequestKey(requestKey)
      })
      .catch((requestError: unknown) => {
        if (controller.signal.aborted) return
        setResult(null)
        setError(
          requestError instanceof Error
            ? requestError.message
            : 'دریافت محصولات از سرور با خطا روبه‌رو شد.',
        )
        setResolvedRequestKey(requestKey)
      })

    return () => controller.abort()
  }, [categorySlug, committedPriceRange, page, requestKey, search, selectedBrand, sort])

  useEffect(() => {
    document.title = `${config.title} | DigiFan`
    const description = document.querySelector<HTMLMetaElement>('meta[name="description"]')
    if (description) description.content = `${config.description}؛ مشاهده و مقایسه محصولات ${config.title}.`
  }, [config])

  const apiProducts = useMemo(() => mapApiProducts(result?.items ?? []), [result])
  const usesMockProducts = !isLoading && apiProducts.length === 0
  const products = usesMockProducts ? makeMockProducts(variant) : apiProducts
  const totalPages = usesMockProducts ? 3 : Math.max(1, result?.totalPages ?? 1)

  const brands = useMemo(() => {
    if (apiProducts.length === 0) {
      return mockBrands.map((brand) => ({ ...brand, isMock: true }))
    }

    const uniqueBrands = new Map<string, { name: string; slug: string; isMock: false }>()
    apiProducts.forEach((product) => {
      if (!product.brandSlug || !product.brandName) return
      uniqueBrands.set(product.brandSlug, {
        name: product.brandName,
        slug: product.brandSlug,
        isMock: false,
      })
    })

    return [...uniqueBrands.values()]
  }, [apiProducts])

  const submitSearch = () => {
    setSearch(searchDraft.trim())
    setPage(1)
  }

  const showMockNotice = (message = 'این تعامل در طرح فعلی نمایشی است و API متناظر ندارد.') => {
    setMockNotice(message)
    window.setTimeout(() => setMockNotice(''), 3500)
  }

  const scrollToProducts = () => {
    productsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div id="top" className="min-h-screen overflow-x-hidden bg-[#f7f7f7] text-ink" dir="rtl">
      <StorefrontHeader
        search={searchDraft}
        onSearchChange={setSearchDraft}
        onSearchSubmit={submitSearch}
      />

      <main className="mx-auto max-w-[1360px] px-3 py-4 sm:px-5 lg:px-6">
        <div className="rounded-[24px] border border-[#dddddd] bg-[#fafafa] p-3 shadow-[0_2px_3px_rgba(0,0,0,0.12)] sm:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 px-2 text-xs font-bold text-muted">
            <nav aria-label="مسیر صفحه" className="flex items-center gap-3">
              <a href="#/category/water-pumps" className="text-inherit no-underline">
                خانه
              </a>
              <ChevronLeft size={16} />
              <span>محصولات</span>
              <ChevronLeft size={16} />
              <span className="text-ink">{config.title}</span>
            </nav>
            <div className="flex flex-wrap items-center gap-2" aria-label="راهنمای منبع داده">
              <DataPill kind="api" />
              <span>متن، قیمت و فیلترهای عمومی</span>
              <DataPill kind="mock" />
              <span>تصویر و اطلاعات تکمیلی</span>
            </div>
          </div>

          <CategoryHero variant={variant} onCtaClick={scrollToProducts} />
          <SubcategoryStrip
            variant={variant}
            onSelect={(value) => {
              setSearchDraft(value)
              setSearch(value)
              setPage(1)
              scrollToProducts()
            }}
          />

          <div className="mt-7">
            <button
              type="button"
              className="mb-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-df-md bg-brand-950 px-4 text-sm font-black text-white lg:hidden"
              aria-expanded={mobileFiltersOpen}
              onClick={() => setMobileFiltersOpen((current) => !current)}
            >
              <Menu size={20} />
              {mobileFiltersOpen ? 'بستن فیلترها' : 'نمایش فیلترها'}
            </button>

            <div className="grid items-start gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
              <div className={cn('lg:block', mobileFiltersOpen ? 'block' : 'hidden')}>
                <FiltersPanel
                  search={searchDraft}
                  onSearchChange={setSearchDraft}
                  onSearchSubmit={submitSearch}
                  priceRange={priceRange}
                  onPriceRangeChange={setPriceRange}
                  onPriceRangeCommit={(range) => {
                    setCommittedPriceRange(range)
                    setPage(1)
                  }}
                  brands={brands}
                  selectedBrand={selectedBrand}
                  onBrandChange={(slug) => {
                    setSelectedBrand(slug)
                    setPage(1)
                  }}
                  onMockAction={() => showMockNotice()}
                />
                <PromoCard variant={variant} onClick={scrollToProducts} />
              </div>

              <section ref={productsSectionRef} id="products-grid" className="min-w-0 scroll-mt-5">
                <div className="mb-5 flex flex-col gap-3 rounded-[18px] border border-[#e5e5e5] bg-white p-3 shadow-[0_3px_5px_rgba(0,0,0,0.12)] xl:flex-row xl:items-center">
                  <SortBar
                    value={sort}
                    options={sortOptions}
                    className="min-w-0 flex-1 border-0 p-0 shadow-none"
                    onChange={(value) => {
                      setSort(value as SortValue)
                      setPage(1)
                    }}
                  />
                  <div className="flex items-center gap-1 rounded-df-md bg-[#f5f5f5] p-1" dir="ltr">
                    <button
                      type="button"
                      aria-label="نمایش شبکه‌ای"
                      aria-pressed={view === 'grid'}
                      className={cn(
                        'flex size-9 items-center justify-center rounded-md border-0',
                        view === 'grid' ? 'bg-white text-ink shadow-sm' : 'bg-transparent text-muted',
                      )}
                      onClick={() => setView('grid')}
                    >
                      <Grid2X2 size={18} />
                    </button>
                    <button
                      type="button"
                      aria-label="نمایش فهرستی"
                      aria-pressed={view === 'list'}
                      className={cn(
                        'flex size-9 items-center justify-center rounded-md border-0',
                        view === 'list' ? 'bg-white text-ink shadow-sm' : 'bg-transparent text-muted',
                      )}
                      onClick={() => setView('list')}
                    >
                      <List size={19} />
                    </button>
                  </div>
                </div>

                {sort === 'Popular' && (
                  <div className="mb-4 flex items-center gap-2 rounded-df-md border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-bold text-amber-800">
                    <DataPill kind="mock" />
                    مرتب‌سازی محبوب‌ترین تا زمان ارائه امتیاز/بازدید توسط بک‌اند نمایشی است.
                  </div>
                )}

                {!isLoading && error && (
                  <div
                    role="alert"
                    className="mb-4 rounded-df-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700"
                  >
                    اتصال API برقرار نشد: {error} — محصولات نمایشی جایگزین شده‌اند.
                  </div>
                )}

                {!error && !isLoading && result?.items.length === 0 && (
                  <div
                    role="status"
                    className="mb-4 rounded-df-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800"
                  >
                    API برای اسلاگ «{categorySlug}» محصولی برنگرداند؛ کارت‌های زیر نمایشی‌اند.
                  </div>
                )}

                {isLoading ? (
                  <div
                    className={cn(
                      'grid gap-3',
                      view === 'grid'
                        ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-4'
                        : 'grid-cols-1',
                    )}
                    aria-label="در حال بارگذاری محصولات"
                  >
                    {Array.from({ length: 8 }, (_, index) => (
                      <div
                        key={index}
                        className="h-[382px] animate-pulse rounded-[22px] border border-[#e8e8e8] bg-white"
                      >
                        <div className="mx-5 mt-14 h-40 rounded-xl bg-[#eeeeee]" />
                        <div className="mx-auto mt-6 h-4 w-2/3 rounded bg-[#eeeeee]" />
                        <div className="mx-auto mt-3 h-3 w-1/2 rounded bg-[#eeeeee]" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div
                    className={cn(
                      'grid gap-3',
                      view === 'grid'
                        ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-4'
                        : 'grid-cols-1',
                    )}
                  >
                    {products.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        view={view}
                        onMockAction={() =>
                          showMockNotice('سبد خرید هنوز API عمومی ندارد و این دکمه نمایشی است.')
                        }
                      />
                    ))}
                  </div>
                )}

                {!isLoading && (
                  <Pagination
                    page={page}
                    pageCount={totalPages}
                    className="mt-9"
                    onPageChange={(nextPage) => {
                      setPage(nextPage)
                      scrollToProducts()
                    }}
                  />
                )}
              </section>
            </div>
          </div>

          <BrandStrip />
          <ServicesStrip />
        </div>
      </main>

      <StorefrontFooter />

      {mockNotice && (
        <div
          role="status"
          className="fixed bottom-5 right-5 z-[80] max-w-sm rounded-df-md bg-brand-950 px-5 py-4 text-sm font-bold text-white shadow-raised"
        >
          {mockNotice}
        </div>
      )}
    </div>
  )
}
