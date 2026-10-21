// 支付 Provider 抽象层
// - 配置了 STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET → 走真实 Stripe Checkout + Webhook 验签
// - 未配置（或 PAYMENT_DEMO_MODE=1）→ 走内置 Demo 网关（/payment/simulate 模拟收银台，回调链路与真实网关一致）
// 所有 Provider 都遵循同一契约：createCheckout 创建外部会话，verifyWebhook 验签，fulfill 幂等履约。
import { createHmac, timingSafeEqual } from 'node:crypto'
import { getPlan } from '../../utils/plans'
import { setPlan } from './auth'
import { readJson, writeJson } from './store'
import { sendMail, emailTemplate } from './mailer'

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'cancelled' | 'refunded'

export interface PaymentRecord {
  id: string
  userId: string | null
  userEmail: string | null
  planId: string
  amount: number // 单位：美元（小数）
  currency: string
  provider: string
  status: PaymentStatus
  externalId: string | null // 网关侧会话/支付意图 ID
  method: string | null // 支付方式描述（如 "Visa •••• 4242"）
  createdAt: string
  paidAt: string | null
}

export interface CheckoutInput {
  paymentId: string
  planId: string
  userEmail: string
  successUrl: string
  cancelUrl: string
}

export interface CheckoutResult {
  externalId: string
  paymentUrl: string
  demo: boolean
}

export interface WebhookOutcome {
  ok: boolean
  paymentId: string | null
  status: PaymentStatus | null
  message: string
}

export interface PaymentProvider {
  id: string
  demo: boolean
  createCheckout(input: CheckoutInput): Promise<CheckoutResult>
  verifyWebhook(rawBody: string, headers: Record<string, string | undefined>): Promise<{
    valid: boolean
    event?: { type: string; externalId: string | null; paymentId: string | null; method?: string }
    reason?: string
  }>
}

// ---------- 存储 ----------

const FILE = 'payments.json'

export function listPayments(): PaymentRecord[] {
  return readJson<PaymentRecord[]>(FILE, [])
}

export function findPayment(id: string): PaymentRecord | undefined {
  return listPayments().find((p) => p.id === id)
}

export function savePayment(record: PaymentRecord) {
  const all = listPayments()
  const idx = all.findIndex((p) => p.id === record.id)
  if (idx === -1) all.unshift(record)
  else all[idx] = record
  writeJson(FILE, all)
}

// ---------- Provider 选择 ----------

const STRIPE_KEY = process.env.STRIPE_SECRET_KEY || ''
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || ''
const DEMO_MODE = process.env.PAYMENT_DEMO_MODE === '1'

export function activeProvider(): PaymentProvider {
  if (!DEMO_MODE && STRIPE_KEY && STRIPE_WEBHOOK_SECRET) return stripeProvider
  return demoProvider
}

// ---------- Stripe（真实网关） ----------

function stripeForm(fields: Record<string, string>) {
  return Object.entries(fields)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&')
}

