// POST /api/app/v1/subscription/auto-renewal —— 会员中心开关自动续费
import { defineEventHandler, readBody, createError } from 'h3'
import { getCurrentUser, setAutoRenewal } from '../../../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = getCurrentUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'UNAUTHORIZED' })

  const body = await readBody(event).catch(() => ({}))
  const updated = setAutoRenewal(user.id, Boolean(body?.enabled))
  return { ok: true, user: updated }
})
