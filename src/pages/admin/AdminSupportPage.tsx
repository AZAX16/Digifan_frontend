import {
  CheckCheck,
  CircleAlert,
  Clock3,
  Headphones,
  MessageSquareText,
  Send,
  ShieldCheck,
  Sparkles,
  UserRound,
  type LucideIcon,
} from 'lucide-react'
import { useMemo, useState, type FormEvent } from 'react'

import { Alert, Badge, Button, Surface, Textarea, type BadgeVariant } from '../../components/ui'
import { cn } from '../../utils/cn'
import { toPersianDigits } from '../../utils/persianDigits'
import { AdminShell } from './AdminShell'

type TicketStatus = 'open' | 'waiting' | 'resolved'
type TicketFilter = 'all' | TicketStatus
type TicketPriority = 'urgent' | 'normal'

interface SupportTicket {
  id: string
  customer: string
  subject: string
  summary: string
  time: string
  status: TicketStatus
  priority: TicketPriority
  order?: string
}

interface SupportMetric {
  label: string
  value: string
  description: string
  icon: LucideIcon
}

const supportTickets: SupportTicket[] = [
  {
    id: 'DF-224',
    customer: 'آرمان رضایی',
    subject: 'پرسش درباره گارانتی شرکتی',
    summary: 'آیا این محصول شامل گارانتی شرکتی است؟ لطفاً شرایط استفاده را توضیح دهید.',
    time: '۱۰ دقیقه پیش',
    status: 'open',
    priority: 'urgent',
    order: 'ORD-8492',
  },
  {
    id: 'DF-219',
    customer: 'فاطمه احمدی',
    subject: 'پیگیری وضعیت سفارش',
    summary: 'سفارش من دو روز پیش ثبت شده اما هنوز وضعیت ارسال تغییر نکرده است.',
    time: '۴۵ دقیقه پیش',
    status: 'waiting',
    priority: 'normal',
    order: 'ORD-8471',
  },
  {
    id: 'DF-211',
    customer: 'سارا محمدی',
    subject: 'مشکل در ثبت آدرس جدید',
    summary: 'هنگام ذخیره آدرس، فرم دوباره به صفحه قبل بازمی‌گردد.',
    time: '۲ ساعت پیش',
    status: 'open',
    priority: 'normal',
  },
  {
    id: 'DF-205',
    customer: 'مهدی کاظمی',
    subject: 'درخواست اصلاح فاکتور',
    summary: 'نام شرکت در فاکتور نیاز به اصلاح داشت و نسخه جدید ارسال شد.',
    time: 'دیروز',
    status: 'resolved',
    priority: 'normal',
    order: 'ORD-8398',
  },
  {
    id: 'DF-198',
    customer: 'لیلا اکبری',
    subject: 'راهنمای انتخاب پمپ مناسب',
    summary: 'برای یک ساختمان سه طبقه راهنمای انتخاب مدل مناسب نیاز دارم.',
    time: 'دیروز',
    status: 'resolved',
    priority: 'normal',
  },
]

const filters: { value: TicketFilter; label: string }[] = [
  { value: 'all', label: 'همه تیکت‌ها' },
  { value: 'open', label: 'باز' },
  { value: 'waiting', label: 'در انتظار' },
  { value: 'resolved', label: 'حل‌شده' },
]

const supportMetrics: SupportMetric[] = [
  { label: 'تیکت‌های باز', value: '۲', description: 'نیازمند پاسخ مدیر', icon: MessageSquareText },
  { label: 'فوری', value: '۱', description: 'اولویت پاسخ بالا', icon: CircleAlert },
  { label: 'میانگین پاسخ', value: '۲۱ دقیقه', description: 'در نسخه نمایشی', icon: Clock3 },
  { label: 'حل‌شده امروز', value: '۲', description: 'پاسخ تکمیل‌شده', icon: CheckCheck },
]

function getStatusDetails(status: TicketStatus): { label: string; variant: BadgeVariant } {
  if (status === 'open') return { label: 'باز', variant: 'danger' }
  if (status === 'waiting') return { label: 'در انتظار', variant: 'accent' }

  return { label: 'حل‌شده', variant: 'success' }
}

