// SMTP 邮件发送工具（基于 nodemailer）
// 通过环境变量配置；未配置时回退到控制台日志（开发/演示友好）。
import nodemailer from 'nodemailer'

const host = process.env.SMTP_HOST
const port = Number(process.env.SMTP_PORT || 465)
const user = process.env.SMTP_USER
const pass = process.env.SMTP_PASS
const secure =
  (process.env.SMTP_SECURE ?? (port === 465 ? 'true' : 'false')) === 'true'
const from = process.env.MAIL_FROM || user || 'no-reply@photogov.net'

export const mailConfigured = !!host

let transporter: nodemailer.Transporter | null = null
function getTransporter(): nodemailer.Transporter | null {
  if (!mailConfigured) return null
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: user ? { user, pass } : undefined
    })
  }
  return transporter
}

export interface MailOptions {
  to: string
  subject: string
  text: string
  html?: string
}

export async function sendMail(opts: MailOptions): Promise<boolean> {
  const tp = getTransporter()
  if (!tp) {
    // 未配置 SMTP：打印到服务端日志，便于本地开发观察邮件内容
    console.log(`[mail:dev] to=${opts.to} subject="${opts.subject}"\n${opts.text}`)
    return false
  }
  await tp.sendMail({
    from,
    to: opts.to,
    subject: opts.subject,
    text: opts.text,
    html: opts.html
  })
  return true
}

// 简单的品牌化 HTML 邮件模板
export function emailTemplate(title: string, bodyHtml: string): string {
  return `<!doctype html><html><body style="margin:0;background:#f4f6f9;font-family:Arial,Helvetica,sans-serif">
  <div style="max-width:480px;margin:0 auto;padding:24px">
    <div style="font-family:Georgia,serif;font-size:22px;font-weight:700;color:#2B3E5C">
      Photo<span style="color:#2B72E0">Gov</span>
    </div>
    <div style="margin-top:20px;background:#fff;border-radius:14px;padding:24px;color:#1f2937">
      <h1 style="font-size:18px;margin:0 0 12px">${title}</h1>
      ${bodyHtml}
    </div>
    <p style="margin-top:16px;font-size:12px;color:#94a3b8;text-align:center">
      © PhotoGov — Passport & ID Photo Maker
    </p>
  </div>
</body></html>`
}
