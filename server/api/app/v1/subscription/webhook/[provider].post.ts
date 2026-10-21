// POST /api/app/v1/subscription/webhook/:provider —— 支付网关回调（真实 Webhook）
// Stripe：校验 Stripe-Signature（HMAC-SHA256 + 时间戳容忍窗口），处理 checkout.session.completed
// Demo：校验 X-Demo-Signature，处理 payment.completed
// 履约幂等：重复回调直接返回 200 received。
import { defineEventHandler, readRawBody } from 'h3'
import { activeProvider, processWebhookCallback } from '../../../../../utils/payment'

export default defineEventHandler(async (event) => {
  const providerParam = String(event.context.params?.provider || '')
  const provider = activeProvider()
  if (providerParam !== provider.id)
    return { received: false, ignored: 'unknown provider' }

  const rawBody = (await readRawBody(event, false)) || ''
  const headers: Record<string, string | undefined> = {
    'stripe-signature': event.node.req.headers['stripe-signature'] as string | undefined,
    'x-demo-signature': event.node.req.headers['x-demo-signature'] as string | undefined
  }

  const { status, body } = await processWebhookCallback(provider.id, rawBody, headers)
  event.node.res.statusCode = status
  return body
})
