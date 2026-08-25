// POST /api/app/v1/order/create  (对齐原站结账下单)
// demo 模式：校验入参，生成订单号，不做真实扣款。
import { defineEventHandler, readBody, createError } from 'h3'
import { randomUUID } from 'node:crypto'

export default defineEventHandler(async (event) => {
  const body = await readBody(event).catch(() => ({}))
  const serviceId = body?.serviceId
  const email = body?.email

  if (!serviceId) {
    throw createError({ statusCode: 400, statusMessage: 'serviceId required' })
  }

  const orderId = `PG-${Date.now().toString(36).toUpperCase()}-${randomUUID().slice(0, 4).toUpperCase()}`
  const demo = true // 无真实支付网关，仅生成订单占位

  return {
    orderId,
    serviceId,
    email: email || null,
    status: 'created',
    paid: false,
    demo,
    message:
      'Demo order created. Real payment requires a gateway key (Stripe/PayPal) — not included in this clone.'
  }
})
