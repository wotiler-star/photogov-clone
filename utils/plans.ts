// 会员套餐配置（前后端共用，Nuxt 会自动导入顶层 utils/）
export interface Plan {
  id: 'free' | 'premium_monthly' | 'premium_annual'
  i18n: string // 名称基础键：plans.free / plans.premium
  price: number
  interval: 'month' | 'year' | null
  popular?: boolean
  features: string[] // i18n 功能键
}

export const PLANS: Plan[] = [
  {
    id: 'free',
    i18n: 'plans.free',
    price: 0,
    interval: null,
    features: ['plans.feat.unlimited', 'plans.feat.formats']
  },
  {
    id: 'premium_monthly',
    i18n: 'plans.premium',
    price: 9.99,
    interval: 'month',
    features: [
      'plans.feat.unlimited',
      'plans.feat.formats',
      'plans.feat.hd',
      'plans.feat.nobg',
      'plans.feat.priority',
      'plans.feat.support'
    ]
  },
  {
    id: 'premium_annual',
    i18n: 'plans.premium',
    price: 79.99,
    interval: 'year',
    popular: true,
    savePercent: 33,
    features: [
      'plans.feat.unlimited',
      'plans.feat.formats',
      'plans.feat.hd',
      'plans.feat.nobg',
      'plans.feat.priority',
      'plans.feat.support'
    ]
  }
]

export function getPlan(id: string): Plan | undefined {
  return PLANS.find((p) => p.id === id)
}

export interface PlanState {
  isPremium: boolean
  expired: boolean
  expiresAt: string | null
}

export function planStatus(user: {
  plan: 'free' | 'premium'
  planExpiresAt: string | null
} | null): PlanState {
  if (!user) return { isPremium: false, expired: false, expiresAt: null }
  const expired =
    user.plan === 'premium' &&
    user.planExpiresAt !== null &&
    Date.now() > new Date(user.planExpiresAt).getTime()
  return {
    isPremium: user.plan === 'premium' && !expired,
    expired,
    expiresAt: user.planExpiresAt
  }
}
