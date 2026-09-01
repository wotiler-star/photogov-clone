// POST /api/app/v1/order/:id/cancel  (登录用户取消自己的订单)
import { defineEventHandler, createError } from 'h3'
import { getCurrentUser } from '../../../../../utils/auth'
import { readJson, writeJson } from '../../../../../utils/store'

export default defineEventHandler(async (event) => {
  const id = event.context.params?.id
  const user = getCurrentUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const orders = readJson<any[]>('orders.json', [])
  const idx = orders.findIndex((o) => o.id === id)
  if (idx === -1) throw createError({ statusCode: 404, statusMessage: 'Order not found' })
  const order = orders[idx]
  if (order.userId && order.userId !== user.id)
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  if (order.status === 'cancelled')
    return { ok: true, order, message: 'already cancelled' }
  if (order.status === 'completed')
    throw createError({ statusCode: 400, statusMessage: 'Cannot cancel a completed order' })

  order.status = 'cancelled'
  order.cancelledAt = new Date().toISOString()
  orders[idx] = order
  writeJson('orders.json', orders)
  return { ok: true, order }
})
