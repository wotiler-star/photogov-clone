// POST /api/app/v1/auth/change-password —— 会员中心修改密码（需验证当前密码）
import { defineEventHandler, readBody, createError } from 'h3'
import { getCurrentUser, changePassword } from '../../../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = getCurrentUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'UNAUTHORIZED' })

  const body = await readBody(event).catch(() => ({}))
  const currentPassword = String(body?.currentPassword || '')
  const newPassword = String(body?.newPassword || '')

  if (!currentPassword || !newPassword) {
    throw createError({ statusCode: 400, statusMessage: 'FIELDS_REQUIRED' })
  }

  const updated = changePassword(user.id, currentPassword, newPassword)
  return { ok: true, user: updated }
})
