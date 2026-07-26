import type { HTMLAttributes } from 'react'

import cartIcon from '../../assets/figma-cart.svg'
import checkIcon from '../../assets/figma-check.svg'
import photoIcon from '../../assets/figma-photo.svg'
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
        className={cn('inline-flex shrink-0 items-center justify-center', className)}
        style={{ width: size, height: size, color: tone, ...style }}
      >
        <svg
          aria-hidden="true"
          className="block h-full w-full overflow-visible"
          viewBox="0 0 20 19"
        >
          <path
            d="M3.825 19L5.45 11.975L0 7.25L7.2 6.625L10 0L12.8 6.625L20 7.25L14.55 11.975L16.175 19L10 15.275L3.825 19Z"
            fill="currentColor"
          />
        </svg>
      </span>
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