const stripeProvider: PaymentProvider = {
  id: 'stripe',
  demo: false,

  async createCheckout(input) {
    const plan = getPlan(input.planId)
    if (!plan) throw new Error('INVALID_PLAN')
    const amountCents = Math.round(plan.price * 100)
    const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${STRIPE_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: stripeForm({
        mode: 'payment',
        success_url: input.successUrl,
        cancel_url: input.cancelUrl,
        customer_email: input.userEmail,
        'line_items[0][quantity]': '1',
        'line_items[0][price_data][currency]': 'usd',
        'line_items[0][price_data][unit_amount]': String(amountCents),
        'line_items[0][price_data][product_data][name]': `PhotoGov Premium (${plan.interval === 'year' ? 'Annual' : 'Monthly'})`,
        'metadata[paymentId]': input.paymentId,
        'metadata[planId]': input.planId,
        payment_intent_data: `{"metadata":{"paymentId":"${input.paymentId}"}}`
      })
    })
    if (!res.ok) {
      const text = await res.text()
      throw new Error(`STRIPE_SESSION_FAILED: ${res.status} ${text.slice(0, 300)}`)
    }
    const session = (await res.json()) as { id: string; url: string }
    return { externalId: session.id, paymentUrl: session.url, demo: false }
  },

  async verifyWebhook(rawBody, headers) {
    const header = headers['stripe-signature']
    if (!header) return { valid: false, reason: 'missing stripe-signature' }

    // 解析 t=timestamp,v1=signature（可能多个 v1）
    const parts: Record<string, string[]> = {}
    for (const item of header.split(',')) {
      const [k, v] = item.split('=')
      if (k && v) (parts[k] = parts[k] || []).push(v)
    }
    const timestamp = parts.t?.[0]
    const signatures = parts.v1 || []
    if (!timestamp || signatures.length === 0)
      return { valid: false, reason: 'malformed stripe-signature' }

    // 防重放：5 分钟容忍窗口
    const age = Math.abs(Date.now() / 1000 - Number(timestamp))
    if (!Number.isFinite(age) || age > 300)
      return { valid: false, reason: 'timestamp outside tolerance' }

    const expected = createHmac('sha256', STRIPE_WEBHOOK_SECRET)
      .update(`${timestamp}.${rawBody}`, 'utf8')
      .digest('hex')
    const ok = signatures.some(
      (sig) => sig.length === expected.length && timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
    )
    if (!ok) return { valid: false, reason: 'signature mismatch' }

    let payload: any
    try {
      payload = JSON.parse(rawBody)
    } catch {
      return { valid: false, reason: 'invalid json payload' }
    }
    const type = String(payload?.type || '')
    const obj = payload?.data?.object || {}
    const externalId = obj.id || null
    const paymentId = obj.metadata?.paymentId || obj.payment_intent || null
    // 从 PaymentIntent 上取卡片信息（session.completed 时 intent 在 obj.payment_intent，此处仅尽力而为）
    const method =
      obj.payment_method_types?.[0] ||
      obj.charges?.data?.[0]?.payment_method_details?.card?.brand ||
      null
    return {
      valid: true,
      event: { type, externalId, paymentId, method: method ? String(method) : undefined }
    }
  }
}

// ---------- Demo 网关（本地模拟，链路与真实网关一致） ----------

const DEMTOKEN = process.env.PAYMENT_DEMO_TOKEN || 'demo'

function demoSign(body: string, token: string) {
  return createHmac('sha256', token).update(body, 'utf8').digest('hex')
}

const demoProvider: PaymentProvider = {
  id: 'demo',
  demo: true,

  async createCheckout(input) {
    // 收银台页面（本站前端页），用户点击 Pay 时会带上签名回调我们的 webhook 端点
    const localeBase = input.successUrl.replace(/\/payment\/return.*$/, '')
    const paymentUrl = `${localeBase}/payment/simulate?paymentId=${encodeURIComponent(input.paymentId)}&demo=1`
    return { externalId: `demo_${input.paymentId}`, paymentUrl, demo: true }
  },

  async verifyWebhook(rawBody, headers) {
    const sig = headers['x-demo-signature']
    if (!sig) return { valid: false, reason: 'missing x-demo-signature' }
    const expected = demoSign(rawBody, DEMTOKEN)
    if (sig.length !== expected.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(expected)))
      return { valid: false, reason: 'signature mismatch' }
    let payload: any
    try {
      payload = JSON.parse(rawBody)
    } catch {
      return { valid: false, reason: 'invalid json payload' }
    }
    return {
      valid: true,
      event: {
        type: String(payload?.type || 'payment.completed'),
        externalId: payload?.externalId || null,
        paymentId: payload?.paymentId || null,
        method: payload?.method || 'Demo card'
      }
    }
  }
}

// ---------- 回调处理（webhook 端点与 demo 收银台共用同一条验签→履约链路） ----------

