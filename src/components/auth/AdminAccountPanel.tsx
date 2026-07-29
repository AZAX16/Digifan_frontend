import { useEffect, useState, type FormEvent } from 'react'

import {
  changeAdminPassword,
  changeAdminPhoneNumber,
  getAdminProfile,
  logoutAdmin,
  subscribeToAdminProfile,
  type AdminProfile,
} from '../../api/auth'
import { ApiError } from '../../api/client'
import { formatPhoneNumber, isValidPhoneNumber, normalizePhoneNumber } from '../../utils/phoneNumber'
import { Alert, Button, Input, Surface } from '../ui'

type PendingAction = 'phone' | 'password' | 'logout' | null

interface Feedback {
  variant: 'success' | 'danger'
  title: string
}

function getActionError(error: unknown) {
  return error instanceof ApiError ? error.message : 'خطای پیش‌بینی‌نشده‌ای رخ داد.'
}

export function AdminAccountPanel() {
  const [profile, setProfile] = useState<AdminProfile | null>(null)
  const [isProfileLoading, setIsProfileLoading] = useState(true)
  const [showSettings, setShowSettings] = useState(false)
  const [newPhoneNumber, setNewPhoneNumber] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [pendingAction, setPendingAction] = useState<PendingAction>(null)

  useEffect(() => {
    let isActive = true
    const unsubscribe = subscribeToAdminProfile(setProfile)

    void getAdminProfile()
      .then((nextProfile) => {
        if (isActive) setProfile(nextProfile)
      })
      .catch((error: unknown) => {
        if (isActive) setFeedback({ variant: 'danger', title: getActionError(error) })
      })
      .finally(() => {
        if (isActive) setIsProfileLoading(false)
      })

    return () => {
      isActive = false
      unsubscribe()
    }
  }, [])

  const handlePhoneNumberChange = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const normalizedPhoneNumber = normalizePhoneNumber(newPhoneNumber)

    if (!isValidPhoneNumber(normalizedPhoneNumber)) {
      setFeedback({ variant: 'danger', title: 'شماره موبایل معتبر وارد کنید.' })
      return
    }

    setPendingAction('phone')
    setFeedback(null)

    try {
      await changeAdminPhoneNumber(normalizedPhoneNumber)
      setNewPhoneNumber('')
      setFeedback({ variant: 'success', title: 'شماره موبایل مدیر تغییر کرد.' })
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
  const profilePhoneNumber = formatPhoneNumber(profile?.phoneNumber)

  return (
    <section className="mx-auto max-w-5xl px-4 pt-6 sm:px-6" dir="rtl">
      <Surface elevation="flat" padding="md">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="m-0 text-xs font-bold text-muted">مدیر واردشده</p>
            <p className="mb-0 mt-1 font-black text-brand-950" dir={profilePhoneNumber ? 'ltr' : undefined}>
              {isProfileLoading
                ? 'در حال دریافت پروفایل…'
                : profilePhoneNumber ?? 'شماره موبایل ثبت نشده است'}
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
            <form className="grid content-start gap-3" onSubmit={(event) => void handlePhoneNumberChange(event)}>
              <h2 className="m-0 text-sm font-black text-brand-950">تغییر شماره موبایل</h2>
              <Input
                required
                autoComplete="tel"
                dir="ltr"
                disabled={isBusy}
                inputMode="tel"
                label="شماره موبایل جدید"
                maxLength={20}
                placeholder="۰۹۱۲۱۲۳۴۵۶۷"
                type="tel"
                value={newPhoneNumber}
                onChange={(event) => setNewPhoneNumber(event.target.value)}
              />
              <Button loading={pendingAction === 'phone'} size="sm" type="submit">
                ذخیره شماره موبایل
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
