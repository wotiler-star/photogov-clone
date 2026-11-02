// 单次证件照（数字版）分区定价 —— 与 photogov.net /prices 区域表对齐。
// 价格按「所选证件所属国家」确定（演示站用确定性映射，避免运行时外链原站）。
// 服务端为权威定价来源；客户端 utils/pricing.ts 仅用于展示，逻辑保持一致。
export interface PhotoPrice {
  amount: number
  currency: string
  region: string
}

// 目标站 /prices 明确列出的区域数字价
const REGION: Record<string, PhotoPrice> = {
  US: { amount: 6.9, currency: 'USD', region: 'United States' },
  GB: { amount: 4.9, currency: 'GBP', region: 'United Kingdom' },
  CA: { amount: 5.9, currency: 'CAD', region: 'Canada' },
  AU: { amount: 6.2, currency: 'AUD', region: 'Australia' },
  AE: { amount: 16, currency: 'AED', region: 'United Arab Emirates' }
}

// 欧元区统一 €3.90（与 /prices 一致：德国/法国/荷兰/比利时/奥地利/瑞士/西班牙等 €3.90）
const EU_COUNTRIES = [
  'AT', 'BE', 'CH', 'DE', 'ES', 'FR', 'IE', 'IT', 'NL', 'PT',
  'GR', 'LU', 'MT', 'CY', 'SI', 'SK', 'EE', 'LV', 'LT', 'FI'
]

export function priceForCountry(code: string): PhotoPrice {
  const c = String(code || '').toUpperCase()
  if (REGION[c]) return REGION[c]
  if (EU_COUNTRIES.includes(c)) return { amount: 3.9, currency: 'EUR', region: 'Euro zone' }
  // 其余国家：from $3.90（目标站口径），以 USD 计
  return { amount: 3.9, currency: 'USD', region: 'Other countries' }
}
