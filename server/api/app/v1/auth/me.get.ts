// GET /api/app/v1/auth/me —— 读取当前会话用户
import { defineEventHandler } from 'h3'
import { getCurrentUser } from '../../../../utils/auth'

export default defineEventHandler((event) => {
  const user = getCurrentUser(event)
  return { user }
})
