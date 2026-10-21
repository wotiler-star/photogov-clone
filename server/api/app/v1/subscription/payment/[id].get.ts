// GET /api/app/v1/subscription/payment/:id —— 查询本人支付记录状态（支付返回页轮询用）
import { defineEventHandler, createError } from 'h3'
import { getCurrentUser } from '../../../../../utils/auth'
import { findPayment } from '../../../../../utils/payment'

export default defineEventHandler(async (event) => {
  const user = getCurrentUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'UNAUTHORIZED' })

  const id = event.context.params?.id
  const record = findPayment(String(id))
  if (!record) throw createError({ statusCode: 404, statusMessage: 'PAYMENT_NOT_FOUND' })
  if (record.userId && record.userId !== user.id)
    throw createError({ statusCode: 403, statusMessage: 'FORBIDDEN' })

  return {
    payment: {
      id: record.id,
      planId: record.planId,
      amount: record.amount,
      currency: record.currency,
      provider: record.provider,
      status: record.status,
      method: record.method,
      createdAt: record.createdAt,
      paidAt: record.paidAt
    }
  }
})
