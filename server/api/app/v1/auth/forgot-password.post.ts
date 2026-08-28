// POST /api/app/v1/auth/forgot-password —— 申请重置密码（不泄露邮箱是否存在）
import { defineEventHandler, readBody, getRequestURL } from 'h3'
import { createPasswordResetToken, EMAIL_DEBUG } from '../../../../utils/auth'

export default defineEventHandler(async (event) => {
  const body = await readBody(event).catch(() => ({}))
  const email = String(body?.email || '').trim().toLowerCase()

  const token = createPasswordResetToken(email)
  let devLink: string | undefined
  if (token && EMAIL_DEBUG) {
    devLink = `${getRequestURL(event).origin}/reset-password?token=${token}`
    console.log(`[mail] to=${email} subject="Reset your password"\n${devLink}`)
  }
  // 无论邮箱是否存在都返回成功，避免账号枚举
  return { ok: true, devLink }
})
