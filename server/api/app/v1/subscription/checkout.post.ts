// POST /api/app/v1/subscription/checkout —— 创建订阅支付会话
// 服务端定价（不信任客户端金额）；按 Provider 创建外部 checkout 并返回跳转 URL。
import { defineEventHandler, readBody, createError } from 'h3'
import { randomUUID } from 'node:crypto'
import { getCurrentUser } from '../../../../utils/auth'
import { getPlan } from '../../../../../utils/plans'
import { activeProvider, savePayment, type PaymentRecord } from '../../../../utils/payment'

function siteBase(event: any): string {
  const pub = process.env.NUXT_PUBLIC_SITE_URL || ''
  if (pub) return pub.replace(/\/+$/, '')
  const req = event.node.req
  const host = (req.headers['x-forwarded-host'] as string) || req.headers.host || 'localhost'
  // 有代理头时信任之；否则本地/内网地址用 http，其余默认 https
  const proto =
    (req.headers['x-forwarded-proto'] as string) ||
    (/^(localhost|127\.|0\.0\.0\.0|\[::1\]|192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/i.test(host) ? 'http' : 'https')
  return `${proto}://${host}`
}

export default defineEventHandler(async (event) => {
  const user = getCurrentUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'UNAUTHORIZED' })

  const body = await readBody(event).catch(() => ({}))
  const planId = String(body?.planId || '')
  const plan = getPlan(planId)
  if (!plan || plan.id === 'free')
    throw createError({ statusCode: 400, statusMessage: 'INVALID_PLAN' })

  const provider = activeProvider()
  const paymentId = `PAY-${Date.now().toString(36).toUpperCase()}-${randomUUID().slice(0, 4).toUpperCase()}`
  const base = siteBase(event)
  const locale = String(body?.locale || 'en')
  const successUrl = `${base}/${locale}/payment/return?paymentId=${paymentId}&status=success`
  const cancelUrl = `${base}/${locale}/payment/return?paymentId=${paymentId}&status=cancel`

  // 先落 pending 记录（Webhook 回调时按 id 幂等履约）
  const record: PaymentRecord = {
    id: paymentId,
    userId: user.id,
    userEmail: user.email,
    planId: plan.id,
    amount: plan.price,
    currency: 'USD',
    provider: provider.id,
    status: 'pending',
    externalId: null,
    method: null,
    createdAt: new Date().toISOString(),
    paidAt: null
  }
  savePayment(record)

  const checkout = await provider.createCheckout({
    paymentId,
    planId: plan.id,
    userEmail: user.email,
    successUrl,
    cancelUrl
  })

  record.externalId = checkout.externalId
  savePayment(record)

  return {
    ok: true,
    paymentId,
    paymentUrl: checkout.paymentUrl,
    provider: provider.id,
    demo: checkout.demo,
    amount: plan.price,
    currency: 'USD'
  }
})
