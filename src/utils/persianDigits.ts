const persianDigits = '۰۱۲۳۴۵۶۷۸۹'

/** Converts Western and Arabic-Indic numerals to Persian numerals. */
export function toPersianDigits(value: string) {
  return value.replace(/[0-9٠-٩]/g, (digit) => {
    const digitCode = digit.charCodeAt(0)
    const digitIndex = digitCode >= 0x0660 ? digitCode - 0x0660 : digitCode - 0x0030
    return persianDigits[digitIndex]
  })
}

/** Converts Persian and Arabic-Indic numerals to Western numerals. */
export function toWesternDigits(value: string) {
  return value.replace(/[۰-۹٠-٩]/g, (digit) => {
    const digitCode = digit.charCodeAt(0)
    return String(digitCode >= 0x06f0 ? digitCode - 0x06f0 : digitCode - 0x0660)
  })
}
