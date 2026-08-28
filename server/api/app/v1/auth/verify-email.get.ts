// GET /api/app/v1/auth/verify-email?token=xxx —— 校验邮箱验证令牌
import { defineEventHandler, getQuery, createError } from 'h3'
import { verifyEmailToken } from '../../../../utils/auth'

export default defineEventHandler((event) => {
  const q = getQuery(event)
  const token = String(q.token || '')
  const user = verifyEmailToken(token)
  if (!user) throw createError({ statusCode: 400, statusMessage: 'INVALID_OR_EXPIRED' })
  return { ok: true, user }
})
