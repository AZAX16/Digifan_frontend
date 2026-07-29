import { useState, type ReactNode } from 'react'

import {
  Alert,
  Badge,
  Button,
  Checkbox,
  Chip,
  Countdown,
  DiscountProductCard,
  Dropdown,
  FilterAccordion,
  Footer,
  Icon,
  IconButton,
  Input,
  Pagination,
  PriceRange,
  ProductCard,
  Rating,
  Skeleton,
  SortBar,
  Switch,
  Textarea,
} from '../components/ui'

const pageSections = [
  ['actions', 'دکمه‌ها'],
  ['forms', 'فرم‌ها'],
  ['feedback', 'وضعیت‌ها'],
  ['commerce', 'کارت محصولات'],
] as const
const categoryOptions = [
  { value: 'pump', label: 'پمپ آب' },
  { value: 'fan', label: 'هواکش' },
  { value: 'motor', label: 'الکتروموتور' },
]
const persianNumberFormatter = new Intl.NumberFormat('fa-IR')

function TestSection({
  id,
  title,
  description,
  children,
}: {
  id: string
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <section
      id={id}
      className="scroll-mt-6 rounded-df-lg border border-border-soft bg-white p-5 shadow-sm sm:p-6"
    >
      <div className="mb-6 border-b border-border-soft pb-4">
        <h2 className="m-0 text-xl font-extrabold text-brand-950">{title}</h2>
        <p className="mb-0 mt-1 text-sm leading-6 text-muted">{description}</p>
      </div>
      {children}
    </section>
  )
}

function ComponentGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-df-md border border-border-soft bg-surface p-4">
      <h3 className="mb-4 mt-0 text-sm font-bold text-brand-950">{title}</h3>
      {children}
    </div>
  )
}

function CategoryDropdownDemo() {
  const [category, setCategory] = useState('pump')

  return (
    <Dropdown
      label="دسته‌بندی"
      value={category}
      onChange={setCategory}
      options={categoryOptions}
    />
  )
}

function FeedbackControlsDemo() {
  const [rating, setRating] = useState(3)
  const [page, setPage] = useState(2)

  return (
    <ComponentGroup title="کنترل‌های داده">
      <div className="grid gap-6">
        <div>
          <p className="mb-2 mt-0 text-xs text-muted">
            امتیاز انتخابی: {persianNumberFormatter.format(rating)}
          </p>
          <Rating value={rating} onChange={setRating} />
        </div>
        <Countdown totalSeconds={318_245} showSeconds />
        <Pagination page={page} pageCount={50} onPageChange={setPage} />
        <div className="flex gap-3">
          <Skeleton className="size-12 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2 pt-1">
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
          </div>
        </div>
      </div>
    </ComponentGroup>
  )
}

function CatalogControlsDemo() {
  const [sortBy, setSortBy] = useState('popular')
  const [priceRange, setPriceRange] = useState<[number, number]>([5_000_000, 65_000_000])

  return (
    <div className="mb-6 grid gap-4">
      <SortBar value={sortBy} onChange={setSortBy} />
      <PriceRange
        className="max-w-lg"
        min={0}
        max={100_000_000}
        step={500_000}
        value={priceRange}
        onChange={setPriceRange}
      />
    </div>
  )
}

