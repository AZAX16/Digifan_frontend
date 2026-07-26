import { useState } from 'react'

import { cn } from '../../utils/cn'
import { toPersianDigits, toWesternDigits } from '../../utils/persianDigits'
import { Input } from './Field'

export interface PriceRangeProps {
  min: number
  max: number
  value: [number, number]
  onChange?: (value: [number, number]) => void
  onChangeEnd?: (value: [number, number]) => void
  step?: number
  label?: string
  currency?: string
  className?: string
}

const inputPriceFormatter = new Intl.NumberFormat('en-US')
const persianPriceFormatter = new Intl.NumberFormat('fa-IR')

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function readPrice(value: string) {
  const normalizedValue = toWesternDigits(value).replace(/[^0-9]/g, '')
  return normalizedValue ? Number(normalizedValue) : null
}

function formatPriceInput(value: number) {
  return toPersianDigits(inputPriceFormatter.format(value))
}

function formatTypedPrice(value: string) {
  const numericValue = readPrice(value)
  return numericValue === null ? '' : formatPriceInput(numericValue)
}

export function PriceRange({
  min,
  max,
  value,
  onChange,
  onChangeEnd,
  step = 500_000,
  label = 'محدوده قیمت',
  currency = 'تومان',
  className,
}: PriceRangeProps) {
  const safeMax = Math.max(max, min + 1)
  const safeStep = Math.max(1, Math.min(step, safeMax - min))
  const rawLowerValue = clamp(Math.min(value[0], value[1]), min, safeMax)
  const rawUpperValue = clamp(Math.max(value[0], value[1]), min, safeMax)
  const lowerValue = Math.min(rawLowerValue, Math.max(min, rawUpperValue - safeStep))
  const upperValue = Math.max(rawUpperValue, Math.min(safeMax, lowerValue + safeStep))
  const lowerPercent = ((lowerValue - min) / (safeMax - min)) * 100
  const upperPercent = ((upperValue - min) / (safeMax - min)) * 100
  const [editingField, setEditingField] = useState<'lower' | 'upper' | null>(null)
  const [draftText, setDraftText] = useState('')
  const lowerText = editingField === 'lower' ? draftText : formatPriceInput(lowerValue)
  const upperText = editingField === 'upper' ? draftText : formatPriceInput(upperValue)

  const updateLowerValue = (nextValue: number) => {
    onChange?.([clamp(nextValue, min, upperValue - safeStep), upperValue])
  }

  const updateUpperValue = (nextValue: number) => {
    onChange?.([lowerValue, clamp(nextValue, lowerValue + safeStep, safeMax)])
  }

  const beginEditing = (field: 'lower' | 'upper', currentValue: number) => {
    setEditingField(field)
    setDraftText(formatPriceInput(currentValue))
  }

  const commitText = (field: 'lower' | 'upper') => {
    const nextValue = readPrice(draftText)
    const nextRange: [number, number] =
      field === 'lower'
        ? [clamp(nextValue ?? lowerValue, min, upperValue - safeStep), upperValue]
        : [lowerValue, clamp(nextValue ?? upperValue, lowerValue + safeStep, safeMax)]

    setEditingField(null)
    setDraftText('')
    onChange?.(nextRange)
    onChangeEnd?.(nextRange)
  }

  return (
    <div
      className={cn(
        'rounded-df-md border border-border-soft bg-white p-4 shadow-sm',
        className,
      )}
      dir="rtl"
    >
      <h3 className="m-0 text-sm font-extrabold text-brand-950">{label}</h3>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Input
          label="از"
          inputMode="numeric"
          value={lowerText}
          trailing={<span className="whitespace-nowrap text-[10px]">{currency}</span>}
          className="pl-14 font-bold"
          onFocus={(event) => {
            beginEditing('lower', lowerValue)
            event.currentTarget.select()
          }}
          onChange={(event) => setDraftText(formatTypedPrice(event.currentTarget.value))}
          onBlur={() => commitText('lower')}
          onKeyDown={(event) => {
            if (event.key === 'Enter') event.currentTarget.blur()
          }}
        />
        <Input
          label="تا"
          inputMode="numeric"
          value={upperText}
          trailing={<span className="whitespace-nowrap text-[10px]">{currency}</span>}
          className="pl-14 font-bold"
          onFocus={(event) => {
            beginEditing('upper', upperValue)
            event.currentTarget.select()
          }}
          onChange={(event) => setDraftText(formatTypedPrice(event.currentTarget.value))}
          onBlur={() => commitText('upper')}
          onKeyDown={(event) => {
            if (event.key === 'Enter') event.currentTarget.blur()
          }}
        />
      </div>

      <div className="relative mt-5 h-6" dir="rtl">
        <div className="absolute inset-x-0 top-2.5 h-1 rounded-full bg-border-soft" />
        <div
          className="absolute top-2.5 h-1 rounded-full bg-accent-500"
          style={{
            left: `${100 - upperPercent}%`,
            width: `${upperPercent - lowerPercent}%`,
          }}
        />
        <input
          aria-label="حداقل قیمت"
          aria-valuetext={`${persianPriceFormatter.format(lowerValue)} ${currency}`}
          className="df-range-input"
          dir="rtl"
          min={min}
          max={safeMax}
          step={safeStep}
          type="range"
          value={lowerValue}
          style={{ zIndex: lowerValue > safeMax - safeStep * 2 ? 3 : 2 }}
          onChange={(event) => updateLowerValue(Number(event.currentTarget.value))}
          onPointerUp={() => onChangeEnd?.([lowerValue, upperValue])}
          onKeyUp={() => onChangeEnd?.([lowerValue, upperValue])}
        />
        <input
          aria-label="حداکثر قیمت"
          aria-valuetext={`${persianPriceFormatter.format(upperValue)} ${currency}`}
          className="df-range-input"
          dir="rtl"
          min={min}
          max={safeMax}
          step={safeStep}
          type="range"
          value={upperValue}
          style={{ zIndex: 2 }}
          onChange={(event) => updateUpperValue(Number(event.currentTarget.value))}
          onPointerUp={() => onChangeEnd?.([lowerValue, upperValue])}
          onKeyUp={() => onChangeEnd?.([lowerValue, upperValue])}
        />
      </div>
      <div className="flex justify-between text-[10px] text-muted" dir="rtl">
        <span>{persianPriceFormatter.format(min)}</span>
        <span>{persianPriceFormatter.format(safeMax)}</span>
      </div>
    </div>
  )
}
