// POST /api/app/v1/subscription/demo-pay —— Demo 收银台的「确认付款」入口
// 仅 demo 模式可用：服务端构造带签名的 payment.completed 回调报文，
// 送入与真实 Webhook 完全相同的验签→履约链路（processWebhookCallback），
// 因此本地冒烟测试覆盖的就是真实回调路径。
import { defineEventHandler, readBody, createError } from 'h3'
import { createHmac } from 'node:crypto'
import { getCurrentUser } from '../../../../utils/auth'
import { findPayment, markPaymentStatus, processWebhookCallback } from '../../../../utils/payment'

const DEMTOKEN = process.env.PAYMENT_DEMO_TOKEN || 'demo'

export default defineEventHandler(async (event) => {
  const user = getCurrentUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'UNAUTHORIZED' })

  const body = await readBody(event).catch(() => ({}))
  const paymentId = String(body?.paymentId || '')
  const action = String(body?.action || 'pay') // pay | cancel

  const record = findPayment(paymentId)
  if (!record) throw createError({ statusCode: 404, statusMessage: 'PAYMENT_NOT_FOUND' })
  if (record.userId && record.userId !== user.id)
    throw createError({ statusCode: 403, statusMessage: 'FORBIDDEN' })

  if (action === 'cancel') {
    const updated = markPaymentStatus(paymentId, 'cancelled')
    return { ok: true, status: updated?.status || 'cancelled' }
  }
  if (record.status === 'paid') return { ok: true, status: 'paid' }

  // 构造与真实网关一致的 JSON 报文并用 demo 密钥签名，走完整验签链路
  const payload = JSON.stringify({
    type: 'payment.completed',
    paymentId,
    externalId: record.externalId || `demo_${paymentId}`,
    method: 'Demo card •••• 4242'
  })
  const signature = createHmac('sha256', DEMTOKEN).update(payload, 'utf8').digest('hex')

  const { status, body: result } = await processWebhookCallback('demo', payload, {
    'x-demo-signature': signature
  })
  event.node.res.statusCode = status
  return result
})