export function TestUIKit() {
  return (
    <div className="min-h-screen" dir="rtl">
      <header className="border-b border-border-soft bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-5 sm:px-6">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="m-0 text-2xl font-black text-brand-950">TestUIKit</h1>
              <Badge variant="accent">DigiFan</Badge>
            </div>
            <p className="mb-0 mt-1 text-sm text-muted">صفحه‌ی بررسی سریع کامپوننت‌های واقعی پروژه</p>
          </div>

          <nav aria-label="بخش‌های صفحه" className="flex flex-wrap gap-2">
            {pageSections.map(([id, label]) => (
              <button
                key={id}
                type="button"
                className="rounded-df-sm border border-border-soft bg-surface px-3 py-2 text-xs font-bold text-brand-950 no-underline transition-colors hover:border-brand-950 hover:bg-white"
                onClick={() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })}
              >
                {label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-6 sm:px-6">
        <TestSection
          id="actions"
          title="دکمه‌ها و انتخاب‌ها"
          description="حالت‌های پرکاربرد دکمه، آیکن، برچسب و فیلتر را کنار هم بررسی کنید."
        >
          <div className="grid gap-4 lg:grid-cols-2">
            <ComponentGroup title="دکمه‌ها">
              <div className="flex flex-wrap items-center gap-3">
                <Button>ثبت سفارش</Button>
                <Button variant="secondary">افزودن به سبد</Button>
                <Button variant="outline">انصراف</Button>
                <Button variant="ghost">جزئیات</Button>
                <Button variant="danger">حذف</Button>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <Button size="sm">کوچک</Button>
                <Button loading>در حال ثبت</Button>
                <Button disabled>غیرفعال</Button>
              </div>
            </ComponentGroup>

            <ComponentGroup title="آیکن، وضعیت و فیلتر">
              <div className="flex flex-wrap items-center gap-3">
                <IconButton label="سبد خرید" icon={<Icon name="cart" />} />
                <IconButton selected label="انتخاب‌شده" icon={<Icon name="check" size={18} />} />
                <Badge>جدید</Badge>
                <Badge variant="accent">۱۶٪ تخفیف</Badge>
                <Badge variant="success">موجود</Badge>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Chip selected>همه</Chip>
                <Chip>پمپ آب</Chip>
                <Chip>هواکش</Chip>
                <Chip disabled>غیرفعال</Chip>
              </div>
            </ComponentGroup>
          </div>
        </TestSection>

        <TestSection
          id="forms"
          title="فرم‌ها"
          description="برای آزمایش تبدیل عدد، داخل ورودی اول اعداد 123456 یا ١٢٣٤٥٦ را تایپ کنید."
        >
          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <ComponentGroup title="ورودی‌ها">
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="شماره تماس"
                  inputMode="numeric"
                  placeholder="مثلاً 09121234567"
                  hint="اعداد هنگام تایپ خودکار فارسی می‌شوند."
                />
                <Input label="نام محصول" placeholder="مثلاً پمپ آب" />
                <Input label="کد تخفیف" defaultValue="DIGIFAN" error="این کد معتبر نیست." />
                <CategoryDropdownDemo />
              </div>
              <Textarea
                containerClassName="mt-4"
                label="توضیحات سفارش"
                placeholder="مثلاً تعداد 2 عدد برای طبقه 3..."
              />
            </ComponentGroup>

            <ComponentGroup title="فیلترهای باز و بسته">
              <div className="overflow-hidden rounded-df-sm border-x border-border-soft">
                <FilterAccordion title="نوع هواکش" defaultOpen>
                  <div className="grid gap-3">
                    <Checkbox defaultChecked label="هواکش محوری" />
                    <Checkbox label="هواکش سانتریفیوژ" />
                    <Checkbox label="هواکش سقفی" />
                  </div>
                </FilterAccordion>
                <FilterAccordion title="توان موتور (اسب بخار)">
                  <div className="grid gap-3">
                    <Checkbox label="نیم اسب" />
                    <Checkbox label="یک اسب" />
                    <Checkbox label="دو اسب و بیشتر" />
                  </div>
                </FilterAccordion>
              </div>
              <div className="mt-5 grid gap-4">
                <Switch defaultChecked label="اعلان کاهش قیمت" />
                <Switch label="نمایش قیمت همکاری" />
              </div>
            </ComponentGroup>
          </div>
        </TestSection>

        <TestSection
          id="feedback"
          title="وضعیت‌ها و داده"
          description="پیام سیستم، امتیاز، شمارش معکوس، صفحه‌بندی و حالت بارگذاری."
        >
          <div className="grid gap-4 lg:grid-cols-2">
            <ComponentGroup title="پیام‌ها">
              <div className="grid gap-3">
                <Alert title="اطلاع‌رسانی">قیمت‌ها بر اساس آخرین به‌روزرسانی هستند.</Alert>
                <Alert variant="success" title="به سبد خرید اضافه شد" />
                <Alert variant="warning" title="تنها دو عدد باقی مانده است" />
                <Alert variant="danger" title="پرداخت ناموفق بود" />
              </div>
            </ComponentGroup>

            <FeedbackControlsDemo />
          </div>
        </TestSection>

        <TestSection
          id="commerce"
          title="کارت محصولات"
          description="نمونه‌های اصلی کارت محصول با داده‌های متفاوت و حالت تخفیف."
        >
          <CatalogControlsDemo />
          <div className="overflow-x-auto pb-3">
            <div className="flex min-w-max items-start gap-6 p-1">
              <ProductCard
                isNew
                name="پمپ آب خانگی"
                description="توان ۲ اسب بخار"
                rating={4}
                price="قیمت ۱۸,۹۰۰,۰۰۰ تومان"
              />
              <ProductCard
                name="هواکش صنعتی"
                description="مدل کم‌صدا"
                rating={5}
                price="قیمت ۲۴,۵۰۰,۰۰۰ تومان"
              />
              <DiscountProductCard
                name="پمپ لجن‌کشی WQ"
                description="توان ۲۲ وات"
                discount="۱۶٪"
                currentPrice="۲۸,۶۰۰,۰۰۰ تومان"
                previousPrice="۳۳,۱۸۰,۰۰۰"
                imageAlt="پمپ لجن‌کشی آبی"
              />
            </div>
          </div>
        </TestSection>
      </main>

      <Footer className="mt-2" />
    </div>
  )
}
