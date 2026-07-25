import productImage from '../../assets/figma-discount-raw-1.png'
import { cn } from '../../utils/cn'
import { Badge } from './Badge'
import { Button } from './Button'
import { Countdown } from './Countdown'

export interface DiscountProductCardProps {
  name: string
  description: string
  currentPrice: string
  previousPrice: string
  discount: string
  imageSrc?: string
  imageAlt?: string
  days?: string | number
  hours?: string | number
  minutes?: string | number
  className?: string
  onView?: () => void
}

export function DiscountProductCard({
  name,
  description,
  currentPrice,
  previousPrice,
  discount,
  imageSrc = productImage,
  imageAlt = '',
  days = '۰۳',
  hours = '۱۶',
  minutes = '۲۳',
  className,
  onView,
}: DiscountProductCardProps) {
  return (
    <article
      className={cn(
        'relative h-[296px] w-[308px] shrink-0 overflow-hidden rounded-df-lg bg-surface shadow-card',
        className,
      )}
      dir="rtl"
    >
      <img
        src={imageSrc}
        alt={imageAlt}
        className="absolute left-9 top-6 h-[166px] w-[88px] object-contain"
      />
      <Badge
        variant="accent"
        className="absolute right-[26px] top-5 h-[26px] w-20 rounded-df-md px-0 text-[13px]"
      >
        {discount} تخفیف
      </Badge>
      <Countdown
        days={days}
        hours={hours}
        minutes={minutes}
        className="absolute right-[21px] top-[58px]"
      />
      <h3 className="absolute right-[21px] top-[138px] m-0 w-[137px] truncate text-right text-[15px] font-bold text-ink">
        {name}
      </h3>
      <p className="absolute right-[21px] top-[164px] m-0 w-[115px] truncate text-right text-[15px] font-bold text-[#878787]">
        {description}
      </p>
      <div className="absolute inset-x-4 top-[211px] flex items-center justify-center gap-[11px] whitespace-nowrap text-[15px]">
        <span className="font-bold text-ink">{currentPrice}</span>
        <del className="font-medium text-[#8f8f8f]">{previousPrice}</del>
      </div>
      <Button
        size="sm"
        className="absolute left-1/2 top-[248px] h-[26px] min-h-0 w-[116px] -translate-x-1/2 rounded-df-md px-2 text-sm font-medium"
        onClick={onView}
      >
        مشاهده و خرید
      </Button>
    </article>
  )
}
