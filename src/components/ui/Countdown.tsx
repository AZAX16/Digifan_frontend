import { cn } from '../../utils/cn'

export interface CountdownProps {
  days: string | number
  hours: string | number
  minutes: string | number
  className?: string
}

export function Countdown({ days, hours, minutes, className }: CountdownProps) {
  const units = [
    { value: days, label: 'روز' },
    { value: hours, label: 'ساعت' },
    { value: minutes, label: 'دقیقه' },
  ]

  return (
    <div
      className={cn(
        'grid h-[61px] w-[135px] grid-cols-3 rounded-df-md border-2 border-[#f0f0f0] bg-white px-2 py-1',
        className,
      )}
      aria-label={`${days} روز، ${hours} ساعت و ${minutes} دقیقه باقی‌مانده`}
      dir="rtl"
    >
      {units.map((unit) => (
        <span key={unit.label} className="grid content-center text-center">
          <b className="text-xl leading-6 text-ink">{unit.value}</b>
          <span className="text-[11px] leading-4 text-[#a4a4a4]">{unit.label}</span>
        </span>
      ))}
    </div>
  )
}
