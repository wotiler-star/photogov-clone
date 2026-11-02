// POST /api/app/v1/order/photo-checkout —— 单次证件照结账（演示：创建订单并即时标记为已付款）
// 服务端定价（不信任客户端金额）。演示模式下无真实扣款，等价于目标站 checkout 后解锁下载。
import { defineEventHandler, readBody, createError } from 'h3'
import { randomUUID } from 'node:crypto'
import { getCurrentUser } from '../../../../utils/auth'
import { priceForCountry } from '../../../../utils/pricing'
import { readJson, writeJson } from '../../../../utils/store'

export default defineEventHandler(async (event) => {
  const user = getCurrentUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'UNAUTHORIZED' })

  const body = await readBody(event).catch(() => ({}))
  const country = String(body?.country || 'US')
  const docName = String(body?.docName || 'ID photo')
  const docSlug = String(body?.docSlug || '')

  const price = priceForCountry(country)

  const orderId = `PG-${Date.now().toString(36).toUpperCase()}-${randomUUID().slice(0, 4).toUpperCase()}`
  const order = {
    id: orderId,
    userId: user.id,
    userEmail: user.email,
    serviceId: 'photo_hd',
    items: [{ name: docName, docSlug, qty: 1, format: 'digital' }],
    total: price.amount,
    currency: price.currency,
    region: price.region,
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
    amount: price.amount,
    currency: price.currency,
    region: price.region,
    status: 'paid',
    demo: true,
    message: 'Demo photo order created and unlocked. Real payment requires a gateway key.'
  }
})
