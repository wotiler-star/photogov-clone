// POST /api/app/v1/meta-capi/track  (对齐原站 Meta Conversions API)
// demo 模式：接收事件，记录日志（无真实 Meta Pixel 密钥）。
export default defineEventHandler(async (event) => {
  const body = await readBody(event).catch(() => ({}))
  console.log('[meta-capi]', JSON.stringify(body))
  return { ok: true }
})
