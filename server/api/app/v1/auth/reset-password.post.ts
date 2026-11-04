// POST /api/app/v1/auth/reset-password —— 用令牌设置新密码
import { defineEventHandler, readBody, createError } from 'h3'
import { resetPasswordWithToken, validatePasswordStrength } from '../../../../utils/auth'

export default defineEventHandler(async (event) => {
  const body = await readBody(event).catch(() => ({}))
  const token = String(body?.token || '')
  const password = String(body?.password || '')

  // 与注册 / 改密一致：大小写字母 + 数字 + 符号，至少 8 位
  if (!validatePasswordStrength(password)) {
    throw createError({ statusCode: 400, statusMessage: 'WEAK_PASSWORD' })
  }
  const user = resetPasswordWithToken(token, password)
  if (!user) throw createError({ statusCode: 400, statusMessage: 'INVALID_OR_EXPIRED' })
  return { ok: true, user }
})
