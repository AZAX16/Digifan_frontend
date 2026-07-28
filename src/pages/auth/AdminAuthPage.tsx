import { useState, type FormEvent } from 'react'

import { loginAdmin } from '../../api/auth'
import { ApiError } from '../../api/client'
import { Alert, Button, Input, Surface } from '../../components/ui'

interface Feedback {
  variant: 'danger'
  title: string
}

function getActionError(error: unknown) {
  return error instanceof ApiError ? error.message : 'خطای پیش‌بینی‌نشده‌ای رخ داد.'
}

export function AdminAuthPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    setFeedback(null)

    try {
      await loginAdmin({ email: email.trim(), password })
    } catch (error) {
      setFeedback({ variant: 'danger', title: getActionError(error) })
      setIsSubmitting(false)
    }
  }

  return (
    <main
      className="mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-md items-center px-4 py-10 sm:px-6"
      dir="rtl"
    >
      <div className="w-full">
        <header className="mb-6 text-center">
          <p className="mb-1 text-sm font-bold text-accent-500">پنل مدیریت DigiFan</p>
          <h1 className="m-0 text-2xl font-black text-brand-950">ورود مدیر</h1>
          <p className="mb-0 mt-2 text-sm leading-7 text-muted">
            برای مدیریت دسته‌بندی‌ها وارد حساب مدیر شوید.
          </p>
        </header>

        <Surface elevation="raised" padding="lg">
          {feedback && (
            <Alert className="mb-5" live title={feedback.title} variant={feedback.variant} />
          )}

          <form className="grid gap-4" onSubmit={(event) => void handleLogin(event)}>
            <Input
              required
              autoComplete="username"
              dir="ltr"
              disabled={isSubmitting}
              label="ایمیل"
              normalizeDigits={false}
              placeholder="admin@example.com"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            <Input
              required
              autoComplete="current-password"
              dir="ltr"
              disabled={isSubmitting}
              label="رمز عبور"
              normalizeDigits={false}
              placeholder="رمز عبور حساب مدیر"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <Button fullWidth loading={isSubmitting} size="lg" type="submit">
              ورود
            </Button>
          </form>
        </Surface>

        <Alert className="mt-4" title="ثبت‌نام مدیر از این API ممکن نیست" variant="info">
          قرارداد فعلی مسیر ثبت‌نام یا ساخت مدیر ندارد؛ حساب مدیر باید از قبل در بک‌اند ایجاد شده
          باشد.
        </Alert>
      </div>
    </main>
  )
}
