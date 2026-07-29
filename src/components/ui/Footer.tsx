import { cn } from '../../utils/cn'

export interface FooterColumn {
  title: string
  links: { label: string; href: string }[]
}

export interface FooterProps {
  columns?: FooterColumn[]
  className?: string
}

const defaultColumns: FooterColumn[] = [
  {
    title: 'محصولات',
    links: [
      'محصولات جدید',
      'محصولات پرفروش',
      'محصولات پربازدید',
      'محصولات موجود',
      'محصولات محبوب',
      'محصولات تخفیف‌دار',
      'محصولات با ارسال رایگان',
    ].map((label) => ({ label, href: '#/ui-kit' })),
  },
  {
    title: 'اطلاعات',
    links: [
      'نحوه سفارش',
      'انتقادات و پیشنهادات',
      'قوانین و مقررات',
      'روش‌های پرداخت',
      'روش‌های ارسال',
      'رویه‌های بازگرداندن کالا',
    ].map((label) => ({ label, href: '#/ui-kit' })),
  },
]

export function Footer({ columns = defaultColumns, className }: FooterProps) {
  return (
    <footer className={cn('bg-brand-800 px-6 py-10 text-white', className)} dir="rtl">
      <div className="mx-auto grid max-w-5xl gap-10 sm:grid-cols-2 sm:justify-items-center">
        {columns.map((column) => (
          <section key={column.title} className="w-full max-w-[240px] text-right">
            <h2 className="mb-5 text-xl font-bold">{column.title}</h2>
            <ul className="m-0 grid list-none gap-3 p-0">
              {column.links.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-base font-medium text-white no-underline transition-opacity hover:opacity-70"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </footer>
  )
}
