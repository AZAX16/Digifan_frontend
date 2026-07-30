export function formatCurrencyLabel(value: string | null | undefined) {
  const trimmedValue = value?.trim()

  if (!trimmedValue) return 'تومان'

  const normalizedValue = trimmedValue.toLowerCase()
  if (normalizedValue === 'toman' || normalizedValue === 'tomans' || normalizedValue === 'تومن') {
    return 'تومان'
  }

  return trimmedValue
}
