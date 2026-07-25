import photoPlaceholder from '../../assets/figma-photo.svg'
import { cn } from '../../utils/cn'
import { Badge } from './Badge'
import { Button } from './Button'
import { Icon } from './Icon'
import { IconButton } from './IconButton'
import { Rating } from './Rating'

export interface ProductCardProps {
  name: string
  description: string
  price: string
  imageSrc?: string
  imageAlt?: string
  rating?: number
  isNew?: boolean
  className?: string
  onAddToCart?: () => void
  onOpenCart?: () => void
}

export function ProductCard({
  name,
  description,
  price,
  imageSrc,
  imageAlt = '',
  rating = 3,
  isNew = false,
  className,
  onAddToCart,
  onOpenCart,
}: ProductCardProps) {
  return (
    <article
      className={cn(
        'relative h-[355px] w-[290px] shrink-0 overflow-hidden rounded-df-lg bg-surface shadow-card',
        className,
      )}
      dir="rtl"
    >
      {isNew && (
        <Badge className="absolute left-7 top-[15px] h-[25px] w-[62px] px-0 text-sm">
          جدید
        </Badge>
      )}

      <div className="absolute left-1/2 top-[51px] flex h-[136px] w-[179px] -translate-x-1/2 items-center justify-center overflow-hidden">
        <img
          alt={imageAlt}
          className={cn(
            'block max-h-full max-w-full object-contain',
            !imageSrc && 'h-[90px] w-[90px]',
          )}
          src={imageSrc ?? photoPlaceholder}
        />
      </div>

      <h3 className="absolute inset-x-4 top-[196px] m-0 truncate text-center text-base font-bold text-ink">
        {name}
      </h3>
      <p className="absolute inset-x-4 top-[224px] m-0 truncate text-center text-xs font-medium text-muted">
        {description}
      </p>
      <Rating
        value={rating}
        className="absolute left-1/2 top-[244px] -translate-x-1/2"
      />
      <p className="absolute inset-x-4 top-[273px] m-0 truncate text-center text-[13px] font-medium text-ink">
        {price}
      </p>

      <div className="absolute left-7 top-[307px] flex items-center gap-5" dir="ltr">
        <IconButton
          label="مشاهده سبد خرید"
          size="md"
          className="size-[37px]"
          icon={<Icon name="cart" size={20} />}
          onClick={onOpenCart}
        />
        <Button
          size="sm"
          className="h-[37px] w-[177px] text-[13px]"
          onClick={onAddToCart}
        >
          افزودن به سبد خرید
        </Button>
      </div>
    </article>
  )
}
