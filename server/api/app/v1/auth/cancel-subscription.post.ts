// POST /api/app/v1/auth/cancel-subscription —— 取消订阅（降级为免费版）
import { defineEventHandler, createError } from 'h3'
import { getCurrentUser, setPlan } from '../../../../utils/auth'

export default defineEventHandler((event) => {
  const user = getCurrentUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'UNAUTHORIZED' })
  const updated = setPlan(user.id, 'free', null)
  return { ok: true, user: updated }
})
