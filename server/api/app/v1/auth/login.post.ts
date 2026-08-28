// POST /api/app/v1/auth/login —— 会员登录
import { defineEventHandler, readBody, createError } from 'h3'
import { findUserByEmail, verifyPassword, setSessionCookie, publicUser } from '../../../../utils/auth'

export default defineEventHandler(async (event) => {
  const body = await readBody(event).catch(() => ({}))
  const email = String(body?.email || '').trim().toLowerCase()
  const password = String(body?.password || '')

  const user = findUserByEmail(email)
  if (!user || !verifyPassword(password, user)) {
    throw createError({ statusCode: 401, statusMessage: 'INVALID_CREDENTIALS' })
  }

  setSessionCookie(event, user.id)
  return { ok: true, user: publicUser(user) }
})