export async function processWebhookCallback(
  providerId: string,
  rawBody: string,
  headers: Record<string, string | undefined>
): Promise<{ status: number; body: Record<string, unknown> }> {
  const provider = activeProvider()
  if (providerId !== provider.id)
    return { status: 404, body: { ignored: 'unknown provider' } }

  const result = await provider.verifyWebhook(rawBody, headers)
  if (!result.valid || !result.event)
    return { status: 400, body: { ignored: result.reason || 'INVALID_SIGNATURE' } }

  const ev = result.event
  const completed =
    provider.id === 'stripe'
      ? ev.type === 'checkout.session.completed' || ev.type === 'payment_intent.succeeded'
      : ev.type === 'payment.completed'
  const failed =
    provider.id === 'stripe'
      ? ev.type === 'checkout.session.expired' || ev.type === 'payment_intent.payment_failed'
      : ev.type === 'payment.failed'

  // 通过 metadata 关联本地支付记录
  let paymentId = ev.paymentId
  if (!paymentId && ev.externalId) {
    const hit = listPayments().find((p) => p.externalId === ev.externalId)
    paymentId = hit?.id || null
  }
  if (!paymentId) return { status: 200, body: { received: true, ignored: 'no payment reference' } }

  if (failed) {
    markPaymentStatus(paymentId, 'failed')
    return { status: 200, body: { received: true, paymentId, status: 'failed' } }
  }
  if (!completed)
    return { status: 200, body: { received: true, paymentId, ignored: ev.type } }

  const record = findPayment(paymentId)
  if (!record) return { status: 200, body: { received: true, ignored: 'payment not found' } }

  const outcome = await fulfillPayment(record, {
    method: ev.method || undefined,
    externalId: ev.externalId || undefined
  })
  return { status: 200, body: { received: true, paymentId, status: outcome.status, message: outcome.message } }
}

// ---------- 履约（幂等） ----------

const PLAN_DURATION: Record<string, number> = {
  premium_monthly: 30,
  premium_annual: 365
}

export async function fulfillPayment(
  record: PaymentRecord,
  opts: { method?: string; externalId?: string } = {}
): Promise<WebhookOutcome> {
  if (record.status === 'paid')
    return { ok: true, paymentId: record.id, status: 'paid', message: 'already paid' }
  if (record.status === 'cancelled' || record.status === 'refunded')
    return { ok: false, paymentId: record.id, status: record.status, message: 'payment not payable' }

  const days = PLAN_DURATION[record.planId]
  if (!days) return { ok: false, paymentId: record.id, status: record.status, message: 'unknown plan' }

  // 1) 推进支付记录
  record.status = 'paid'
  record.paidAt = new Date().toISOString()
  if (opts.externalId) record.externalId = opts.externalId
  if (opts.method) record.method = opts.method
  savePayment(record)

  // 2) 升级用户套餐（自支付完成起算一个订阅周期）
  if (record.userId) {
    const expiresAt = new Date(Date.now() + days * 24 * 3600 * 1000).toISOString()
    setPlan(record.userId, 'premium', expiresAt)
  }

  // 3) 确认邮件（SMTP 未配置时落到控制台）
  if (record.userEmail) {
    try {
      await sendMail({
        to: record.userEmail,
        subject: `Payment received — PhotoGov Premium`,
        text:
          `We've received your payment (${record.currency} ${record.amount.toFixed(2)}).\n` +
          `Your Premium plan is now active. Payment ID: ${record.id}`,
        html: emailTemplate(
          'Payment received',
          `<p>We've received your payment of <strong>${record.currency} ${record.amount.toFixed(2)}</strong>.</p>` +
            `<p>Your Premium plan is now active. Payment ID: <strong>${record.id}</strong>.</p>`
        )
      })
    } catch (e) {
      console.error('[payment] confirmation email failed:', e)
    }
  }

  return { ok: true, paymentId: record.id, status: 'paid', message: 'fulfilled' }
}

export function markPaymentStatus(
  id: string,
  status: PaymentStatus,
  extra: Partial<PaymentRecord> = {}
): PaymentRecord | null {
  const record = findPayment(id)
  if (!record) return null
  record.status = status
  Object.assign(record, extra)
  savePayment(record)
  return record
}
