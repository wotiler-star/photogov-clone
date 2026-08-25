// POST /api/admin/login  —— 校验密码并种下会话 cookie
import { defineEventHandler, readBody, setCookie } from 'h3'
import { checkPassword, expectedToken } from '../../utils/admin'

export default defineEventHandler(async (event) => {
  const body = await readBody(event).catch(() => ({}))
  const pw = body?.password || ''
  if (!checkPassword(pw)) {
    return { ok: false, error: 'Invalid password' }
  }
  setCookie(event, 'admin_token', expectedToken(), {
    httpOnly: true,
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24
  })
  return { ok: true }
})
