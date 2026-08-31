// GET /api/app/v1/order/my —— 当前用户的「我的订单」
import { defineEventHandler } from 'h3'
import { getCurrentUser } from '../../../../utils/auth'
import { readJson } from '../../../../utils/store'

export default defineEventHandler((event) => {
  const user = getCurrentUser(event)
  if (!user) return { orders: [] }
  const orders = readJson<any[]>('orders.json', [])
  return { orders: orders.filter((o) => o.userId === user.id) }
})
