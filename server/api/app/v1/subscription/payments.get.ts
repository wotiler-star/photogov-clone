// GET /api/app/v1/subscription/payments —— 本人支付记录（订阅页展示用）
import { defineEventHandler, createError } from 'h3'
import { getCurrentUser } from '../../../../utils/auth'
import { listPayments } from '../../../../utils/payment'

export default defineEventHandler(async (event) => {
  const user = getCurrentUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'UNAUTHORIZED' })

  const payments = listPayments()
    .filter((p) => p.userId === user.id)
    .slice(0, 20)
    .map((p) => ({
      id: p.id,
      planId: p.planId,
      amount: p.amount,
      currency: p.currency,
      provider: p.provider,
      status: p.status,
      method: p.method,
      createdAt: p.createdAt,
      paidAt: p.paidAt
    }))

  return { payments }
})
