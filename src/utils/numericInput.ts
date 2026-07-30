import { toWesternDigits } from './persianDigits'

export function parseNonNegativePrice(value: string) {
  const normalizedValue = toWesternDigits(value)
    .replace(/[٬,\s]/g, '')
    .replace('٫', '.')

  if (!normalizedValue) return null

  const price = Number(normalizedValue)

  return Number.isFinite(price) && price >= 0 && price <= Number.MAX_SAFE_INTEGER
    ? price
    : null
}

export function parseNonNegativeInt32(value: string) {
  const normalizedValue = toWesternDigits(value).replace(/[٬,\s]/g, '')

  if (!/^\d+$/.test(normalizedValue)) return null

  const parsedValue = Number(normalizedValue)

  return Number.isSafeInteger(parsedValue) && parsedValue <= 2_147_483_647
    ? parsedValue
    : null
}
