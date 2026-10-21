// POST /api/app/v1/auth/delete-account —— 软删除账户（14 天恢复期，对标目标站）
import { defineEventHandler, createError } from 'h3'
import { getCurrentUser, scheduleAccountDeletion } from '../../../../utils/auth'

export default defineEventHandler((event) => {
  const user = getCurrentUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'UNAUTHORIZED' })

  const updated = scheduleAccountDeletion(user.id)
  return { ok: true, user: updated }
})
