// POST /api/app/v1/auth/register —— 会员注册
import { defineEventHandler, readBody, createError, getRequestURL } from 'h3'
import {
  createUser,
  setSessionCookie,
  publicUser,
  createEmailVerifyToken,
  EMAIL_DEBUG
} from '../../../../utils/auth'

export default defineEventHandler(async (event) => {
  const body = await readBody(event).catch(() => ({}))
  const name = String(body?.name || '').trim()
  const email = String(body?.email || '').trim().toLowerCase()
  const password = String(body?.password || '')

  if (!name) throw createError({ statusCode: 400, statusMessage: 'NAME_REQUIRED' })
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw createError({ statusCode: 400, statusMessage: 'INVALID_EMAIL' })
  }
  if (password.length < 8) {
    throw createError({ statusCode: 400, statusMessage: 'PASSWORD_TOO_SHORT' })
  }

  try {
    const user = createUser({ name, email, password })
    setSessionCookie(event, user.id)

    // 发送邮箱验证邮件
    const token = createEmailVerifyToken(email)
    let devLink: string | undefined
    if (token) {
      const link = `${getRequestURL(event).origin}/verify-email?token=${token}`
      console.log(`[mail] to=${email} subject="Verify your email"\n${link}`)
      if (EMAIL_DEBUG) devLink = link
    }

    return { ok: true, user: publicUser(user), devLink }
  } catch (e: any) {
    if (e?.statusCode) throw e
    throw createError({ statusCode: 409, statusMessage: 'EMAIL_EXISTS' })
  }
})
