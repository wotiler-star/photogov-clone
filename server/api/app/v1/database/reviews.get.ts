// GET /api/app/v1/database/reviews
// 对齐原站 Database.Reviews 契约（原站为 POST）。
// 返回从 photogov.net 真实抓取的 Trustpilot 评价快照 + 聚合统计（data/reviews.json）。
// 克隆站自带数据，无需运行时外链原站。
import reviews from '../../../../../data/reviews.json'

export default defineEventHandler((event) => {
  const q = getQuery(event)
  const limit = q.limit ? Math.min(Math.max(parseInt(String(q.limit), 10) || 50, 1), 50) : 50
  const data = (reviews as any).data
  return {
    ...data,
    reviews: (data.reviews || []).slice(0, limit)
  }
})
