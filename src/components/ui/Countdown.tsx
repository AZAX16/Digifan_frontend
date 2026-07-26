import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'

import { cn } from '../../utils/cn'
import { toWesternDigits } from '../../utils/persianDigits'

export interface CountdownProps {
  days?: string | number
  hours?: string | number
  minutes?: string | number
  seconds?: string | number
  totalSeconds?: number
  autoStart?: boolean
  showSeconds?: boolean
  className?: string
  onComplete?: () => void
}

const clockListeners = new Set<() => void>()
const twoDigitFormatter = new Intl.NumberFormat('fa-IR', {
  minimumIntegerDigits: 2,
  useGrouping: false,
})
let clockNow = Date.now()
let clockInterval: ReturnType<typeof setInterval> | undefined

function subscribeToClock(listener: () => void) {
  clockListeners.add(listener)

  if (clockListeners.size === 1) {
    clockNow = Date.now()
    clockInterval = setInterval(() => {
      clockNow = Date.now()
      clockListeners.forEach((notify) => notify())
    }, 1_000)
  }

  return () => {
    clockListeners.delete(listener)

    if (clockListeners.size === 0 && clockInterval !== undefined) {
      clearInterval(clockInterval)
      clockInterval = undefined
    }
  }
}

function subscribeToStaticClock() {
  return () => undefined
}

function readNumber(value: string | number | undefined) {
  const parsedValue = Number(toWesternDigits(String(value ?? 0)).replace(/[^0-9.-]/g, ''))
  return Number.isFinite(parsedValue) ? Math.max(0, Math.floor(parsedValue)) : 0
}

function getInitialSeconds({
  days,
  hours,
  minutes,
  seconds,
  totalSeconds,
}: Pick<CountdownProps, 'days' | 'hours' | 'minutes' | 'seconds' | 'totalSeconds'>) {
  return Math.max(
    0,
    Math.floor(
      totalSeconds ??
        readNumber(days) * 86_400 +
          readNumber(hours) * 3_600 +
          readNumber(minutes) * 60 +
          readNumber(seconds),
    ),
  )
}

function useRemainingSeconds(endsAt: number, initialSeconds: number, autoStart: boolean, showSeconds: boolean) {
  const getSnapshot = useCallback(() => {
    if (!autoStart) return initialSeconds

    const remainingSeconds = Math.max(0, Math.ceil((endsAt - clockNow) / 1_000))
    return showSeconds ? remainingSeconds : Math.ceil(remainingSeconds / 60) * 60
  }, [autoStart, endsAt, initialSeconds, showSeconds])

  return useSyncExternalStore(
    autoStart ? subscribeToClock : subscribeToStaticClock,
    getSnapshot,
    getSnapshot,
  )
}

interface CountdownTimerProps extends CountdownProps {
  initialSeconds: number
}

function CountdownTimer({
  initialSeconds,
  autoStart = true,
  showSeconds = false,
  className,
  onComplete,
}: CountdownTimerProps) {
  const [startedAt] = useState(Date.now)
  const endsAt = startedAt + initialSeconds * 1_000
  const remainingSeconds = useRemainingSeconds(endsAt, initialSeconds, autoStart, showSeconds)
  const completionReported = useRef(false)

  useEffect(() => {
    if (remainingSeconds > 0) {
      completionReported.current = false
      return
    }

    if (initialSeconds > 0 && !completionReported.current) {
      completionReported.current = true
      onComplete?.()
    }
  }, [initialSeconds, onComplete, remainingSeconds])

  const remainingDays = Math.floor(remainingSeconds / 86_400)
  const remainingHours = Math.floor((remainingSeconds % 86_400) / 3_600)
  const remainingMinutes = Math.floor((remainingSeconds % 3_600) / 60)
  const remainingUnitSeconds = remainingSeconds % 60
  const units = [
    { value: remainingDays, label: 'روز' },
    { value: remainingHours, label: 'ساعت' },
    { value: remainingMinutes, label: 'دقیقه' },
    ...(showSeconds ? [{ value: remainingUnitSeconds, label: 'ثانیه' }] : []),
  ]

  return (
    <div
      className={cn(
        'grid h-[61px] rounded-df-md border-2 border-[#f0f0f0] bg-white px-2 py-1',
        showSeconds ? 'w-[160px] grid-cols-4' : 'w-[135px] grid-cols-3',
        className,
      )}
      aria-label={`${remainingDays} روز، ${remainingHours} ساعت، ${remainingMinutes} دقیقه و ${remainingUnitSeconds} ثانیه باقی‌مانده`}
      role="timer"
      dir="ltr"
    >
      {units.map((unit) => (
        <span key={unit.label} className="grid content-center text-center">
          <b className="text-lg leading-6 text-ink">{twoDigitFormatter.format(unit.value)}</b>
          <span className="text-[10px] leading-4 text-[#a4a4a4]">{unit.label}</span>
        </span>
      ))}
    </div>
  )
}

export function Countdown(props: CountdownProps) {
  const initialSeconds = getInitialSeconds(props)

  return (
    <CountdownTimer
      key={`${initialSeconds}-${String(props.autoStart)}`}
      {...props}
      initialSeconds={initialSeconds}
    />
  )
}
