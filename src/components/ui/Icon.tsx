import type { CSSProperties, HTMLAttributes } from 'react'

import cartIcon from '../../assets/figma-cart.svg'
import checkIcon from '../../assets/figma-check.svg'
import photoIcon from '../../assets/figma-photo.svg'
import starIcon from '../../assets/figma-star-filled.svg'
import { cn } from '../../utils/cn'

const imageIcons = {
  cart: cartIcon,
  check: checkIcon,
  photo: photoIcon,
} as const

export type IconName = keyof typeof imageIcons | 'star'

export interface IconProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  name: IconName
  label?: string
  size?: number
  tone?: string
}

export function Icon({
  name,
  label,
  size = 20,
  tone = 'currentColor',
  className,
  style,
  ...props
}: IconProps) {
  const accessibility = label
    ? { role: 'img', 'aria-label': label }
    : { 'aria-hidden': true }

  if (name === 'star') {
    return (
      <span
        {...accessibility}
        {...props}
        className={cn('inline-block shrink-0', className)}
        style={
          {
            width: size,
            height: size,
            backgroundColor: tone,
            maskImage: `url(${starIcon})`,
            maskPosition: 'center',
            maskRepeat: 'no-repeat',
            maskSize: 'contain',
            WebkitMaskImage: `url(${starIcon})`,
            WebkitMaskPosition: 'center',
            WebkitMaskRepeat: 'no-repeat',
            WebkitMaskSize: 'contain',
            ...style,
          } as CSSProperties
        }
      />
    )
  }

  return (
    <span
      {...accessibility}
      {...props}
      className={cn('inline-flex shrink-0 items-center justify-center', className)}
      style={{ width: size, height: size, ...style }}
    >
      <img
        alt=""
        className="block h-full w-full object-contain"
        src={imageIcons[name]}
      />
    </span>
  )
}
