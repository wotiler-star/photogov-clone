// POST /api/app/v1/auth/cancel-deletion —— 取消待删除的账户
import { defineEventHandler, createError } from 'h3'
import { getCurrentUser, cancelAccountDeletion } from '../../../../utils/auth'

export default defineEventHandler((event) => {
  const user = getCurrentUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'UNAUTHORIZED' })

  const updated = cancelAccountDeletion(user.id)
  return { ok: true, user: updated }
})
