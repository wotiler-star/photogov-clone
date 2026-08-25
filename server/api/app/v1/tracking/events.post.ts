// POST /api/app/v1/tracking/events  (对齐原站前端埋点)
// demo 模式：接收事件并记入服务端日志，不对外发送。
export default defineEventHandler(async (event) => {
  const body = await readBody(event).catch(() => ({}))
  // 生产环境此处会转发到分析服务；克隆版仅记录。
  console.log('[track]', JSON.stringify(body))
  return { ok: true }
})
