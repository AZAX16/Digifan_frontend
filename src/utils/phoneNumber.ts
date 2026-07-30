import { toPersianDigits, toWesternDigits } from './persianDigits'

const PHONE_NUMBER_PATTERN = /^\+?\d{7,15}$/

export function normalizePhoneNumber(value: string) {
  return toWesternDigits(value).trim().replace(/[\s()-]/g, '')
}

export function isValidPhoneNumber(value: string) {
  return PHONE_NUMBER_PATTERN.test(normalizePhoneNumber(value))
}

export function formatPhoneNumber(value: string | null | undefined) {
  const normalizedValue = value?.trim()

  return normalizedValue?.length ? toPersianDigits(normalizedValue) : null
}
