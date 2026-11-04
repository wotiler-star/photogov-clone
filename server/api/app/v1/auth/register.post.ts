// POST /api/app/v1/auth/register —— 会员注册
import { defineEventHandler, readBody, createError, getRequestURL } from 'h3'
import {
  createUser,
  setSessionCookie,
  publicUser,
  createEmailVerifyToken,
  EMAIL_DEBUG,
  validatePasswordStrength
} from '../../../../utils/auth'
import { sendMail, emailTemplate, mailConfigured } from '../../../../utils/mailer'

export default defineEventHandler(async (event) => {
  const body = await readBody(event).catch(() => ({}))
  const name = String(body?.name || '').trim()
  const email = String(body?.email || '').trim().toLowerCase()
  const password = String(body?.password || '')

  if (!name) throw createError({ statusCode: 400, statusMessage: 'NAME_REQUIRED' })
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw createError({ statusCode: 400, statusMessage: 'INVALID_EMAIL' })
  }
  // 与改密 / 重置 / 前端一致：大小写字母 + 数字 + 符号，至少 8 位
  if (!validatePasswordStrength(password)) {
    throw createError({ statusCode: 400, statusMessage: 'WEAK_PASSWORD' })
  }

  try {
    const user = createUser({ name, email, password })
    setSessionCookie(event, user.id)

    // 发送邮箱验证邮件
    const token = createEmailVerifyToken(email)
    let devLink: string | undefined
    let mailDelivered = false
    if (token) {
      const link = `${getRequestURL(event).origin}/verify-email?token=${token}`
      try {
        mailDelivered = await sendMail({
          to: email,
          subject: 'Verify your email — PhotoGov',
          text: `Welcome to PhotoGov! Confirm your email by opening: ${link}`,
          html: emailTemplate(
            'Confirm your email',
            `<p>Hi ${name},</p><p>Thanks for joining PhotoGov. Please confirm your email address to activate your account:</p>
             <p><a href="${link}" style="display:inline-block;background:#2B72E0;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:600">Verify my email</a></p>
             <p style="color:#64748b;font-size:13px">Or paste this link into your browser:<br>${link}</p>`
          )
        })
      } catch (e) {
        console.error('[register] verify email failed:', e)
        mailDelivered = false
      }
      // 仅在未配置 SMTP 且开启了调试（本地 EMAIL_DEBUG=1）时回传操作链接，便于本地激活。
      if (!mailConfigured && EMAIL_DEBUG) devLink = link
    }

    return { ok: true, user: publicUser(user), devLink, mailDelivered }
  } catch (e: any) {
    if (e?.statusCode) throw e
    throw createError({ statusCode: 409, statusMessage: 'EMAIL_EXISTS' })
  }
})
