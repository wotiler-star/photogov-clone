// POST /api/admin/logout  —— 清除会话 cookie
import { defineEventHandler, deleteCookie } from 'h3'

export default defineEventHandler((event) => {
  deleteCookie(event, 'admin_token', { path: '/' })
  return { ok: true }
})
