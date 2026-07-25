import { useState } from 'react'

import {
  Alert,
  Badge,
  Button,
  Checkbox,
  Chip,
  Countdown,
  DiscountProductCard,
  Footer,
  Icon,
  IconButton,
  Input,
  Pagination,
  ProductCard,
  Rating,
  Select,
  Skeleton,
  Surface,
  Switch,
  Textarea,
} from '../components/ui'

const sections = [
  ['foundation', 'پایه‌ها'],
  ['actions', 'دکمه‌ها'],
  ['forms', 'فرم‌ها'],
  ['feedback', 'بازخورد'],
  ['commerce', 'فروشگاه'],
] as const

const swatches = [
  { name: 'Brand 950', value: '#203848' },
  { name: 'Brand 900', value: '#25374B' },
  { name: 'Brand 800', value: '#293647' },
  { name: 'Accent 500', value: '#F88B24' },
  { name: 'Success 600', value: '#16865C' },
  { name: 'Danger 600', value: '#C93838' },
  { name: 'Warning 400', value: '#FFD600' },
  { name: 'Surface', value: '#F9F9F9' },
]

interface ShowcaseSectionProps {
  id: string
  eyebrow: string
  title: string
  description: string
  children: React.ReactNode
}

function ShowcaseSection({
  id,
  eyebrow,
  title,
  description,
  children,
}: ShowcaseSectionProps) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-border-soft py-12">
      <div className="mb-8 max-w-2xl">
        <p className="mb-2 text-xs font-bold tracking-[0.16em] text-accent-500 uppercase">
          {eyebrow}
        </p>
        <h2 className="m-0 text-2xl font-extrabold text-brand-950 sm:text-3xl">{title}</h2>
        <p className="mt-2 text-sm leading-7 text-muted">{description}</p>
      </div>
      {children}
    </section>
  )
}

function DemoGroup({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <Surface className="min-w-0" elevation="flat" padding="md">
      <h3 className="mb-5 mt-0 text-sm font-bold text-brand-950">{title}</h3>
      {children}
    </Surface>
  )
}