export function AdminSupportPage() {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<TicketFilter>('all')
  const [selectedTicketId, setSelectedTicketId] = useState(supportTickets[0].id)
  const [reply, setReply] = useState('')
  const [feedback, setFeedback] = useState<string | null>(null)

  const filteredTickets = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('fa')

    return supportTickets.filter((ticket) => {
      const matchesFilter = filter === 'all' || ticket.status === filter
      const matchesQuery = !normalizedQuery || [
        ticket.id,
        ticket.customer,
        ticket.subject,
        ticket.summary,
        ticket.order ?? '',
      ].some((value) => value.toLocaleLowerCase('fa').includes(normalizedQuery))

      return matchesFilter && matchesQuery
    })
  }, [filter, query])

  const selectedTicket =
    filteredTickets.find((ticket) => ticket.id === selectedTicketId) ?? filteredTickets[0] ?? null

  const handleReply = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!reply.trim() || !selectedTicket) return

    setReply('')
    setFeedback(`پاسخ تیکت ${selectedTicket.id} به‌صورت نمایشی ثبت شد.`)
  }

  return (
    <AdminShell
      activeSection="support"
      search={{
        value: query,
        placeholder: 'جستجو در تیکت‌ها…',
        onChange: setQuery,
        onSubmit: setQuery,
      }}
    >
      <main className="px-4 pb-10 pt-5 sm:px-6 lg:px-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="m-0 text-2xl font-bold text-[#191c1e]">مرکز پشتیبانی</h1>
              <Badge variant="neutral">نسخه نمایشی</Badge>
            </div>
            <p className="mb-0 mt-2 text-sm text-[#5b5f62]">مدیریت گفتگوها و درخواست‌های مشتریان در یک نمای یکپارچه</p>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-[#c4c7ca] bg-white px-3 py-2 text-xs font-bold text-[#293647]">
            <ShieldCheck aria-hidden="true" size={18} />
            اطلاعات این صفحه mock است و در backend ذخیره نمی‌شود
          </div>
        </div>

        <section aria-label="خلاصه پشتیبانی" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {supportMetrics.map((metric) => {
            const Icon = metric.icon

            return (
              <Surface key={metric.label} className="!rounded-xl !border-[#293647] !bg-white !p-4" elevation="flat" padding="none">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="m-0 text-sm font-semibold text-[#5b5f62]">{metric.label}</p>
                    <p className="mb-0 mt-2 text-2xl font-bold text-[#191c1e]">{metric.value}</p>
                    <p className="mb-0 mt-1 text-xs text-[#5b5f62]">{metric.description}</p>
                  </div>
                  <span className="flex size-11 items-center justify-center rounded-lg bg-[#e1e3e4] text-[#293647]">
                    <Icon aria-hidden="true" size={20} />
                  </span>
                </div>
              </Surface>
            )
          })}
        </section>

        {feedback && (
          <Alert className="mt-5" live title={feedback} variant="success">
            برای ارسال واقعی پاسخ، endpoint پشتیبانی باید به OpenAPI اضافه شود.
          </Alert>
        )}

        <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]" dir="ltr">
          <Surface className="overflow-hidden !rounded-xl !border-[#293647] !bg-white !p-0" dir="rtl" elevation="flat" padding="none">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e0e3e5] bg-[#f7f9fb] px-4 py-4">
              <div>
                <h2 className="m-0 text-lg font-bold text-[#191c1e]">صندوق تیکت‌ها</h2>
                <p className="mb-0 mt-1 text-xs text-[#5b5f62]">{toPersianDigits(String(filteredTickets.length))} گفتگو نمایش داده می‌شود</p>
              </div>
              <div className="flex flex-wrap gap-2" role="group" aria-label="فیلتر وضعیت تیکت">
                {filters.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={filter === option.value}
                    className={cn(
                      'cursor-pointer rounded-lg border px-3 py-1.5 text-xs font-bold transition-colors',
                      filter === option.value
                        ? 'border-[#293647] bg-[#293647] text-white'
                        : 'border-[#c4c7ca] bg-white text-[#293647] hover:bg-[#eceef0]',
                    )}
                    onClick={() => setFilter(option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {filteredTickets.length ? (
              <div className="divide-y divide-[#e0e3e5]">
                {filteredTickets.map((ticket) => {
                  const statusDetails = getStatusDetails(ticket.status)
                  const isSelected = selectedTicket?.id === ticket.id

                  return (
                    <button
                      key={ticket.id}
                      type="button"
                      aria-pressed={isSelected}
                      className={cn(
                        'relative flex w-full cursor-pointer items-start gap-3 px-4 py-4 text-right transition-colors',
                        isSelected ? 'bg-[#f2f4f6]' : 'bg-white hover:bg-[#f7f9fb]',
                      )}
                      onClick={() => {
                        setSelectedTicketId(ticket.id)
                        setReply('')
                        setFeedback(null)
                      }}
                    >
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#e1e3e4] text-[#293647]">
                        <UserRound aria-hidden="true" size={19} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center justify-between gap-2">
                          <strong className="text-sm text-[#191c1e]">{ticket.subject}</strong>
                          <span className="text-[11px] text-[#5b5f62]">{ticket.time}</span>
                        </span>
                        <span className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[#5b5f62]">
                          <span>{ticket.customer}</span>
                          <span dir="ltr">#{ticket.id}</span>
                          {ticket.order && <span dir="ltr">{ticket.order}</span>}
                        </span>
                        <span className="mt-2 line-clamp-1 block text-sm text-[#5b5f62]">{ticket.summary}</span>
                        <span className="mt-3 flex items-center gap-2">
                          <Badge variant={statusDetails.variant}>{statusDetails.label}</Badge>
                          {ticket.priority === 'urgent' && <Badge variant="danger">فوری</Badge>}
                        </span>
                      </span>
                      {isSelected && <span aria-hidden="true" className="absolute inset-y-3 right-0 w-1 rounded-l-full bg-[#293647]" />}
                    </button>
                  )
                })}
              </div>
            ) : (
              <div className="p-12 text-center">
                <Sparkles aria-hidden="true" className="mx-auto text-[#293647]" size={30} />
                <p className="mb-0 mt-3 font-bold text-[#191c1e]">تیکتی با این فیلتر پیدا نشد</p>
                <p className="mb-0 mt-1 text-sm text-[#5b5f62]">عبارت جستجو یا وضعیت را تغییر دهید.</p>
              </div>
            )}
          </Surface>

          <Surface className="!rounded-xl !border-[#293647] !bg-white !p-0 lg:sticky lg:top-24" dir="rtl" elevation="flat" padding="none">
            {selectedTicket ? (
              <>
                <div className="border-b border-[#e0e3e5] bg-[#f7f9fb] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="m-0 text-xs text-[#5b5f62]" dir="ltr">#{selectedTicket.id}</p>
                      <h2 className="mb-0 mt-1 text-lg font-bold text-[#191c1e]">{selectedTicket.subject}</h2>
                    </div>
                    <Headphones aria-hidden="true" className="text-[#293647]" size={24} />
                  </div>
                </div>
                <div className="p-4">
                  <div className="rounded-lg border border-[#e0e3e5] bg-[#f7f9fb] p-3">
                    <div className="flex items-center justify-between gap-2">
                      <strong className="text-sm text-[#191c1e]">{selectedTicket.customer}</strong>
                      <span className="text-[11px] text-[#5b5f62]">{selectedTicket.time}</span>
                    </div>
                    <p className="mb-0 mt-3 text-sm leading-7 text-[#5b5f62]">{selectedTicket.summary}</p>
                  </div>
                  <form className="mt-4 grid gap-3" onSubmit={handleReply}>
                    <Textarea
                      required
                      label="پاسخ مدیر"
                      placeholder="پاسخ خود را بنویسید…"
                      value={reply}
                      onChange={(event) => setReply(event.target.value)}
                    />
                    <Button fullWidth leadingIcon={<Send aria-hidden="true" size={17} />} type="submit">
                      ثبت پاسخ نمایشی
                    </Button>
                  </form>
                </div>
              </>
            ) : (
              <div className="p-10 text-center text-sm text-[#5b5f62]">یک تیکت را برای مشاهده جزئیات انتخاب کنید.</div>
            )}
          </Surface>
        </div>
      </main>
    </AdminShell>
  )
}
