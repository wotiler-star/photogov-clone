// POST /api/app/v1/order/create  (对齐原站结账下单)
// demo 模式：校验入参，关联登录用户并落盘，不做真实扣款。
import { defineEventHandler, readBody, createError } from 'h3'
import { randomUUID } from 'node:crypto'
import { getCurrentUser } from '../../../../utils/auth'
import { readJson, writeJson } from '../../../../utils/store'
import { sendMail, emailTemplate } from '../../../../utils/mailer'

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

  // 订单确认邮件（SMTP 未配置时 sendMail 回退为服务端日志，失败也不阻断下单）
  let emailSent = false
  if (order.userEmail) {
    const itemsHtml = order.items.length
      ? `<ul style="padding-left:18px;margin:12px 0">${order.items
          .map(
            (i: any) =>
              `<li style="margin:4px 0">${i.name || i.docName || serviceId}${
                i.qty ? ` × ${i.qty}` : ''
              }</li>`
          )
          .join('')}</ul>`
      : `<p style="margin:12px 0">${serviceId}</p>`

    const detailRows = [
      ['Order ID', orderId],
      ['Service', serviceId],
      ['Total', `${order.currency} ${order.total.toFixed(2)}`],
      ['Status', 'Awaiting payment']
    ]
      .map(
        ([k, v]) =>
          `<tr><td style="padding:6px 12px 6px 0;color:#64748b">${k}</td>` +
          `<td style="padding:6px 0;font-weight:600">${v}</td></tr>`
      )
      .join('')

    const bodyHtml =
      `<p style="margin:0 0 12px">Thanks for your order! We've received it and it's now awaiting payment.</p>` +
      `<table style="border-collapse:collapse;font-size:14px">${detailRows}</table>` +
      itemsHtml +
      `<p style="margin:16px 0 0;font-size:13px;color:#64748b">We'll email you again once your photos are ready to download.</p>`

    try {
      emailSent = await sendMail({
        to: order.userEmail,
        subject: `Order confirmation ${orderId} — PhotoGov`,
        text:
          `Thanks for your order!\n\nOrder ID: ${orderId}\nService: ${serviceId}\n` +
          `Total: ${order.currency} ${order.total.toFixed(2)}\nStatus: Awaiting payment\n\n` +
          `We'll notify you when your photos are ready.`,
        html: emailTemplate('Order confirmation', bodyHtml)
      })
    } catch (e) {
      console.error('[order] confirmation email failed:', e)
    }
  }

  return {
    orderId,
    serviceId,
    email: order.userEmail,
    status: 'created',
    paid: false,
    emailSent,
    demo: true,
    message:
      'Demo order created. Real payment requires a gateway key (Stripe/PayPal) — not included in this clone.'
  }
})
