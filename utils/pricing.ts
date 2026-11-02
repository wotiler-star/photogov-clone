// 客户端分区定价（展示用，逻辑与 server/utils/pricing.ts 保持一致）
export interface PhotoPrice {
  amount: number
  currency: string
  region: string
}

const REGION: Record<string, PhotoPrice> = {
  US: { amount: 6.9, currency: 'USD', region: 'United States' },
  GB: { amount: 4.9, currency: 'GBP', region: 'United Kingdom' },
  CA: { amount: 5.9, currency: 'CAD', region: 'Canada' },
  AU: { amount: 6.2, currency: 'AUD', region: 'Australia' },
  AE: { amount: 16, currency: 'AED', region: 'United Arab Emirates' }
}

const EU_COUNTRIES = [
  'AT', 'BE', 'CH', 'DE', 'ES', 'FR', 'IE', 'IT', 'NL', 'PT',
  'GR', 'LU', 'MT', 'CY', 'SI', 'SK', 'EE', 'LV', 'LT', 'FI'
]

export function priceForCountry(code: string): PhotoPrice {
  const c = String(code || '').toUpperCase()
  if (REGION[c]) return REGION[c]
  if (EU_COUNTRIES.includes(c)) return { amount: 3.9, currency: 'EUR', region: 'Euro zone' }
  return { amount: 3.9, currency: 'USD', region: 'Other countries' }
}

export function formatPrice(p: PhotoPrice, locale = 'en'): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: p.currency,
      maximumFractionDigits: 2
    }).format(p.amount)
  } catch {
    return `${p.currency} ${p.amount.toFixed(2)}`
  }
}
