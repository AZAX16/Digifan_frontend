import {
  Archive,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Info,
  PackagePlus,
  PencilLine,
  UploadCloud,
  X,
} from 'lucide-react'
import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from 'react'

import { getBrands, type Brand } from '../../api/brands'
import { getCategories, type Category } from '../../api/categories'
import { ApiError } from '../../api/client'
import {
  importProductsWorkbook,
  type ProductWorkbookImportResult,
} from '../../api/productImports'
import { useAuth } from '../../components/auth/authContext'
import { ADMIN_PERMISSIONS, hasAdminPermission } from '../../components/auth/adminPermissions'
import { Alert, Button, Checkbox, Dropdown, Surface } from '../../components/ui'
import { useDialogLifecycle } from '../../hooks/useDialogLifecycle'
import { cn } from '../../utils/cn'
import { toPersianDigits } from '../../utils/persianDigits'

const ProductEditorDialog = lazy(() =>
  import('./ProductEditorDialog').then((module) => ({ default: module.ProductEditorDialog })),
)

type ProductCreationMode = 'excel' | 'manual'
type Feedback = { variant: 'success' | 'danger' | 'warning'; title: string } | null

const TEMPLATE_URL = '/downloads/fanino-product-import-template.xlsx'
const RULES_ACCEPTED_STORAGE_KEY = 'digifan.product-import.rules-accepted.v1'
const workbookStatuses = [
  { label: 'فعال', description: 'محصول فعال و قابل نمایش' },
  { label: 'غیرفعال', description: 'محصول ثبت‌شده ولی غیرفعال' },
  { label: 'ناموجود', description: 'محصول بدون موجودی قابل فروش' },
  { label: 'توقف', description: 'محصول متوقف‌شده' },
  { label: 'بایگانی', description: 'خارج از چرخه انتشار' },
  { label: 'پیش‌نویس', description: 'ذخیره بدون انتشار' },
  { label: 'پاک‌کردن', description: 'حذف رکورد موجود' },
] as const
const resultItems: {
  key: keyof ProductWorkbookImportResult
  label: string
  className: string
}[] = [
  { key: 'created', label: 'ایجادشده', className: 'bg-[#edf9f4] text-[#0e6948]' },
  { key: 'updated', label: 'به‌روزشده', className: 'bg-[#edf7fc] text-brand-950' },
  { key: 'archived', label: 'بایگانی‌شده', className: 'bg-[#f3f4f5] text-[#4e5968]' },
  { key: 'deleted', label: 'حذف‌شده', className: 'bg-[#fff1f1] text-[#922b2b]' },
  { key: 'unchanged', label: 'بدون تغییر', className: 'bg-[#fff8e9] text-[#825313]' },
]
const fileSizeFormatter = new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 1 })

