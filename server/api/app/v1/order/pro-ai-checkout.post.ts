// POST /api/app/v1/order/pro-ai-checkout
// Pro AI Photos（+9 PRO AI Photos，$6.90）一次性结账。
// demo 模式：需登录，服务端固定 $6.90 USD，即时标记 paid 并落盘 orders.json。
import { defineEventHandler, readBody, createError } from 'h3'
import { randomUUID } from 'node:crypto'
import { getCurrentUser } from '../../../../utils/auth'
import { readJson, writeJson } from '../../../../utils/store'

// 与目标站 orderServices.json 的 pro_photos 一致
const PRO_AI = { amount: 6.9, currency: 'USD', serviceId: 'pro_ai', name: '+9 PRO AI Photos' }

export default defineEventHandler(async (event) => {
  const user = getCurrentUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'UNAUTHORIZED' })

  const body = await readBody(event).catch(() => ({}))
  const count = Math.min(Math.max(Number(body?.count) || 9, 1), 30)
  const orderId = `PG-${Date.now().toString(36).toUpperCase()}-${randomUUID().slice(0, 4).toUpperCase()}`

  const order = {
    id: orderId,
    userId: user.id,
    userEmail: user.email,
    serviceId: PRO_AI.serviceId,
    items: [
      {
        name: PRO_AI.name,
        serviceId: PRO_AI.serviceId,
        qty: count,
        format: 'digital'
      }
    ],
    total: PRO_AI.amount,
    currency: PRO_AI.currency,
    status: 'paid',
    paid: true,
    createdAt: new Date().toISOString(),
    paidAt: new Date().toISOString()
  }

  const orders = readJson<any[]>('orders.json', [])
  orders.unshift(order)
  writeJson('orders.json', orders)

  return {
    ok: true,
    orderId,
    amount: PRO_AI.amount,
    currency: PRO_AI.currency,
    serviceId: PRO_AI.serviceId,
    count,
    status: 'paid',
    demo: true,
    message: 'Pro AI order created (demo: payment auto-confirmed).'
  }
})
