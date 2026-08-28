// POST /api/app/v1/auth/subscribe —— 会员订阅（演示：直接升级套餐并设定到期时间）
import { defineEventHandler, readBody, createError } from 'h3'
import { getCurrentUser, setPlan } from '../../../../utils/auth'

// 套餐 id -> 订阅天数
const DURATION: Record<string, number> = {
  premium_monthly: 30,
  premium_annual: 365
}

export default defineEventHandler(async (event) => {
  const user = getCurrentUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'UNAUTHORIZED' })

  const body = await readBody(event).catch(() => ({}))
  const planId = String(body?.plan || '')
  const days = DURATION[planId]
  if (!days) throw createError({ statusCode: 400, statusMessage: 'INVALID_PLAN' })

  const expiresAt = new Date(Date.now() + days * 24 * 3600 * 1000).toISOString()
  const updated = setPlan(user.id, 'premium', expiresAt)
  return { ok: true, user: updated }
})
