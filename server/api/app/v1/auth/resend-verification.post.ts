// POST /api/app/v1/auth/resend-verification —— 重新发送验证邮件（需登录）
import { defineEventHandler, createError, getRequestURL } from 'h3'
import { getCurrentUser, createEmailVerifyToken, EMAIL_DEBUG } from '../../../../utils/auth'
import { sendMail, emailTemplate, mailConfigured } from '../../../../utils/mailer'

export default defineEventHandler((event) => {
  const user = getCurrentUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'UNAUTHORIZED' })

  const token = createEmailVerifyToken(user.email)
  let devLink: string | undefined
  if (token) {
    const link = `${getRequestURL(event).origin}/verify-email?token=${token}`
    sendMail({
      to: user.email,
      subject: 'Verify your email — PhotoGov',
      text: `Confirm your email by opening: ${link}`,
      html: emailTemplate(
        'Confirm your email',
        `<p>Hi ${user.name},</p><p>Please confirm your email address to activate your account:</p>
         <p><a href="${link}" style="display:inline-block;background:#2B72E0;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:600">Verify my email</a></p>
         <p style="color:#64748b;font-size:13px">Or paste this link into your browser:<br>${link}</p>`
      )
    })
    if (!mailConfigured && EMAIL_DEBUG) devLink = link
  }
  return { ok: true, devLink }
})