export function TestUIKit() {
  const [rating, setRating] = useState(3)
  const [page, setPage] = useState(2)

  return (
    <div className="min-h-screen" dir="rtl">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-brand-950/95 text-white shadow-lg backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-3 sm:px-6">
          <div>
            <p className="m-0 text-lg font-black">DigiFan</p>
            <p className="m-0 text-[11px] text-white/60">TestUIKit · نسخه ۰.۱</p>
          </div>
          <nav aria-label="بخش‌های رابط کاربری" className="hidden items-center gap-1 md:flex">
            {sections.map(([id, label]) => (
              <a
                key={id}
                href={`#${id}`}
                className="rounded-df-sm px-3 py-2 text-xs font-medium text-white/75 no-underline transition-colors hover:bg-white/10 hover:text-white"
              >
                {label}
              </a>
            ))}
          </nav>
          <Badge variant="accent">RTL</Badge>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6">
        <section className="grid min-h-[420px] items-center gap-10 py-16 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <Badge className="mb-5">رابط کاربری پروژه</Badge>
            <h1 className="m-0 max-w-3xl text-4xl font-black leading-[1.35] text-brand-950 sm:text-6xl">
              کتابخانه زنده‌ی اجزای <span className="text-accent-500">دیجی‌فن</span>
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-muted">
              مرجع توسعه و بررسی بصری کامپوننت‌ها، حالت‌ها، توکن‌ها و الگوهای فروشگاهی.
              هر جزء این صفحه از همان APIای استفاده می‌کند که صفحات محصول استفاده خواهند کرد.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button onClick={() => document.getElementById('foundation')?.scrollIntoView()}>
                مشاهده اجزا
              </Button>
              <Button variant="outline" onClick={() => document.getElementById('commerce')?.scrollIntoView()}>
                کارت‌های فیگما
              </Button>
            </div>
          </div>
          <Surface elevation="raised" className="relative overflow-hidden">
            <div className="absolute -left-12 -top-12 size-40 rounded-full bg-accent-500/12" />
            <div className="relative grid grid-cols-2 gap-4">
              <div className="rounded-df-md bg-brand-950 p-5 text-white">
                <p className="m-0 text-3xl font-black">+۲۰</p>
                <p className="mb-0 mt-1 text-xs text-white/65">کامپوننت و الگو</p>
              </div>
              <div className="rounded-df-md bg-accent-500 p-5 text-white">
                <p className="m-0 text-3xl font-black">RTL</p>
                <p className="mb-0 mt-1 text-xs text-white/75">فارسی از پایه</p>
              </div>
              <div className="col-span-2 rounded-df-md border border-border-soft bg-white p-5">
                <p className="m-0 text-sm font-bold text-brand-950">منبع طراحی</p>
                <p className="mb-0 mt-1 text-xs leading-6 text-muted">
                  توکن‌های پروژه و کامپوننت‌های فروشگاهی از فایل Figma دیجی‌فن استخراج شده‌اند.
                </p>
              </div>
            </div>
          </Surface>
        </section>

        <ShowcaseSection
          id="foundation"
          eyebrow="Foundation"
          title="پایه‌ها و هویت بصری"
          description="رنگ، تایپوگرافی، آیکن، شعاع و سطوح؛ مقادیر مشترکی که تمام اجزا باید از آن‌ها استفاده کنند."
        >
          <div className="grid gap-5 lg:grid-cols-2">
            <DemoGroup title="رنگ‌ها">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {swatches.map((swatch) => (
                  <div key={swatch.name} className="overflow-hidden rounded-df-md border border-border-soft">
                    <div className="h-16" style={{ background: swatch.value }} />
                    <div className="bg-white p-2.5" dir="ltr">
                      <p className="m-0 text-[11px] font-bold text-ink">{swatch.name}</p>
                      <code className="text-[10px] text-muted">{swatch.value}</code>
                    </div>
                  </div>
                ))}
              </div>
            </DemoGroup>

            <DemoGroup title="تایپوگرافی Vazirmatn">
              <div className="grid gap-4">
                <div>
                  <span className="text-[10px] text-muted">Display · 36 / Black</span>
                  <p className="m-0 text-4xl font-black text-brand-950">دیجی‌فن، انتخاب حرفه‌ای</p>
                </div>
                <div>
                  <span className="text-[10px] text-muted">Heading · 24 / Bold</span>
                  <p className="m-0 text-2xl font-bold">تجهیزات صنعتی و تخصصی</p>
                </div>
                <div>
                  <span className="text-[10px] text-muted">Body · 14 / Medium</span>
                  <p className="m-0 text-sm leading-7 text-muted">
                    راهنمای انتخاب، مقایسه و خرید مطمئن محصولات با پشتیبانی تخصصی.
                  </p>
                </div>
                <p className="m-0 text-2xl font-semibold" dir="ltr">۰ ۱ ۲ ۳ ۴ ۵ ۶ ۷ ۸ ۹</p>
              </div>
            </DemoGroup>

            <DemoGroup title="آیکن‌های استخراج‌شده از Figma">
              <div className="flex flex-wrap items-center gap-5">
                {(['cart', 'photo', 'check', 'star'] as const).map((name) => (
                  <div key={name} className="grid justify-items-center gap-2">
                    <span className="flex size-12 items-center justify-center rounded-df-md bg-canvas text-brand-950">
                      <Icon name={name} size={24} tone="var(--df-brand-950)" />
                    </span>
                    <code className="text-[10px] text-muted">{name}</code>
                  </div>
                ))}
              </div>
            </DemoGroup>

            <DemoGroup title="سطوح و سایه‌ها">
              <div className="grid grid-cols-3 gap-3 text-center text-xs">
                <Surface padding="sm">Flat</Surface>
                <Surface elevation="raised" padding="sm">Raised</Surface>
                <Surface elevation="card" padding="sm">Card</Surface>
              </div>
            </DemoGroup>
          </div>
        </ShowcaseSection>

        <ShowcaseSection
          id="actions"
          eyebrow="Actions"
          title="اکشن‌ها و انتخاب‌ها"
          description="تمام حالت‌های اصلی، ثانویه، خنثی، خطر، در حال بارگذاری و غیرفعال."
        >
          <div className="grid gap-5 lg:grid-cols-2">
            <DemoGroup title="Button variants">
              <div className="flex flex-wrap items-center gap-3">
                <Button>دکمه اصلی</Button>
                <Button variant="secondary">دکمه تأکیدی</Button>
                <Button variant="outline">دکمه خطی</Button>
                <Button variant="ghost">دکمه ساده</Button>
                <Button variant="danger">حذف کردن</Button>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <Button size="sm">کوچک</Button>
                <Button size="md">متوسط</Button>
                <Button size="lg">بزرگ</Button>
                <Button loading>در حال ثبت</Button>
                <Button disabled>غیرفعال</Button>
              </div>
            </DemoGroup>

            <DemoGroup title="IconButton, Badge & Chip">
              <div className="flex flex-wrap items-center gap-3">
                <IconButton label="سبد خرید" icon={<Icon name="cart" size={20} />} />
                <IconButton selected label="انتخاب‌شده" icon={<Icon name="check" size={18} />} />
                <IconButton disabled label="غیرفعال" icon={<Icon name="photo" size={18} />} />
              </div>
              <div className="mt-5 flex flex-wrap items-center gap-2">
                <Badge>جدید</Badge>
                <Badge variant="accent">۱۶٪ تخفیف</Badge>
                <Badge variant="neutral">موجود</Badge>
                <Badge variant="success">ارسال رایگان</Badge>
                <Badge variant="danger">ناموجود</Badge>
              </div>
              <div className="mt-5 flex flex-wrap items-center gap-2">
                <Chip selected>همه محصولات</Chip>
                <Chip>پمپ آب</Chip>
                <Chip>الکتروموتور</Chip>
                <Chip disabled>غیرفعال</Chip>
              </div>
            </DemoGroup>
          </div>
        </ShowcaseSection>

        <ShowcaseSection
          id="forms"
          eyebrow="Forms"
          title="ورودی‌ها و کنترل‌های فرم"
          description="کنترل‌های قابل دسترس با برچسب، راهنما، خطا، حالت غیرفعال و رفتار صحیح RTL."
        >
          <div className="grid gap-5 lg:grid-cols-2">
            <DemoGroup title="Text fields">
              <div className="grid gap-5 sm:grid-cols-2">
                <Input label="نام محصول" placeholder="مثلاً پمپ آب" />
                <Input label="جستجو" placeholder="جستجو در محصولات..." />
                <Input label="شماره تماس" defaultValue="۰۹۱۲۱۲۳۴۵۶۷" hint="شماره همراه خریدار" />
                <Input label="کد تخفیف" defaultValue="DIGIFAN" error="این کد منقضی شده است" />
                <Select label="دسته‌بندی" defaultValue="pump">
                  <option value="pump">پمپ آب</option>
                  <option value="fan">هواکش</option>
                  <option value="motor">الکتروموتور</option>
                </Select>
                <Input label="غیرفعال" disabled defaultValue="قابل ویرایش نیست" />
              </div>
              <Textarea className="mt-5" label="توضیحات سفارش" placeholder="توضیحات تکمیلی را وارد کنید..." />
            </DemoGroup>

            <DemoGroup title="Selection controls">
              <div className="grid gap-5">
                <Checkbox label="فقط کالاهای موجود" description="محصولات ناموجود نمایش داده نشوند" />
                <Checkbox defaultChecked label="ارسال رایگان" />
                <Checkbox disabled label="گزینه غیرفعال" />
                <div className="h-px bg-border-soft" />
                <Switch defaultChecked label="اعلان کاهش قیمت" description="پس از تغییر قیمت به شما اطلاع می‌دهیم" />
                <Switch label="نمایش قیمت همکاری" />
                <Switch disabled label="تنظیم غیرفعال" />
              </div>
            </DemoGroup>
          </div>
        </ShowcaseSection>

        <ShowcaseSection
          id="feedback"
          eyebrow="Feedback & Data"
          title="بازخورد، وضعیت و داده"
          description="پیام‌های وضعیت، بارگذاری، امتیاز تعاملی، شمارش معکوس و صفحه‌بندی."
        >
          <div className="grid gap-5 lg:grid-cols-2">
            <DemoGroup title="Alerts">
              <div className="grid gap-3">
                <Alert title="اطلاع‌رسانی">قیمت‌ها بر اساس آخرین به‌روزرسانی فروشنده هستند.</Alert>
                <Alert variant="success" title="به سبد خرید اضافه شد" />
                <Alert variant="warning" title="تنها دو عدد باقی مانده است" />
                <Alert variant="danger" title="پرداخت ناموفق بود">لطفاً دوباره تلاش کنید.</Alert>
              </div>
            </DemoGroup>

            <DemoGroup title="Rating, Countdown & Pagination">
              <div className="grid gap-6">
                <div>
                  <p className="mb-2 mt-0 text-xs text-muted">امتیاز تعاملی: {rating.toLocaleString('fa-IR')}</p>
                  <Rating value={rating} onChange={setRating} />
                </div>
                <Countdown days="۰۳" hours="۱۶" minutes="۲۳" />
                <Pagination page={page} pageCount={5} onPageChange={setPage} />
              </div>
            </DemoGroup>

            <DemoGroup title="Loading skeletons">
              <div className="flex gap-4">
                <Skeleton className="size-16 shrink-0 rounded-full" />
                <div className="flex-1 space-y-3">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-4/5" />
                </div>
              </div>
            </DemoGroup>
          </div>
        </ShowcaseSection>

        <ShowcaseSection
          id="commerce"
          eyebrow="Commerce"
          title="کامپوننت‌های فروشگاهی Figma"
          description="کارت‌های ۲۹۰×۳۵۵ و ۳۰۸×۲۹۶ بر اساس فریم‌های مستقل فایل DigiFan، با API داده‌محور و اکشن‌های واقعی."
        >
          <div className="overflow-x-auto pb-8">
            <div className="flex min-w-max items-start gap-8 px-1 py-3">
              <ProductCard
                isNew
                name="نام محصول"
                description="اطلاعات کلی"
                rating={3}
                price="قیمت ۲۴,۵۰۰,۰۰۰ تومان"
              />
              <ProductCard
                name="پمپ آب خانگی"
                description="توان ۲ اسب بخار"
                rating={5}
                price="قیمت ۱۸,۹۰۰,۰۰۰ تومان"
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
        </ShowcaseSection>
      </main>

      <Footer className="mt-8" />
    </div>
  )
}
