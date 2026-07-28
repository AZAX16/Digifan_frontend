import { useEffect, useState, type FormEvent } from 'react'

import {
  changeAdminEmail,
  changeAdminPassword,
  getAdminProfile,
  logoutAdmin,
  type AdminProfile,
} from '../../api/auth'
import { ApiError } from '../../api/client'
import { Alert, Button, Input, Surface } from '../ui'

type PendingAction = 'email' | 'password' | 'logout' | null

interface Feedback {
  variant: 'success' | 'danger'
  title: string
}

function getActionError(error: unknown) {
  return error instanceof ApiError ? error.message : 'خطای پیش‌بینی‌نشده‌ای رخ داد.'
}

export function AdminAccountPanel() {
  const [profile, setProfile] = useState<AdminProfile | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [pendingAction, setPendingAction] = useState<PendingAction>(null)

  useEffect(() => {
    let isActive = true

    void getAdminProfile()
      .then((nextProfile) => {
        if (isActive) setProfile(nextProfile)
      })
      .catch((error: unknown) => {
        if (isActive) setFeedback({ variant: 'danger', title: getActionError(error) })
      })

    return () => {
      isActive = false
    }
  }, [])

  const handleEmailChange = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const normalizedEmail = newEmail.trim()

    setPendingAction('email')
    setFeedback(null)

    try {
      await changeAdminEmail(normalizedEmail)
      setProfile((currentProfile) =>
        currentProfile ? { ...currentProfile, email: normalizedEmail } : currentProfile,
      )
      setNewEmail('')
      setFeedback({ variant: 'success', title: 'ایمیل مدیر تغییر کرد.' })
    } catch (error) {
      setFeedback({ variant: 'danger', title: getActionError(error) })
    } finally {
      setPendingAction(null)
    }
  }

  const handlePasswordChange = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setPendingAction('password')
    setFeedback(null)

    try {
      await changeAdminPassword(currentPassword, newPassword)
      setCurrentPassword('')
      setNewPassword('')
      setFeedback({ variant: 'success', title: 'رمز عبور مدیر تغییر کرد.' })
    } catch (error) {
      setFeedback({ variant: 'danger', title: getActionError(error) })
    } finally {
      setPendingAction(null)
    }
  }

  const handleLogout = async () => {
    setPendingAction('logout')
    setFeedback(null)

    try {
      await logoutAdmin()
    } catch (error) {
      setFeedback({ variant: 'danger', title: getActionError(error) })
      setPendingAction(null)
    }
  }

  const isBusy = pendingAction !== null
  const profileEmail = profile?.email?.trim()

  return (
    <section className="mx-auto max-w-5xl px-4 pt-6 sm:px-6" dir="rtl">
      <Surface elevation="flat" padding="md">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="m-0 text-xs font-bold text-muted">مدیر واردشده</p>
            <p className="mb-0 mt-1 font-black text-brand-950">
              {profileEmail?.length ? profileEmail : 'در حال دریافت پروفایل…'}
            </p>
            {profile && (
              <p className="mb-0 mt-1 text-xs text-muted">
                وضعیت حساب: {profile.isActive ? 'فعال' : 'غیرفعال'}
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              disabled={isBusy}
              size="sm"
              variant="outline"
              onClick={() => setShowSettings((currentValue) => !currentValue)}
            >
              {showSettings ? 'بستن تنظیمات' : 'تنظیمات حساب'}
            </Button>
            <Button
              disabled={isBusy}
              loading={pendingAction === 'logout'}
              size="sm"
              variant="danger"
              onClick={() => void handleLogout()}
            >
              خروج
            </Button>
          </div>
        </div>

        {feedback && (
          <Alert className="mt-4" live title={feedback.title} variant={feedback.variant} />
        )}

        {showSettings && (
          <div className="mt-5 grid gap-5 border-t border-border-soft pt-5 md:grid-cols-2">
            <form className="grid content-start gap-3" onSubmit={(event) => void handleEmailChange(event)}>
              <h2 className="m-0 text-sm font-black text-brand-950">تغییر ایمیل</h2>
              <Input
                required
                autoComplete="email"
                dir="ltr"
                disabled={isBusy}
                label="ایمیل جدید"
                normalizeDigits={false}
                placeholder="new@example.com"
                type="email"
                value={newEmail}
                onChange={(event) => setNewEmail(event.target.value)}
              />
              <Button loading={pendingAction === 'email'} size="sm" type="submit">
                ذخیره ایمیل
              </Button>
            </form>

            <form
              className="grid content-start gap-3"
              onSubmit={(event) => void handlePasswordChange(event)}
            >
              <h2 className="m-0 text-sm font-black text-brand-950">تغییر رمز عبور</h2>
              <Input
                required
                autoComplete="current-password"
                dir="ltr"
                disabled={isBusy}
                label="رمز عبور فعلی"
                normalizeDigits={false}
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
              />
              <Input
                required
                autoComplete="new-password"
                dir="ltr"
                disabled={isBusy}
                label="رمز عبور جدید"
                normalizeDigits={false}
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
              />
              <Button loading={pendingAction === 'password'} size="sm" type="submit">
                ذخیره رمز عبور
              </Button>
            </form>
          </div>
        )}
      </Surface>
    </section>
  )
}
