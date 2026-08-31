// POST /api/app/v1/order/create  (对齐原站结账下单)
// demo 模式：校验入参，关联登录用户并落盘，不做真实扣款。
import { defineEventHandler, readBody, createError } from 'h3'
import { randomUUID } from 'node:crypto'
import { getCurrentUser } from '../../../../utils/auth'
import { readJson, writeJson } from '../../../../utils/store'

interface OrderRecord {
  id: string
  userId: string | null
  userEmail: string | null
  serviceId: string
  items: any[]
  total: number
  currency: string
  status: string
  paid: boolean
  createdAt: string
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event).catch(() => ({}))
  const serviceId = body?.serviceId
  if (!serviceId) {
    throw createError({ statusCode: 400, statusMessage: 'serviceId required' })
  }

  const user = getCurrentUser(event)
  const orderId = `PG-${Date.now().toString(36).toUpperCase()}-${randomUUID().slice(0, 4).toUpperCase()}`
  const order: OrderRecord = {
    id: orderId,
    userId: user?.id || null,
    userEmail: body?.email || user?.email || null,
    serviceId,
    items: Array.isArray(body?.items) ? body.items : [],
    total: Number(body?.total || 0),
    currency: body?.currency || 'USD',
    status: 'created',
    paid: false,
    createdAt: new Date().toISOString()
  }

  const orders = readJson<OrderRecord[]>('orders.json', [])
  orders.unshift(order)
  writeJson('orders.json', orders)

  return {
    orderId,
    serviceId,
    email: order.userEmail,
    status: 'created',
    paid: false,
    demo: true,
    message:
      'Demo order created. Real payment requires a gateway key (Stripe/PayPal) — not included in this clone.'
  }
})
