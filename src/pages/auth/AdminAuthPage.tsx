import { useState, type FormEvent } from 'react'

import {
  loginAdmin,
  requestAdminTwoFactorCode,
  verifyAdminTwoFactorCode,
  type AdminTwoFactorChallenge,
} from '../../api/auth'
import { ApiError } from '../../api/client'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Field'
import { Surface } from '../../components/ui/Surface'

import { toWesternDigits } from '../../utils/persianDigits'
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

  const [verificationCode, setVerificationCode] = useState('')
  const [challenge, setChallenge] = useState<AdminTwoFactorChallenge | null>(null)
  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    setFeedback(null)

    try {
      const outcome = await loginAdmin({ email: email.trim(), password })

      if (outcome.status === 'two-factor-required') {
        setChallenge(outcome.challenge)
        await requestAdminTwoFactorCode(outcome.challenge.token)
        setIsSubmitting(false)
      }
    } catch (error) {
      setFeedback({ variant: 'danger', title: getActionError(error) })
      setIsSubmitting(false)
    }
  }

  const handleVerification = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!challenge) return

    setIsSubmitting(true)
    setFeedback(null)

    try {
      await verifyAdminTwoFactorCode(
        challenge.token,
        toWesternDigits(verificationCode).trim(),
      )
    } catch (error) {
      setFeedback({ variant: 'danger', title: getActionError(error) })
      setIsSubmitting(false)
    }
  }

  const handleResendCode = async () => {
    if (!challenge) return

    setIsSubmitting(true)
    setFeedback(null)

    try {
      await requestAdminTwoFactorCode(challenge.token)
      setFeedback(null)
    } catch (error) {
      setFeedback({ variant: 'danger', title: getActionError(error) })
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetLogin = () => {
    setChallenge(null)
    setVerificationCode('')
    setPassword('')
    setFeedback(null)
    setIsSubmitting(false)
  }

  return (
    <main
      className="mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-md items-center px-4 py-10 sm:px-6"
      dir="rtl"
    >
      <div className="w-full">
        <header className="mb-6 text-center">
          <p className="mb-1 text-sm font-bold text-accent-500">پنل مدیریت DigiFan</p>
          <h1 className="m-0 text-2xl font-black text-brand-950">{challenge ? 'تأیید کد ورود' : 'ورود مدیر'}</h1>
          <p className="mb-0 mt-2 text-sm leading-7 text-muted">
            {challenge ? 'کد ارسال‌شده را برای تکمیل ورود وارد کنید.' : 'برای دسترسی به پنل مدیریت وارد حساب مدیر شوید.'}
          </p>
        </header>

        <Surface elevation="raised" padding="lg">
          {feedback && (
            <Alert className="mb-5" live title={feedback.title} variant={feedback.variant} />
          )}

          {challenge ? (
            <form className="grid gap-4" onSubmit={(event) => void handleVerification(event)}>
              <Input
                required
                autoComplete="one-time-code"
                dir="ltr"
                disabled={isSubmitting}
                inputMode="numeric"
                label="کد تأیید"
                maxLength={8}
                placeholder="کد ارسال‌شده"
                value={verificationCode}
                onChange={(event) => setVerificationCode(event.target.value)}
              />
              <Button fullWidth loading={isSubmitting} size="lg" type="submit">
                تأیید و ورود
              </Button>
              <div className="flex flex-wrap justify-between gap-2">
                <Button disabled={isSubmitting} size="sm" variant="ghost" onClick={() => void handleResendCode()}>
                  ارسال دوباره کد
                </Button>
                <Button disabled={isSubmitting} size="sm" variant="ghost" onClick={resetLogin}>
                  بازگشت به ورود
                </Button>
              </div>
            </form>
          ) : (
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
          )}
        </Surface>

        <Alert className="mt-4" title="ثبت‌نام مدیر از این API ممکن نیست" variant="info">
          قرارداد فعلی مسیر ثبت‌نام یا ساخت مدیر ندارد؛ حساب مدیر باید از قبل در بک‌اند ایجاد شده
          باشد.
        </Alert>
      </div>
    </main>
  )
}