function getStoredRulesAcceptance() {
  try {
    return window.sessionStorage.getItem(RULES_ACCEPTED_STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

function storeRulesAcceptance() {
  try {
    window.sessionStorage.setItem(RULES_ACCEPTED_STORAGE_KEY, 'true')
  } catch {
    // The current page can still retain acceptance when session storage is unavailable.
  }
}

function getInitialMode(): ProductCreationMode {
  const queryString = window.location.hash.split('?')[1] ?? ''

  return new URLSearchParams(queryString).get('mode') === 'manual' ? 'manual' : 'excel'
}

function updateModeHash(mode: ProductCreationMode) {
  window.history.replaceState(null, '', `#/categories?view=product-import&mode=${mode}`)
}

function getErrorMessage(error: unknown) {
  return error instanceof ApiError ? error.message : 'خطای پیش‌بینی‌نشده‌ای رخ داد.'
}

function getCategoryLabel(category: Category) {
  const name = category.name?.trim()

  return name?.length ? name : 'دسته‌بندی اصلی بدون نام'
}

function formatFileSize(size: number) {
  if (size < 1024) return `${toPersianDigits(String(size))} بایت`
  if (size < 1024 * 1024) return `${fileSizeFormatter.format(size / 1024)} کیلوبایت`

  return `${fileSizeFormatter.format(size / (1024 * 1024))} مگابایت`
}

function RulesContent() {
  return (
    <div className="grid gap-5 text-sm leading-7 text-[#3f4854]">
      <ol className="m-0 grid list-decimal gap-3 pr-5 marker:font-black marker:text-accent-500">
        <li>
          ساختار فایل ثابت است؛ <strong className="text-ink">افزودن، حذف، جابه‌جایی یا تغییر نام ستون‌های اصلی مجاز نیست.</strong>
        </li>
        <li>
          برای ثبت تصویر، URL عمومی تصویر را در ستون «عکس‌ها» قرار دهید. URL اول تصویر اصلی و URLهای اضافه در همان خانه، تصاویر ثانویه محصول هستند؛ URLها را با علامت <strong className="text-ink">;</strong> از هم جدا کنید.
        </li>
        <li>
          برای حذف یک رکورد موجود، مقدار ستون «وضعیت» همان ردیف را دقیقاً به <strong className="text-danger-600">«پاک‌کردن»</strong> تغییر دهید.
        </li>
        <li>
          فقط عنوان ستون‌های «ویژگی اول» تا «ویژگی یازدهم» قابل تغییر است و هر محصول حداکثر می‌تواند <strong className="text-ink">۱۱ ویژگی</strong> داشته باشد.
        </li>
        <li>
          برای هر دسته‌بندی اصلی یک فایل جدا بارگذاری کنید؛ تعداد دسته‌بندی‌های اصلی محدودیتی برای تعداد فایل‌ها ایجاد نمی‌کند.
        </li>
        <li>
          مقادیر ستون «وضعیت» باید دقیقاً یکی از برچسب‌های تعریف‌شده پایین باشد. فاصله یا املای برچسب‌ها را تغییر ندهید.
        </li>
        <li>
          فایل نمونه با فرمت <strong className="text-ink">.xlsx</strong> دانلود می‌شود؛ پس از تکمیل اطلاعات، همان فایل را برای ثبت نهایی بارگذاری کنید.
        </li>
      </ol>

      <div>
        <p className="mb-2 mt-0 font-black text-ink">برچسب‌های مجاز ستون وضعیت</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {workbookStatuses.map((status) => (
            <div
              key={status.label}
              className="flex items-center justify-between gap-3 rounded-lg border border-border-soft bg-[#f8f9fa] px-3 py-2"
            >
              <span className="font-black text-brand-950">{status.label}</span>
              <span className="text-xs text-muted">{status.description}</span>
            </div>
          ))}
        </div>
      </div>

      <a
        className="inline-flex min-h-11 w-fit items-center justify-center gap-2 rounded-lg bg-accent-500 px-4 font-black text-brand-950 shadow-[0_4px_10px_rgba(255,132,26,0.24)] transition-colors hover:bg-[#ff9d45] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500"
        download="دسته بندی.xlsx"
        href={TEMPLATE_URL}
      >
        <Download aria-hidden="true" size={18} />
        دانلود فایل نمونه اکسل
      </a>
    </div>
  )
}

interface RulesDialogProps {
  accepted: boolean
  onAccept: () => void
  onClose: () => void
}

function RulesDialog({ accepted, onAccept, onClose }: RulesDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const [confirmed, setConfirmed] = useState(accepted)

  useDialogLifecycle(dialogRef, onClose)

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-brand-950/55 p-3 backdrop-blur-sm sm:p-6"
      dir="rtl"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="excel-rules-title"
        className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-white/30 bg-white shadow-[0_24px_80px_rgba(16,34,48,0.35)]"
        tabIndex={-1}
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-border-soft bg-white/95 px-4 py-4 backdrop-blur sm:px-6">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-accent-500">
              <FileSpreadsheet aria-hidden="true" size={24} />
            </span>
            <div>
              <h2 id="excel-rules-title" className="m-0 text-lg font-black text-brand-950 sm:text-xl">
                قوانین افزودن محصول با فایل اکسل
              </h2>
              <p className="mb-0 mt-1 text-xs text-muted">پیش از بارگذاری، ساختار فایل و برچسب‌ها را بررسی کنید.</p>
            </div>
          </div>
          <button
            type="button"
            aria-label="بستن قوانین"
            className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-muted transition-colors hover:bg-[#f0f1f2] hover:text-ink focus-visible:outline-2 focus-visible:outline-accent-500"
            onClick={onClose}
          >
            <X aria-hidden="true" size={20} />
          </button>
        </div>

        <div className="p-4 sm:p-6">
          <RulesContent />
          <div className="mt-6 rounded-xl border-2 border-orange-200 bg-orange-50 p-4">
            <Checkbox
              checked={confirmed}
              data-dialog-initial-focus
              label="قوانین و محدودیت‌های بالا را مطالعه کردم و می‌پذیرم."
              description="تا پیش از تأیید قوانین، انتخاب و ارسال فایل فعال نمی‌شود."
              onChange={(event) => setConfirmed(event.target.checked)}
            />
          </div>
          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="ghost" onClick={onClose}>فعلاً نه</Button>
            <Button
              disabled={!confirmed}
              leadingIcon={<CheckCircle2 aria-hidden="true" size={18} />}
              variant="secondary"
              onClick={onAccept}
            >
              تأیید و ادامه
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function ProductImportPanel() {
  const { profile } = useAuth()
  const canManageCategories = hasAdminPermission(profile, ADMIN_PERMISSIONS.manageCategories)
  const canManageBrands = hasAdminPermission(profile, ADMIN_PERMISSIONS.manageBrands)
  const [mode, setMode] = useState<ProductCreationMode>(getInitialMode)
  const [categories, setCategories] = useState<Category[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [categoriesResolved, setCategoriesResolved] = useState(false)
  const [brandsResolved, setBrandsResolved] = useState(false)
  const [rulesAccepted, setRulesAccepted] = useState(getStoredRulesAcceptance)
  const [showRules, setShowRules] = useState(false)
  const [selectedCategoryId, setSelectedCategoryId] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [feedback, setFeedback] = useState<Feedback>(null)
  const [result, setResult] = useState<ProductWorkbookImportResult | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const canUseManualEditor = canManageCategories && canManageBrands
  const categoriesLoading = canManageCategories && !categoriesResolved
  const brandsLoading = mode === 'manual' && canManageBrands && !brandsResolved

  useEffect(() => {
    if (!canManageCategories) return

    const abortController = new AbortController()
    let isActive = true

    void getCategories(abortController.signal)
      .then((nextCategories) => {
        if (isActive) setCategories(nextCategories)
      })
      .catch((error: unknown) => {
        if (!isActive || (error instanceof DOMException && error.name === 'AbortError')) return
        setFeedback({ variant: 'danger', title: getErrorMessage(error) })
      })
      .finally(() => {
        if (isActive) setCategoriesResolved(true)
      })

    return () => {
      isActive = false
      abortController.abort()
    }
  }, [canManageCategories])

  useEffect(() => {
    if (mode !== 'manual' || !canManageBrands || brandsResolved) return

    const abortController = new AbortController()
    let isActive = true

    void getBrands(abortController.signal)
      .then((nextBrands) => {
        if (isActive) setBrands(nextBrands)
      })
      .catch((error: unknown) => {
        if (!isActive || (error instanceof DOMException && error.name === 'AbortError')) return
        setFeedback({ variant: 'danger', title: getErrorMessage(error) })
      })
      .finally(() => {
        if (isActive) setBrandsResolved(true)
      })

    return () => {
      isActive = false
      abortController.abort()
    }
  }, [brandsResolved, canManageBrands, mode])

  const mainCategories = useMemo(
    () => categories.filter((category) => category.parentCategoryId === null),
    [categories],
  )
  const categoryOptions = useMemo(
    () => mainCategories.map((category) => ({ value: category.id, label: getCategoryLabel(category) })),
    [mainCategories],
  )

  const selectWorkbook = useCallback((file: File | null) => {
    setResult(null)

    if (!file) {
      setSelectedFile(null)
      return
    }
    if (!file.name.toLocaleLowerCase('en-US').endsWith('.xlsx')) {
      setSelectedFile(null)
      setFeedback({ variant: 'danger', title: 'فقط فایل اکسل با پسوند .xlsx قابل ارسال است.' })
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }
    if (file.size === 0) {
      setSelectedFile(null)
      setFeedback({ variant: 'danger', title: 'فایل انتخاب‌شده خالی است.' })
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    setFeedback(null)
    setSelectedFile(file)
  }, [])

  const handleModeChange = (nextMode: ProductCreationMode) => {
    setMode(nextMode)
    setFeedback(null)
    updateModeHash(nextMode)

    if (nextMode === 'excel' && !rulesAccepted) setShowRules(true)
  }

  const handleFileInput = (event: ChangeEvent<HTMLInputElement>) => {
    selectWorkbook(event.target.files?.[0] ?? null)
  }

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault()
    setIsDragging(false)
    if (!rulesAccepted || isUploading) return

    selectWorkbook(event.dataTransfer.files?.[0] ?? null)
  }

  const submitWorkbook = async () => {
    if (!rulesAccepted || !selectedCategoryId || !selectedFile || isUploading) return

    setIsUploading(true)
    setFeedback(null)
    setResult(null)

    try {
      const nextResult = await importProductsWorkbook(selectedCategoryId, selectedFile)
      setResult(nextResult)
      setFeedback({ variant: 'success', title: 'فایل با موفقیت پردازش شد و نتیجه نهایی دریافت شد.' })
      setSelectedFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (error) {
      setFeedback({ variant: 'danger', title: getErrorMessage(error) })
    } finally {
      setIsUploading(false)
    }
  }

  const handleManualSaved = useCallback(() => {
    setFeedback({ variant: 'success', title: 'محصول با فرم دستی با موفقیت ثبت شد.' })
  }, [])

  return (
    <main className="mx-auto min-h-0 max-w-6xl px-4 py-6 sm:px-6 lg:px-10 lg:py-10" dir="rtl">
      <Surface className="overflow-hidden" elevation="flat" padding="none">
        <div className="border-b border-border-soft bg-gradient-to-l from-orange-50 via-white to-white p-5 sm:p-7">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
            <div className="flex items-start gap-3">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-brand-950 text-white shadow-md">
                <PackagePlus aria-hidden="true" size={24} />
              </span>
              <div>
                <h2 className="m-0 text-xl font-black text-brand-950 sm:text-2xl">افزودن محصول</h2>
                <p className="mb-0 mt-1 text-sm leading-6 text-muted">
                  محصول جدید را گروهی از فایل اکسل یا به‌صورت تکی با فرم دستی ثبت کنید.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 rounded-xl border border-border-soft bg-white p-1.5" role="tablist" aria-label="روش افزودن محصول">
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'excel'}
                className={cn(
                  'flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-lg px-4 text-sm font-black transition-colors',
                  mode === 'excel' ? 'bg-accent-500 text-brand-950 shadow-sm' : 'text-muted hover:bg-orange-50 hover:text-brand-950',
                )}
                onClick={() => handleModeChange('excel')}
              >
                <FileSpreadsheet aria-hidden="true" size={18} />
                فایل اکسل
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'manual'}
                className={cn(
                  'flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-lg px-4 text-sm font-black transition-colors',
                  mode === 'manual' ? 'bg-brand-950 text-white shadow-sm' : 'text-muted hover:bg-[#f3f4f5] hover:text-brand-950',
                )}
                onClick={() => handleModeChange('manual')}
              >
                <PencilLine aria-hidden="true" size={18} />
                دستی
              </button>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6 lg:p-7">
          {feedback && <Alert className="mb-5" live title={feedback.title} variant={feedback.variant} />}

          {mode === 'excel' ? (
            <div className="grid gap-6">
              {!canManageCategories && (
                <Alert title="برای انتخاب دسته‌بندی اصلی، مجوز مدیریت دسته‌بندی‌ها نیز لازم است." variant="warning" />
              )}

              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
                <section className="grid gap-4 rounded-xl border border-border-soft bg-[#fbfbfc] p-4 sm:p-5" aria-labelledby="excel-upload-title">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 id="excel-upload-title" className="m-0 text-base font-black text-ink">بارگذاری فایل محصولات</h3>
                      <p className="mb-0 mt-1 text-xs leading-6 text-muted">فایل هر دسته‌بندی اصلی را جداگانه انتخاب و ثبت کنید.</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      leadingIcon={<Info aria-hidden="true" size={16} />}
                      onClick={() => setShowRules(true)}
                    >
                      مشاهده قوانین
                    </Button>
                  </div>

                  <Dropdown
                    disabled={!canManageCategories || categoriesLoading || isUploading}
                    label="دسته‌بندی اصلی فایل"
                    required
                    options={categoryOptions}
                    placeholder={categoriesLoading ? 'در حال دریافت دسته‌بندی‌ها…' : 'یک دسته‌بندی اصلی انتخاب کنید'}
                    hint={
                      !categoriesLoading && canManageCategories && categoryOptions.length === 0
                        ? 'ابتدا حداقل یک دسته‌بندی اصلی بسازید.'
                        : 'ستون «دسته‌بندی فرعی» فایل باید زیرمجموعه همین دسته‌بندی اصلی باشد.'
                    }
                    value={selectedCategoryId}
                    onChange={(value) => {
                      setSelectedCategoryId(value)
                      setResult(null)
                    }}
                  />

                  <label
                    htmlFor="product-workbook-file"
                    className={cn(
                      'grid min-h-48 place-items-center rounded-xl border-2 border-dashed p-5 text-center transition-colors',
                      rulesAccepted && !isUploading
                        ? 'cursor-pointer border-[#9da9b5] bg-white hover:border-accent-500 hover:bg-orange-50/40'
                        : 'cursor-not-allowed border-[#d7dade] bg-[#f1f2f3] opacity-65',
                      isDragging && rulesAccepted && 'border-accent-500 bg-orange-50',
                    )}
                    onDragEnter={(event) => {
                      event.preventDefault()
                      if (rulesAccepted && !isUploading) setIsDragging(true)
                    }}
                    onDragOver={(event) => event.preventDefault()}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                  >
                    <input
                      ref={fileInputRef}
                      id="product-workbook-file"
                      aria-label="انتخاب فایل اکسل محصولات"
                      className="sr-only"
                      accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                      disabled={!rulesAccepted || isUploading}
                      type="file"
                      onChange={handleFileInput}
                    />
                    <span>
                      <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-[#e9ecef] text-brand-950">
                        <UploadCloud aria-hidden="true" size={28} />
                      </span>
                      <span className="mt-3 block text-sm font-black text-ink">
                        {selectedFile ? selectedFile.name : 'فایل اکسل را انتخاب کنید یا اینجا رها کنید'}
                      </span>
                      <span className="mt-1 block text-xs text-muted">
                        {selectedFile ? formatFileSize(selectedFile.size) : 'فقط فرمت .xlsx'}
                      </span>
                    </span>
                  </label>

                  {!rulesAccepted && (
                    <Alert title="برای فعال شدن بارگذاری باید قوانین را مطالعه و تأیید کنید." variant="warning">
                      <button
                        type="button"
                        className="mt-1 cursor-pointer font-black text-accent-500 underline underline-offset-4"
                        onClick={() => setShowRules(true)}
                      >
                        مطالعه و پذیرش قوانین
                      </button>
                    </Alert>
                  )}

                  <Button
                    fullWidth
                    disabled={!rulesAccepted || !selectedCategoryId || !selectedFile}
                    loading={isUploading}
                    leadingIcon={<UploadCloud aria-hidden="true" size={18} />}
                    variant="secondary"
                    onClick={() => void submitWorkbook()}
                  >
                    ثبت نهایی فایل
                  </Button>
                </section>

                <aside className="grid content-start gap-4">
                  <Surface className="border-2 border-orange-100" elevation="flat" padding="md">
                    <FileSpreadsheet aria-hidden="true" className="text-accent-500" size={26} />
                    <h3 className="mb-0 mt-3 text-base font-black text-brand-950">قالب استاندارد فنینو</h3>
                    <p className="mb-4 mt-2 text-xs leading-6 text-muted">
                      شامل ستون‌های ثابت محصول و ۱۱ ستون قابل تغییر برای ویژگی‌ها.
                    </p>
                    <a
                      className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg border border-brand-950 bg-white px-3 text-xs font-black text-brand-950 transition-colors hover:bg-brand-950 hover:text-white focus-visible:outline-2 focus-visible:outline-accent-500"
                      download="دسته بندی.xlsx"
                      href={TEMPLATE_URL}
                    >
                      <Download aria-hidden="true" size={17} />
                      دانلود فایل نمونه
                    </a>
                  </Surface>

                  <Surface elevation="flat" padding="md">
                    <Archive aria-hidden="true" className="text-brand-950" size={24} />
                    <h3 className="mb-0 mt-3 text-sm font-black text-ink">وضعیت‌های فایل</h3>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {workbookStatuses.map((status) => (
                        <span key={status.label} className="rounded-full bg-[#eef0f2] px-2.5 py-1 text-[11px] font-bold text-brand-950">
                          {status.label}
                        </span>
                      ))}
                    </div>
                  </Surface>
                </aside>
              </div>

              {result && (
                <section aria-labelledby="import-result-title">
                  <div className="mb-3 flex items-center gap-2">
                    <CheckCircle2 aria-hidden="true" className="text-[#0e6948]" size={22} />
                    <h3 id="import-result-title" className="m-0 text-base font-black text-ink">نتیجه پردازش فایل</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                    {resultItems.map((item) => (
                      <div key={item.key} className={cn('rounded-xl p-4 text-center', item.className)}>
                        <strong className="block text-2xl font-black">{toPersianDigits(String(result[item.key]))}</strong>
                        <span className="mt-1 block text-xs font-bold">{item.label}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          ) : (
            <section className="grid gap-5" aria-label="ثبت دستی محصول">
              {!canUseManualEditor && (
                <Alert title="برای ثبت دستی، علاوه بر مدیریت محصول به مجوز مدیریت دسته‌بندی‌ها و برندها نیاز دارید." variant="warning" />
              )}
              {canUseManualEditor && (categoriesLoading || brandsLoading) && (
                <Alert title="در حال دریافت دسته‌بندی‌ها و برندها…" variant="warning" />
              )}
              {canUseManualEditor && !categoriesLoading && !brandsLoading && (categories.length === 0 || brands.length === 0) && (
                <Alert title="برای ثبت محصول، ابتدا حداقل یک دسته‌بندی و یک برند بسازید." variant="warning" />
              )}
              {canUseManualEditor && (
                <Suspense
                  fallback={(
                    <Surface elevation="flat" padding="lg">
                      <p className="m-0 text-sm font-bold text-brand-950">در حال آماده‌سازی فرم محصول…</p>
                    </Surface>
                  )}
                >
                  <ProductEditorDialog
                    brands={brands}
                    categories={categories}
                    presentation="inline"
                    target={{ mode: 'create' }}
                    onSaved={handleManualSaved}
                  />
                </Suspense>
              )}
            </section>
          )}
        </div>
      </Surface>

      {showRules && (
        <RulesDialog
          accepted={rulesAccepted}
          onAccept={() => {
            storeRulesAcceptance()
            setRulesAccepted(true)
            setShowRules(false)
          }}
          onClose={() => setShowRules(false)}
        />
      )}
    </main>
  )
}
