// GET /api/app/v1/order/get-services
// 对齐原站 Order.GetServices 契约（原站为 POST，参数为数字 document_id）。
// 此处返回从 photogov.net 真实抓取的价格快照（data/orderServices.json），
// 价格档位与货币均为真实值，克隆站自带数据、无需运行时外链原站。
import services from '../../../../../data/orderServices.json'

export default defineEventHandler((event) => {
  const docId = getQuery(event).document_id
  // 原站不同文档的价格档位一致，快照即通用；保留 document_id 透传以便前端核对。
  return {
    ...(services as any).data,
    document_id: docId ? Number(docId) : null
  }
})
