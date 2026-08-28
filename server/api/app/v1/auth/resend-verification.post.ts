// POST /api/app/v1/auth/resend-verification —— 重新发送验证邮件（需登录）
import { defineEventHandler, createError, getRequestURL } from 'h3'
import { getCurrentUser, createEmailVerifyToken, EMAIL_DEBUG } from '../../../../utils/auth'

export default defineEventHandler((event) => {
  const user = getCurrentUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'UNAUTHORIZED' })

  const token = createEmailVerifyToken(user.email)
  let devLink: string | undefined
  if (token) {
    const link = `${getRequestURL(event).origin}/verify-email?token=${token}`
    console.log(`[mail] to=${user.email} subject="Verify your email"\n${link}`)
    if (EMAIL_DEBUG) devLink = link
  }
  return { ok: true, devLink }
})
