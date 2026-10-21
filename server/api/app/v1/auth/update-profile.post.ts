// POST /api/app/v1/auth/update-profile —— 更新个人资料（姓名）
import { defineEventHandler, readBody, createError } from 'h3'
import { getCurrentUser, updateProfile } from '../../../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = getCurrentUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'UNAUTHORIZED' })

  const body = await readBody(event).catch(() => ({}))
  const updated = updateProfile(user.id, String(body?.name || ''))
  return { ok: true, user: updated }
})
