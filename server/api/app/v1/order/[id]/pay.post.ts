// POST /api/app/v1/order/:id/pay  (登录用户标记自己的订单为已付款)
// demo 模式：无真实支付网关，此处将订单状态推进到 paid 并发送确认邮件。
import { defineEventHandler, createError } from 'h3'
import { getCurrentUser } from '../../../../../utils/auth'
import { readJson, writeJson } from '../../../../../utils/store'
import { sendMail, emailTemplate } from '../../../../../utils/mailer'

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
    throw createError({ statusCode: 400, statusMessage: 'Order already cancelled' })
  if (order.status === 'paid' || order.status === 'completed')
    return { ok: true, order, message: 'already paid' }

  order.status = 'paid'
  order.paid = true
  order.paidAt = new Date().toISOString()
  orders[idx] = order
  writeJson('orders.json', orders)

  if (order.userEmail) {
    try {
      await sendMail({
        to: order.userEmail,
        subject: `Payment received — Order ${order.id}`,
        text: `We've received your payment for order ${order.id}. We'll prepare your photos now and email you when they're ready.`,
        html: emailTemplate(
          'Payment received',
          `<p>We've received your payment for order <strong>${order.id}</strong>.</p>` +
            `<p>Your photos are being prepared and you'll get another email once they're ready to download.</p>`
        )
      })
    } catch (e) {
      console.error('[order] paid email failed:', e)
    }
  }
  return { ok: true, order }
})
