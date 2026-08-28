// POST /api/app/v1/auth/reset-password —— 用令牌设置新密码
import { defineEventHandler, readBody, createError } from 'h3'
import { resetPasswordWithToken } from '../../../../utils/auth'

export default defineEventHandler(async (event) => {
  const body = await readBody(event).catch(() => ({}))
  const token = String(body?.token || '')
  const password = String(body?.password || '')

  if (password.length < 8) {
    throw createError({ statusCode: 400, statusMessage: 'PASSWORD_TOO_SHORT' })
  }
  const user = resetPasswordWithToken(token, password)
  if (!user) throw createError({ statusCode: 400, statusMessage: 'INVALID_OR_EXPIRED' })
  return { ok: true, user }
})
