// POST /api/app/v1/auth/forgot-password —— 申请重置密码（不泄露邮箱是否存在）
import { defineEventHandler, readBody, getRequestURL } from 'h3'
import { createPasswordResetToken, EMAIL_DEBUG } from '../../../../utils/auth'
import { sendMail, emailTemplate, mailConfigured } from '../../../../utils/mailer'

export default defineEventHandler(async (event) => {
  const body = await readBody(event).catch(() => ({}))
  const email = String(body?.email || '').trim().toLowerCase()

  const token = createPasswordResetToken(email)
  let devLink: string | undefined
  if (token) {
    const link = `${getRequestURL(event).origin}/reset-password?token=${token}`
    sendMail({
      to: email,
      subject: 'Reset your password — PhotoGov',
      text: `Reset your PhotoGov password by opening: ${link}`,
      html: emailTemplate(
        'Reset your password',
        `<p>We received a request to reset your PhotoGov password.</p>
         <p><a href="${link}" style="display:inline-block;background:#2B72E0;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:600">Reset password</a></p>
         <p style="color:#64748b;font-size:13px">This link expires in 1 hour. If you didn't request this, you can ignore the email.<br>${link}</p>`
      )
    })
    if (!mailConfigured && EMAIL_DEBUG) devLink = link
  }
  // 无论邮箱是否存在都返回成功，避免账号枚举
  return { ok: true, devLink }
})
